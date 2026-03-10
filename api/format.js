/**
 * Vercel Serverless Function: /api/format
 * Proxies text formatting requests to the Gemini API
 * so the API key stays server-side and never reaches the browser.
 */
export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const rawApiKeyEnv = process.env.GEMINI_API_KEY;
    if (!rawApiKeyEnv) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });
    }

    // Parse out our pool of keys (comma separated in Vercel settings)
    const apiKeys = rawApiKeyEnv.split(',').map(k => k.trim()).filter(k => k);

    if (apiKeys.length === 0) {
        return res.status(500).json({ error: 'No valid API keys found in the GEMINI_API_KEY env variable.' });
    }

    try {
        const { rawText, systemInstruction } = req.body;

        if (!rawText) {
            return res.status(400).json({ error: 'rawText is required.' });
        }

        const requestBody = {
            system_instruction: {
                parts: [{ text: systemInstruction }]
            },
            contents: [{
                parts: [{ text: rawText }]
            }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        };

        let lastResponseStatus = 500;
        let lastErrorData = "Unknown Error";

        // Try each key sequentially if we hit a Rate Limit
        for (let i = 0; i < apiKeys.length; i++) {
            const currentKey = apiKeys[i];
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`;

            console.log(`[Vercel Vercel] Trying API Key ${i + 1} of ${apiKeys.length}...`);

            const geminiResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (geminiResponse.ok) {
                const data = await geminiResponse.json();
                return res.status(200).json(data);
            }

            // It failed. Read the error.
            lastErrorData = await geminiResponse.text();
            lastResponseStatus = geminiResponse.status;

            // If it's a rate limit/quota error, try the next key
            const isRateLimit = lastResponseStatus === 429 || lastErrorData.includes('quota') || lastErrorData.includes('RESOURCE_EXHAUSTED');

            if (isRateLimit && i < apiKeys.length - 1) {
                console.warn(`[Vercel Proxy] Key ${i + 1} exhausted. Failing over to next key...`);
                continue;
            } else {
                // E.g., a 400 Bad Request, or we are completely out of keys
                break;
            }
        }

        // Output the final error if all failed or non-retryable error
        console.error('[Vercel Proxy] Final Error:', lastResponseStatus, lastErrorData);
        return res.status(lastResponseStatus).json({ error: lastErrorData });

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}
