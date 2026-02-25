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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });
    }

    try {
        const { rawText, systemInstruction } = req.body;

        if (!rawText) {
            return res.status(400).json({ error: 'rawText is required.' });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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

        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            return res.status(geminiResponse.status).json({ error: errText });
        }

        const data = await geminiResponse.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}
