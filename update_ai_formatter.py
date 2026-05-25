import re
with open(r'c:\Users\ayyub\.gemini\antigravity\scratch\NewProject\js\aiFormatter.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace formatText signature
content = content.replace('async formatText(rawText) {', 'async formatText(rawText, referencePdfBase64 = null, customRules = null) {')

# Find where systemInstruction is defined
old_system_prompt_start = 'const systemInstruction = `You are a strict document structure classifier API.'
old_system_prompt_end = '6. Do NOT return markdown formatting like \\`\\`\\`json. Return only raw JSON data.`;'

old_prompt_full = content[content.find(old_system_prompt_start):content.find(old_system_prompt_end)+len(old_system_prompt_end)]

new_prompt_logic = r'''
        let systemInstruction = `You are a strict document structure classifier API.
Your job is to read unstructured text (from OCR, Google Lens, etc.) and break it down into logical blocks.
For each logical block, determine its semantic type.

Rules:
1. You MUST return a valid JSON array of objects.
2. Each object MUST have precisely two keys: "type" and "content".
3. "type" MUST be exactly one of: "h1", "h2", "sub-subheading", "p", "ul", "ol", "code".
   - Use "h1" for the single main title of the document.
   - Use "h2" for main section headings (like "1. Introduction", "Abstract", "Methodology", "2. Literature Review").
   - Use "sub-subheading" for nested numerical/alphabetical subheadings (like "1.1. Approach", "A. Dataset", "2.3. Results").
   - Use "p" for regular body text ONLY. If a sentence has been split into multiple lines, combine it into one single content string.
4. For heading and paragraph types ("h1", "h2", "sub-subheading", "p", "code"), your object MUST have a "content" string.
   For list types ("ul", "ol"), your object MUST NOT have "content". Instead, it MUST have an "items" array of strings, where each string is a single bullet point or numbered item.
5. "content" (or "items" strings) MUST contain the exact text, EXCEPT for the specific OCR/PDF cleanup rules defined below.

--- CRITICAL SEPARATION RULE ---
HEADINGS AND BODY TEXT MUST ALWAYS BE SEPARATE OBJECTS.
- A heading (h1, h2, sub-subheading) must NEVER contain body paragraph text in the same object.
- A body paragraph (p) must NEVER contain heading text.
- If a heading like "1. Introduction" or "ABSTRACT" is immediately followed by paragraph text on the same line or next line, you MUST split them into two separate JSON objects: one for the heading and one for the paragraph.
- Example 1: If input is "1. Introduction The rapid evolution...", output MUST be:
  [{"type": "h2", "content": "1. Introduction"}, {"type": "p", "content": "The rapid evolution..."}]
- Example 2 (Run-in Headings): If input is "ABSTRACT Due to the pace in...", output MUST be:
  [{"type": "h2", "content": "ABSTRACT"}, {"type": "p", "content": "Due to the pace in..."}]

--- ADVANCED HEADING vs BODY TEXT DETECTION RULES ---
Use these heuristics to classify content accurately:

A. HEADINGS are ALWAYS:
   - SHORT: Typically under 12 words. If text has more than 15 words, it is almost certainly a paragraph, not a heading.
   - DO NOT end with a period (.). Body text sentences end with periods. Headings don't.
   - Are often in TITLE CASE or ALL CAPS.
   - Often start with numbers like "1.", "2.", "3.1", "IV.", "A." etc.
   - Common standalone heading keywords: Abstract, Introduction, Methodology, Literature Review, Conclusion, Conclusions, References, Acknowledgment, Acknowledgments, Overview, Results, Discussion, Future Work, Bibliography, Appendix, Summary, Background, Related Work, System Design, Implementation, Testing, Analysis.
   - If a line matches "Chapter X" or "Section X" patterns, it's always a heading (h2).

B. BODY TEXT (paragraphs) are ALWAYS:
   - LONG: Multiple sentences, typically 20+ words.
   - Contain full sentences that END with periods, question marks, or exclamation marks.
   - Flow naturally as continuous prose.
   - NEVER classify a full flowing sentence as a heading, even if it appears on its own line.

C. TRICKY CASES — resolve as follows:
   - "Smart Text Formatter" (short, no period) → h1 or h2
   - "The system implements a modular architecture for text processing." (long, ends with period) → p
   - "2.1 System Architecture" → sub-subheading
   - "2. System Design" → h2
   - "This chapter discusses the design decisions made during development." → p (it's a sentence, NOT a heading)
   - "Object-Oriented Programming" (short, no period, title case) → likely h2 or sub-subheading depending on context
   - Lines that are just labels like "Figure 1", "Table 2" → p

--- DISTINGUISHING sub-subheading FROM p ---
- "sub-subheading" is for nested headings with multi-level numbering (e.g., "2.1", "3.2.1") or single letters (e.g., "A.", "B.").
- "p" is for flowing body text, usually multiple sentences long.
- A sub-subheading is SHORT (usually under 10 words) and acts as a section label.
- If text is long and contains full sentences, it is a "p", never a sub-subheading.

--- PLAIN TEXT DIAGRAM RULE ---
- If you see text-based diagrams using ASCII art characters (├──, └──, ▼, →, |, etc.), tree structures, or arrow flows, classify them as "p" type. Do NOT try to convert them into any special type.
- Placeholder texts like "%%MERMAID_PLACEHOLDER_0%%" should be classified as "p" type and passed through unchanged.

--- OCR, PDF & AI BOILERPLATE CLEANUP RULES ---
A. CITATIONS: Google Lens often mangles academic citations at the ends of sentences (e.g., "energy 4", "[1] [21.", "[1], 12), [31, (4]").
   - You MUST detect these broken citations and format them cleanly as SEPARATE standard brackets: "[1]" or "[1] [2] [4]".
   - NEVER use comma-separated groups like "[1, 2, 4]". Every citation number gets its own bracket.
   - EXTREME STRICTNESS: Only format numbers exactly between 1 and 5 as citations. 
   - NEVER format floating numbers like 12, 13, 14, 21, 31, or 41 as citations. If you see them trailing a sentence, they are OCR noise. IGNORE them completely and remove them from the output text.
   - Crucially, these fixed citations MUST remain attached to the very end of the sentence inside their parent "p" block. Do NOT split them into a new block, and do NOT classify them as an "h2".
B. FLOATING NOISE: If you detect stray PDF page numbers (e.g., a single line that just says "12" or "Page 4") or trailing large numerals above 5, completely IGNORE and REMOVE that block from your JSON array.
C. AI BOILERPLATE & CONVERSATIONAL FILLER: Users often paste text containing instructions, prompt templates, expected behaviors, or AI conversational fillers like "Here is the diagram you requested:", "Sure, here is the formatted text:", "Below is a flowchart:", "Expected Behavior Summary", or "When you paste TEST 1...". 
   - COMPLETELY IGNORE AND REMOVE all conversational filler, prompt instructions, and meta-descriptions from your JSON output. 
   - Do NOT classify AI conversational text or testing instructions as "p" or "h1" blocks. 
   - Only return the actual factual content of the document being formatted. If a paragraph is just the AI talking to the user or explaining a test case, drop it entirely!
D. TYPOS: Do not fix general spelling mistakes or grammar. Only fix the citations as requested above.

6. Do NOT return markdown formatting like \\\`\\\`\\\`json. Return only raw JSON data.\`;

        if (referencePdfBase64) {
            systemInstruction = \`TASK:
1. Analyze the attached Reference PDF to understand the document structure.
2. Format the Raw User Input Text following the EXACT document structure, heading hierarchy, and page layout rules found in the Reference PDF.
3. OUTPUT FORMAT:
   - You MUST return a JSON array containing EXACTLY ONE object.
   - The object MUST have: {"type": "html", "content": "<YOUR_GENERATED_HTML_STRING>"}
   - Do NOT return plain text or markdown, ONLY this JSON structure.
4. HARD RULES:
   - DO NOT copy or include any text content from the Reference PDF. Use ONLY the Raw Input Text provided.
   - Output must be clean HTML with inline styles. Apply styles (like font-family, font-size, alignment) inline to the HTML tags.
   - DO NOT change the meaning or words of the Raw Input Text.\`;
            
            if (customRules) {
                systemInstruction += \`\n\nApply these styling rules exactly in the inline styles:
- H1: \${customRules.h1?.['font-family'] || 'inherit'}, \${customRules.h1?.['font-size'] || '16pt'}
- H2: \${customRules.h2?.['font-family'] || 'inherit'}, \${customRules.h2?.['font-size'] || '16pt'}
- Body: \${customRules.p?.['font-family'] || 'inherit'}, \${customRules.p?.['font-size'] || '12pt'}
- Text Alignment: \${customRules.global?.['text-align'] || 'left'}\`;
            }
        }
'''

content = content.replace(old_prompt_full, new_prompt_logic)

# Replace the payload inside direct api call
content = content.replace('contents: [{ parts: [{ text: rawText }] }],', 
'''contents: referencePdfBase64 ? [{
                    parts: [
                        { inlineData: { mimeType: "application/pdf", data: referencePdfBase64 } },
                        { text: "RAW USER INPUT TEXT:\\n" + rawText }
                    ]
                }] : [{ parts: [{ text: rawText }] }],''')

# Replace the payload inside server proxy
content = content.replace('body: JSON.stringify({ rawText, systemInstruction })', 'body: JSON.stringify({ rawText, systemInstruction, referencePdfBase64, customRules })')

with open(r'c:\Users\ayyub\.gemini\antigravity\scratch\NewProject\js\aiFormatter.js', 'w', encoding='utf-8') as f:
    f.write(content)
