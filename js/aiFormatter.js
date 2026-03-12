/**
 * aiFormatter.js
 * Connects to the Gemini REST API to intelligently classify text structures.
 */

class AIFormatter {
    constructor() {
        // No static caching needed. We fetch fresh on every format run.
    }

    /**
     * Sends raw text to Gemini to classify it into ElementObjects
     * @param {string} rawText 
     * @returns {Promise<Array<Object>>} JSON array of classified text blocks
     */
    async formatText(rawText) {

        // Fetch the freshest key from localStorage right before API call
        const activeLocalApiKey = window.GEMINI_API_KEY_LOCAL || localStorage.getItem('gemini_api_key') || '';

        const systemInstruction = `You are a strict document structure classifier API.
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
- If a heading like "1. Introduction" is immediately followed by paragraph text on the same line or next line, you MUST split them into two separate JSON objects: one for the heading and one for the paragraph.
- Example: If input is "1. Introduction The rapid evolution...", output MUST be:
  [{"type": "h2", "content": "1. Introduction"}, {"type": "p", "content": "The rapid evolution..."}]

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
C. AI BOILERPLATE & CONVERSATIONAL FILLER: ChatGPT and Gemini often include conversational text like "Here is the diagram you requested:", "Sure, here is the formatted text:", "Below is a flowchart:", or "Certainly!". COMPLETELY IGNORE AND REMOVE this conversational filler from your JSON output. Do NOT classify it as a "p" block. Only return the actual factual content of the document.
D. TYPOS: Do not fix general spelling mistakes or grammar. Only fix the citations as requested above.

6. Do NOT return markdown formatting like \\\`\\\`\\\`json. Return only raw JSON data.`;

        // ============================================================
        // PATH 1: User has a CUSTOM API key → call Gemini DIRECTLY
        //          (bypasses the Node proxy entirely, uses user's quota)
        // ============================================================
        if (activeLocalApiKey) {
            console.log('[AIFormatter] Custom API key found — calling Gemini DIRECTLY (bypassing proxy)...');
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeLocalApiKey}`;

            const requestBody = {
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts: [{ text: rawText }] }],
                generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[AIFormatter] ❌ Direct Gemini API Failed:', response.status, errText);
                throw new Error(`Gemini API Failed: ${response.status} - ${errText}`);
            }

            console.log('[AIFormatter] ✅ Direct Gemini API succeeded!');
            const data = await response.json();
            return this._parseResponse(data);
        }

        // ============================================================
        // PATH 2: No custom key → use the server-side proxy (Vercel/.env)
        // ============================================================
        try {
            console.log('[AIFormatter] No custom key. Trying server proxy /api/format ...');
            const proxyResponse = await fetch('/api/format', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawText, systemInstruction })
            });

            if (proxyResponse.ok) {
                console.log('[AIFormatter] ✅ Server proxy succeeded!');
                const data = await proxyResponse.json();
                return this._parseResponse(data);
            } else {
                const errText = await proxyResponse.text();
                console.error('[AIFormatter] ❌ Server proxy error:', proxyResponse.status, errText);
                throw new Error(`Gemini API Failed: ${proxyResponse.status} - ${errText}`);
            }
        } catch (proxyErr) {
            console.error('[AIFormatter] Server proxy unavailable:', proxyErr.message);
            throw new Error("No API key available. Open the ☰ Settings menu and enter your free Gemini API key to format text.");
        }
    }

    /**
     * Specialized method to auto-heal broken Mermaid syntax using Gemini
     * @param {string} invalidCode The syntax that crashed html2pdf/mermaid
     * @param {string} errorMessage The specific error thrown by the mermaid renderer
     * @returns {Promise<string>} The corrected raw mermaid code
     */
    async fixMermaid(invalidCode, errorMessage) {
        const activeLocalApiKey = window.GEMINI_API_KEY_LOCAL || localStorage.getItem('gemini_api_key') || '';
        
        const systemInstruction = `You are an expert Mermaid JS syntax validator and healer.
The following Mermaid diagram code threw a syntax error in the browser renderer.
Error thrown: "${errorMessage}"

Your job is to find the syntax error in the code and fix it.
CRITICAL RULES:
1. Return ONLY the raw, fixed Mermaid code.
2. DO NOT return markdown blocks like \`\`\`mermaid or \`\`\`. 
3. DO NOT output any conversational text like "Here is the fixed code:".
4. Make the minimal necessary changes to make it compile successfully.`;

        // PATH 1: Direct to Google
        if (activeLocalApiKey) {
            console.log('[AIFormatter] Auto-Healing Mermaid directly via Gemini API...');
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeLocalApiKey}`;

            const requestBody = {
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts: [{ text: invalidCode }] }],
                generationConfig: { temperature: 0.1, responseMimeType: "text/plain" }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error("Auto-Heal direct API failed.");
            
            const data = await response.json();
            const fixedCode = data.candidates[0].content.parts[0].text.trim();
            // Clean markdown wrappers if hallucinated
            return fixedCode.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
        }

        // PATH 2: Server Proxy
        console.log('[AIFormatter] Auto-Healing Mermaid via server proxy...');
        const proxyResponse = await fetch('/api/format', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                rawText: invalidCode, 
                systemInstruction,
                isMermaidFix: true // Flag to tell server NOT to expect JSON schema parsing
            })
        });

        if (proxyResponse.ok) {
            const data = await proxyResponse.json();
            
            // Expected backend format might vary based on how we write the new format.js flag, 
            // but assuming if isMermaidFix is true, it returns `{ fixedCode: "..." }` or the raw text Candidate.
            // Support both potential backend designs:
            let fixedCode = data.fixedCode || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            fixedCode = fixedCode.trim();
            return fixedCode.replace(/^```[a-z]*\s*/i, '').replace(/\s*构*```$/, '').replace(/\s*```$/, '').trim();
        } else {
            throw new Error("Auto-Heal proxy API failed.");
        }
    }

    /**
     * Parses the raw Gemini HTML/JSON classification response into a clean UI JSON array
     */
    _parseResponse(data) {
        const outputText = data.candidates[0].content.parts[0].text;
        let cleanJson = outputText.trim();
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        return JSON.parse(cleanJson);
    }
}

// Export for usage
window.AIFormatter = AIFormatter;
