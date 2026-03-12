/**
 * server.js - Local Development Server
 * Serves static files AND proxies /api/format to Gemini API (server-side)
 * This mimics the Vercel deployment environment locally.
 * 
 * Usage: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex).trim();
                const value = trimmed.substring(eqIndex + 1).trim();
                process.env[key] = value;
            }
        }
    });
}

const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain',
};

/**
 * Handles POST /api/format - proxies to Gemini API (server-side)
 * Same logic as Vercel serverless function api/format.js
 */
async function handleApiFormat(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk;
    });

    req.on('end', async () => {
        try {
            const parsedBody = JSON.parse(body);
            const { rawText, systemInstruction, isMermaidFix } = parsedBody;

            if (!rawText) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'rawText is required.' }));
            }

            // Check for custom API key from the frontend
            const customKey = req.headers['x-custom-api-key'];

            // Determine our pool of keys to try
            // RAW_API_KEYS is defined globally (assuming it exists higher up)
            let keysToTry = customKey ? [customKey] : RAW_API_KEYS;

            if (keysToTry.length === 0) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'No GEMINI_API_KEY found on server.' }));
            }

            const requestBody = {
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts: [{ text: rawText }] }],
                generationConfig: { temperature: 0.1, responseMimeType: isMermaidFix ? "text/plain" : "application/json" }
            };

            let lastResponse = null;
            let lastErrorHtml = null;

            // --- Key Rotation Logic ---
            for (let i = 0; i < keysToTry.length; i++) {
                const currentKey = keysToTry[i];
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`;

                console.log(`[Proxy] Trying API Key ${i + 1} of ${keysToTry.length}...`);

                const geminiResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (geminiResponse.ok) {
                    const data = await geminiResponse.json();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(data));
                }

                // If it failed, record the error
                const errText = await geminiResponse.text();
                lastResponse = geminiResponse;
                lastErrorHtml = errText;

                // Check if it's a rate limit. If it is, and we have more keys, continue loop.
                const isRateLimit = geminiResponse.status === 429 || errText.includes('quota') || errText.includes('RESOURCE_EXHAUSTED');

                if (isRateLimit && i < keysToTry.length - 1) {
                    console.warn(`[Proxy] Key ${i + 1} rate limited. Rotating to next key...`);
                    continue;
                } else {
                    // Either not a rate limit (bad request) or we are out of keys -> break and fail
                    break;
                }
            }

            // If we get here, all attempted keys failed
            console.error('[Proxy Error] All keys exhausted or final API failure:', lastResponse.status, lastErrorHtml);
            res.writeHead(lastResponse.status, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: lastErrorHtml }));

        } catch (error) {
            console.error('[Proxy Error] Internal catch:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Internal server error processing format request.' }));
        }
    });
}

/**
 * Serves static files from the project directory
 */
function serveStaticFile(req, res) {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

// Create the HTTP server
const server = http.createServer((req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-custom-api-key',
        });
        res.end();
        return;
    }

    // Route: POST /api/format → Gemini proxy
    if (req.method === 'POST' && req.url === '/api/format') {
        handleApiFormat(req, res);
        return;
    }

    // Everything else → static files
    serveStaticFile(req, res);
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  🚀 Smart Text Formatter - Local Dev Server   ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log(`║  URL: http://localhost:${PORT}                   ║`);
    console.log(`║  API Key: ${GEMINI_API_KEY ? '✅ Loaded from .env' : '❌ NOT FOUND'}            ║`);
    console.log('║  API Proxy: /api/format → Gemini (server-side) ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('');
});
