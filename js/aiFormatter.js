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

        // Fetch the freshest key from localStorage right before API call
        const activeLocalApiKey = window.GEMINI_API_KEY_LOCAL || localStorage.getItem('gemini_api_key') || '';

        const systemInstruction = `You are a strict document structure classifier API.
Your job is to read unstructured text (from OCR, Google Lens, etc.) and break it down into logical blocks.
For each logical block, determine its semantic type.

Rules:
1. You MUST return a valid JSON array of objects.
2. Each object MUST have a "type" key.
3. "type" MUST be exactly one of: "heading", "p", "ul", "ol", "code", "image", "table", "equation", "blockquote", "references", "warning", "info".
   - Use "heading" for titles and sections. You MUST include a "depth" integer (1 for main title/sections, 2 for sub-sections, 3 for sub-sub-sections).
   - Use "p" for regular body text ONLY. Combine split lines into a single content string.
   - Use "image" ONLY when placing a multimodal image provided in the prompt.
   - Use "table" for tabular data. MUST include "headers" array and "rows" array (array of arrays).
   - Use "equation" for mathematical formulas. Include "format": "latex".
   - Use "blockquote" for quoted text. Optionally include "attribution".
   - Use "references" for academic citations. MUST include "items" array with "id" and "text".
4. For "heading", "p", "code", "image", "equation", "blockquote", "warning", "info", your object MUST have a "content" string.
   For "ul", "ol", your object MUST NOT have "content". Instead, it MUST have an "items" array of strings.
5. "content" (or "items" strings) MUST contain the exact text, EXCEPT for the OCR/PDF cleanup rules.

--- CRITICAL SEPARATION RULE ---
HEADINGS AND BODY TEXT MUST ALWAYS BE SEPARATE OBJECTS.
- A heading must NEVER contain body paragraph text in the same object.
- Example: If input is "1. Introduction The rapid evolution...", output MUST be:
  [{"type": "heading", "depth": 1, "content": "1. Introduction"}, {"type": "p", "content": "The rapid evolution..."}]

--- ADVANCED HEADING vs BODY TEXT DETECTION RULES ---
A. HEADINGS are ALWAYS:
   - SHORT: Typically under 12 words.
   - DO NOT end with a period (.).
B. BODY TEXT (paragraphs) are ALWAYS:
   - LONG: Multiple sentences, typically 20+ words.
   - Contain full sentences that END with periods or question marks.

--- EDGE CASES & ERROR HANDLING ---
- EMPTY INPUT: If the raw text contains no meaningful content, return: [{"type": "warning", "content": "No meaningful content found."}]
- MISSING REQUIRED SECTIONS: If 'required' sections from the skeleton_definition are missing, append: [{"type": "info", "content": "The following sections were missing: [List]"}]
- DUPLICATE HEADINGS: Merge content sequentially under the same skeleton block.

--- OCR, PDF & AI BOILERPLATE CLEANUP RULES ---
A. CITATIONS: Fix broken OCR citations at the ends of sentences to standard brackets: "[1] [2]". Keep them attached to the end of the sentence inside the "p" block. DO NOT use comma-separated groups like "[1, 2]".
B. FLOATING NOISE: IGNORE stray PDF page numbers (e.g. "12", "Page 4").
C. AI BOILERPLATE: REMOVE all conversational filler like "Here is the output:". Only return the factual content.

6. Do NOT return markdown formatting like \`\`\`json. Return only raw JSON data.

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
            parts.push({ text: rawText });

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
1. Return ONLY the raw, perfectly valid JSON array.
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
        
        // Auto-fix: Regex extraction to ignore conversational filler
        const match = cleanJson.match(/\[[\s\S]*\]/);
        if (match) {
            cleanJson = match[0];
        }

        // Auto-fix: Remove trailing commas
        cleanJson = cleanJson.replace(/,\s*([\]}])/g, '$1');
        
        try {
            const parsedArray = JSON.parse(cleanJson);
            if (!Array.isArray(parsedArray)) {
                throw new Error("Output is not a JSON array.");
            }
            return parsedArray;
        } catch (err) {
            console.warn("[AIFormatter] JSON parse failed! Triggering self-correction loop...", err);
            const fixedJsonStr = await this.fixJsonSyntax(cleanJson, err.message);
            const parsedArray = JSON.parse(fixedJsonStr);
            if (!Array.isArray(parsedArray)) {
                throw new Error("Fixed output is not a JSON array.");
            }
            return parsedArray;
        }
    }
}

// Export for usage
window.AIFormatter = AIFormatter;
