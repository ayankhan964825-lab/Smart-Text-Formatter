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
     * @param {Array<Object>} images Array of uploaded images
     * @returns {Promise<Array<Object>>} JSON array of classified text blocks
     */
    async formatText(rawText, images = []) {
        
        // ============================================================
        // LAYER 1: PRE-PROCESSOR — Strip AI-generated fluff BEFORE API call
        // ============================================================
        let processedTextForGemini = this._stripAIFluff(rawText);
        
        // ============================================================
        // PASS 1: UNSTRUCTURED.IO EXTRACTION (DUAL-ENGINE ARCHITECTURE)
        // ============================================================
        try {
            console.log('[AIFormatter] [Pass 1] Sending text to Unstructured API via backend...');
            // Convert raw text to a file blob
            const textBlob = new Blob([rawText], { type: 'text/plain' });
            const formData = new FormData();
            formData.append('file', textBlob, 'raw_input.txt');
            
            const unstructuredRes = await fetch('http://127.0.0.1:8000/api/parse-unstructured', {
                method: 'POST',
                body: formData
            });
            
            if (unstructuredRes.ok) {
                const parsedElements = await unstructuredRes.json();
                console.log('[AIFormatter] [Pass 1] Unstructured API success:', parsedElements);
                
                // Convert the rich Unstructured JSON to a simplified string format for Gemini
                const simplifiedContext = parsedElements.map(el => `[${el.type}]: ${el.text}`).join('\n\n');
                
                processedTextForGemini = `--- UNSTRUCTURED API PARSED ELEMENTS ---\n` +
                                         `The following text has been pre-processed by an OCR engine. Use the [Type] hints to help format the final document:\n\n` +
                                         simplifiedContext;
            } else {
                console.warn('[AIFormatter] [Pass 1] Unstructured API failed. Falling back to raw text. Status:', unstructuredRes.status);
            }
        } catch (e) {
            console.warn('[AIFormatter] [Pass 1] Error reaching Python Backend for Unstructured API. Make sure python backend is running. Falling back to raw text. Error:', e);
        }

        // Fetch the freshest key from localStorage right before API call
        const activeLocalApiKey = window.GEMINI_API_KEY_LOCAL || localStorage.getItem('gemini_api_key') || '';

        const systemInstruction = `You are the "Advanced Document Architect AI". Your primary job is to take raw, unstructured user text and format it into a highly professional document based on specific rules, a visual skeleton, and an optional reference style.

CORE DIRECTIVES (STRICTLY FOLLOW THESE):

1. STRICT OUTPUT SCHEMA
You must output ONLY a valid JSON OBJECT with exactly two keys:
{
  "ai_thoughts": "Your step-by-step reasoning here...",
  "final_document": [ ...document blocks array... ]
}
Do not wrap it in markdown blockquotes or add any text outside the JSON object.

The "final_document" array contains block objects. Each block MUST have a "type" key.
Allowed Types:
- "heading": For titles and sections. MUST include a "depth" integer.
- "p": For regular body text ONLY. Combine split sentences.
- "table": For tabular data. MUST include "headers" array and "rows" array (array of arrays). USE THIS FOR INVOICES, RECEIPTS, AND ITEM LISTS.
- "equation": For mathematical formulas. Include "format": "latex".
- "blockquote": For quoted text. Optionally include "attribution".
- "warning" / "info": For callouts or missing section notices.
- "ul" / "ol": For lists. MUST NOT have "content". MUST have an "items" array of strings.
- "image": ONLY when instructed to place an uploaded image. Format: {"type": "image", "src": "[image_name]", "caption": "[relevant_caption]"}.
- "mermaid": For flowcharts, graphs, or bar diagrams. MUST include "content" with raw mermaid syntax.
- "references": For citations. MUST include "items" array with "id" and "text".

2. CONTENT FILTERING & TABLE RULES (IMPORTANT)
- FLUFF REMOVAL (MANDATORY): You MUST detect and REMOVE all AI-generated wrapper text and conversational filler that is NOT part of the actual document. This includes:
  * Opening fluff: "Here is the information...", "Sure! Here's your...", "I've prepared...", "Below is...", "Yeh lo...", "Yeh raha..."
  * Closing fluff: "I hope this helps!", "Let me know if you need...", "Feel free to ask...", "Is there anything else..."
  * Meta-instructions: "Please format this", "Format the following text", "Can you convert this..."
  These are NOT document content — they are chat artifacts. ALWAYS remove them. Never include them as headings, paragraphs, or table rows.
- TABLE RULE: If the text is a raw invoice, receipt, or data dump, you MUST convert the ENTIRE content (including metadata like date, address, GSTIN, and items) into a SINGLE comprehensive "table" block (e.g., with two columns: "Field" and "Value"). Do NOT split metadata into paragraphs.
- NARRATIVE EXCEPTION: However, if items/quantities are written as part of a natural narrative story (e.g., "I bought 2 laptops for $500 each."), keep it as a paragraph ("p"). Preserve the author's narrative intent.

3. HEADING DEPTH LOGIC
Whenever you use the "heading" type, you MUST include a "depth" integer:
- depth: 1 = Main Document Title
- depth: 2 = Major Sections (e.g., Introduction, Methodology)
- depth: 3 = Sub-sections (e.g., 1.1 Data Sources)
HEADINGS AND BODY TEXT MUST ALWAYS BE SEPARATE OBJECTS. A heading must NEVER contain body paragraph text in the same object.

4. SKELETON MAPPING ENFORCEMENT
You will be provided with a 'Skeleton Definition' below. You MUST organize the final document exactly in the order specified by the Skeleton.
- If the user's raw text belongs to a section but lacks a heading, you MUST generate the appropriate "heading" block for it.
- Do not invent new sections that are not in the Skeleton.
- If a section is marked "required: false" and there is no relevant raw text, skip it.
- If a section is marked "required: true" and is missing, append: {"type": "warning", "content": "Missing required section: [Section Name]"} at the end.

5. RULE HIERARCHY (CONFLICT RESOLUTION)
If there are conflicting instructions, follow this strict hierarchy:
Priority 1 (Highest): The Skeleton Definition sections and order.
Priority 2: The formatting rules of the 'Selected Template' (e.g., specific question/answer formats).
Priority 3 (Lowest): The style of the 'Reference PDF'.

6. CONTENT PRESERVATION (MOST CRITICAL RULE)
Your #1 job is to PRESERVE the user's ACTUAL document content EXACTLY as they wrote it.
- DO NOT rewrite, rephrase, paraphrase, summarize, or change the user's core sentences in ANY way.
- DO NOT replace the user's words with synonyms or "better" words.
- DO NOT add new sentences, facts, examples, or explanations that the user did not write.
- EXCEPTION: You MUST STILL remove conversational fluff and meta-instructions as defined in Rule 2. Only preserve the true document content.
- The ONLY changes you are allowed to make:
  a) Fix obvious OCR/scanning typos (e.g., "th3" → "the", broken characters).
  b) Merge lines that were split by OCR into proper sentences.
  c) Add heading blocks from the Skeleton if the user's text lacks explicit headings.
  d) Organize/reorder existing content to match the Skeleton section order.
- If a Reference PDF is provided, analyze its STRUCTURE LAYOUT only (e.g., heading styles, spacing). DO NOT copy its tone, wording, or rewrite user text to match it.
- Think of yourself as a DOCUMENT FORMATTER, not a CONTENT WRITER. You format and organize — you NEVER rewrite.

--- EXECUTION STRATEGY (Chain of Thought) ---
Before writing the final_document, you MUST think step-by-step inside the "ai_thoughts" key:
Step 1: STYLE EXTRACTION — Analyze the Reference PDF (if provided). Note heading styles and document structure layout ONLY. Do NOT plan to rewrite any user content.
Step 2: CONTENT MAPPING — Read the User Raw Text word-by-word. Map each paragraph to the appropriate Skeleton section. Note which user paragraphs go under which skeleton heading.
Step 3: IMAGE CONTEXTUALIZATION — For each attached image, determine its subject. Plan to insert it after the most relevant paragraph.
Step 4: BLOCK ASSEMBLY — Describe the final block order. Confirm that every "p" block contains the user's EXACT original text, not your rewritten version.
Write all 4 steps as a single string in "ai_thoughts". Then write the actual blocks in "final_document".

--- OCR & AI CLEANUP RULES ---
- CITATIONS: Fix broken OCR citations to standard brackets: "[1] [2]". Keep them inside the "p" block. DO NOT use comma-separated groups like "[1, 2]".
- FLOATING NOISE: IGNORE stray PDF page numbers (e.g. "12", "Page 4").
- AI BOILERPLATE: REMOVE all conversational filler. Only return the JSON object.

${window.templateEngine ? window.templateEngine.getPromptContext() : ''}
${window.referenceHandler ? window.referenceHandler.getPromptContext() : ''}`;

        const referencePdf = window.referenceHandler && window.referenceHandler.hasReference() 
            ? window.referenceHandler.getInlineData() 
            : null;

        const callServerProxy = async () => {
            try {
                console.log('[AIFormatter] Trying server proxy /api/format ...');
                const proxyResponse = await fetch('/api/format', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rawText, systemInstruction, images, referencePdf })
                });

                if (proxyResponse.ok) {
                    console.log('[AIFormatter] ✅ Server proxy succeeded!');
                    const data = await proxyResponse.json();
                    return await this._parseResponse(data);
                } else {
                    const errText = await proxyResponse.text();
                    console.error('[AIFormatter] ❌ Server proxy error:', proxyResponse.status, errText);
                    throw new Error(`Gemini API Failed: ${proxyResponse.status} - ${errText}`);
                }
            } catch (proxyErr) {
                console.error('[AIFormatter] Server proxy unavailable. Full error:', proxyErr);
                throw new Error(proxyErr.message || "Server proxy failed — check console for details.");
            }
        };

        // ============================================================
        // PATH 1: User has a CUSTOM API key → call Gemini DIRECTLY
        //          (bypasses the Node proxy entirely, uses user's quota)
        // ============================================================
        if (activeLocalApiKey) {
            console.log('[AIFormatter] Custom API key found — calling Gemini DIRECTLY (bypassing proxy)...');
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeLocalApiKey}`;

            const parts = [];
            if (images && images.length > 0) {
                images.forEach((img, idx) => {
                    parts.push({ text: `[Image ${idx}]` });
                    parts.push({
                        inlineData: {
                            mimeType: img.mimeType,
                            data: img.base64
                        }
                    });
                });
            }

            if (referencePdf) {
                parts.push({
                    inlineData: referencePdf
                });
            }
            parts.push({ text: processedTextForGemini });

            const requestBody = {
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts: parts }],
                generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('[AIFormatter] ❌ Direct Gemini API Failed:', response.status, errText);
                    
                    // If the custom key hit its quota limit, clear it automatically and FALLBACK!
                    if (response.status === 429 || errText.includes('quota') || errText.includes('RESOURCE_EXHAUSTED')) {
                        console.warn('[AIFormatter] Custom API key exhausted. Clearing it and triggering auto-fallback to proxy.');
                        localStorage.removeItem('gemini_api_key');
                        window.GEMINI_API_KEY_LOCAL = '';
                        return await callServerProxy();
                    }

                    throw new Error(`Gemini API Failed (Local Key): ${response.status} - ${errText}`);
                }

                console.log('[AIFormatter] ✅ Direct Gemini API succeeded!');
                const data = await response.json();
                return await this._parseResponse(data);
            } catch (e) {
                // If it was a network error or API error (not caught by the quota check), optionally fallback
                if (e.message.includes('exhausted') || e.message.includes('proxy')) throw e;
                console.error("Direct fetch failed, falling back to proxy:", e);
                return await callServerProxy();
            }
        }

        // ============================================================
        // PATH 2: No custom key → use the server-side proxy (Vercel/.env)
        // ============================================================
        return await callServerProxy();
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
     * Specialized method to auto-heal broken JSON syntax using Gemini
     * @param {string} brokenJson The invalid JSON string
     * @param {string} errorMessage The error thrown by JSON.parse
     * @returns {Promise<string>} The corrected raw JSON string
     */
    async fixJsonSyntax(brokenJson, errorMessage) {
        const activeLocalApiKey = window.GEMINI_API_KEY_LOCAL || localStorage.getItem('gemini_api_key') || '';
        
        const systemInstruction = `You are an expert JSON syntax validator and healer.
The following JSON string threw a SyntaxError during parsing:
Error thrown: "${errorMessage}"

Your job is to find the syntax error in the JSON and fix it.
CRITICAL RULES:
1. Return ONLY the raw, perfectly valid JSON. It may be a JSON object (with keys like "ai_thoughts" and "final_document") or a flat JSON array — preserve the original structure.
2. DO NOT return markdown blocks like \`\`\`json or \`\`\`.
3. DO NOT output any conversational text like "Here is the fixed JSON:".
4. Make the minimal necessary changes (e.g. add missing commas, escape unescaped quotes, close brackets) to make it valid.`;

        // PATH 1: Direct to Google
        if (activeLocalApiKey) {
            console.log('[AIFormatter] Auto-Healing JSON directly via Gemini API...');
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeLocalApiKey}`;

            const requestBody = {
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts: [{ text: brokenJson }] }],
                generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error("Auto-Heal JSON direct API failed.");
            
            const data = await response.json();
            const fixedJson = data.candidates[0].content.parts[0].text.trim();
            return fixedJson.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
        }

        // PATH 2: Server Proxy
        console.log('[AIFormatter] Auto-Healing JSON via server proxy...');
        const proxyResponse = await fetch('/api/format', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                rawText: brokenJson, 
                systemInstruction,
                isMermaidFix: true // Reuse this flag to skip proxy-side schema parsing logic
            })
        });

        if (proxyResponse.ok) {
            const data = await proxyResponse.json();
            let fixedJson = data.fixedCode || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            fixedJson = fixedJson.trim();
            return fixedJson.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
        } else {
            throw new Error("Auto-Heal JSON proxy API failed.");
        }
    }

    /**
     * Parses the raw Gemini HTML/JSON classification response into a clean UI JSON array
     */
    async _parseResponse(data) {
        const outputText = data.candidates[0].content.parts[0].text;
        let cleanJson = outputText.trim();

        // Remove markdown wrappers if present
        cleanJson = cleanJson.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();

        // Remove trailing commas
        cleanJson = cleanJson.replace(/,\s*([\]}])/g, '$1');

        try {
            const parsed = JSON.parse(cleanJson);

            // NEW: Handle CoT JSON Object format { ai_thoughts, final_document }
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.final_document) {
                // Store AI thoughts globally so UI can display them
                window._lastAiThoughts = parsed.ai_thoughts || '';
                console.log('[AIFormatter] 🧠 AI Thoughts:', parsed.ai_thoughts || '(none)');
                const blocks = parsed.final_document;
                if (!Array.isArray(blocks)) throw new Error("final_document is not an array.");
                return blocks;
            }

            // FALLBACK: Handle legacy flat array format
            if (Array.isArray(parsed)) {
                window._lastAiThoughts = '';
                console.log('[AIFormatter] ℹ️ Received legacy flat array (no CoT).');
                return parsed;
            }

            throw new Error("Output is neither a CoT object nor a JSON array.");
        } catch (err) {
            console.warn("[AIFormatter] JSON parse failed! Triggering self-correction...", err);
            const fixedJsonStr = await this.fixJsonSyntax(cleanJson, err.message);
            const fixedParsed = JSON.parse(fixedJsonStr);

            // After auto-heal, check both formats
            if (fixedParsed && typeof fixedParsed === 'object' && !Array.isArray(fixedParsed) && fixedParsed.final_document) {
                window._lastAiThoughts = fixedParsed.ai_thoughts || '';
                return Array.isArray(fixedParsed.final_document) ? fixedParsed.final_document : [];
            }
            if (Array.isArray(fixedParsed)) {
                window._lastAiThoughts = '';
                return fixedParsed;
            }
            throw new Error("Auto-healed output is not valid.");
        }
    }

    /**
     * LAYER 1: Pre-processor to strip AI-generated conversational fluff
     * Removes common wrapper text that AI chatbots add around actual content.
     * This runs BEFORE sending text to Gemini, so the AI only sees clean content.
     */
    _stripAIFluff(text) {
        if (!text || typeof text !== 'string') return text;

        let cleaned = text;

        // ── STEP 1: Remove common AI OPENING lines ──
        // These patterns match the FIRST 1-3 lines only (not the whole document)
        const openingPatterns = [
            // English AI openers
            /^(?:sure[!,.]?\s*)?here(?:'s| is| are)\s+(?:the|your|a|an)\s+.{0,80}(?::\s*\n|\n)/i,
            /^(?:sure|okay|of course|certainly|absolutely)[!,.]?\s*(?:here(?:'s| is| are)|i(?:'ve| have))\s+.{0,80}(?::\s*\n|\n)/i,
            /^(?:sure|okay|of course|certainly|absolutely)[!,.]?\s*\n/i,
            /^(?:i(?:'ve| have)\s+(?:prepared|created|generated|written|drafted|formatted|compiled))\s+.{0,80}(?::\s*\n|\n)/i,
            /^(?:below is|the following is|as requested|as per your request)\s+.{0,80}(?::\s*\n|\n)/i,
            // Hindi AI openers  
            /^(?:yeh lo|ye lo|yeh raha|ye raha|yeh dekho|ye dekho|bilkul|zaroor)\s*.{0,80}(?::\s*\n|\n)/i,
            /^(?:maine|humne)\s+(?:aapke liye|tumhare liye|aapka)\s+.{0,80}(?::\s*\n|\n)/i,
        ];

        for (const pattern of openingPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }

        // ── STEP 2: Remove common AI CLOSING lines ──
        // These patterns match the LAST 1-2 lines only
        const closingPatterns = [
            /\n\s*(?:i hope this helps|hope this helps|hope that helps)[!.]?\s*$/i,
            /\n\s*(?:let me know if you (?:need|want|have|require)\s+.{0,60})[!.]?\s*$/i,
            /\n\s*(?:feel free to (?:ask|reach out|contact|let me know)\s*.{0,60})[!.]?\s*$/i,
            /\n\s*(?:if you (?:need|want|have|require) (?:any |further |more )?(?:help|assistance|clarification|questions)\s*.{0,40})[!.]?\s*$/i,
            /\n\s*(?:is there anything else\s*.{0,40})[?!.]?\s*$/i,
            /\n\s*(?:(?:please |do )?(?:let me know|feel free)\s+if\s+.{0,60})[!.]?\s*$/i,
            // Hindi AI closers
            /\n\s*(?:agar (?:aur|koi|kuch)\s+.{0,40}(?:batana|bataiye|poochna|poochiye))\s*[!.]?\s*$/i,
            /\n\s*(?:umeed hai (?:yeh|ye|aapko)\s*.{0,40})\s*[!.]?\s*$/i,
        ];

        for (const pattern of closingPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }

        // ── STEP 3: Trim any leftover blank lines at start/end ──
        cleaned = cleaned.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '').trim();

        if (cleaned !== text.trim()) {
            console.log('[AIFormatter] 🧹 Pre-processor stripped AI fluff from input.');
        }

        return cleaned;
    }
}

// Export for usage
window.AIFormatter = AIFormatter;
