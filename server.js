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
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        try {
            const { rawText, systemInstruction } = JSON.parse(body);

            if (!rawText) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'rawText is required.' }));
                return;
            }

            if (!GEMINI_API_KEY) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY not found in .env file.' }));
                return;
            }

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

            const requestBody = JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts: [{ text: rawText }] }],
                generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
            });

            const urlObj = new URL(geminiUrl);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                },
            };

            console.log('[Server] Proxying to Gemini API (server-side)...');

            const geminiReq = https.request(options, (geminiRes) => {
                let responseData = '';
                geminiRes.on('data', chunk => { responseData += chunk; });
                geminiRes.on('end', () => {
                    if (geminiRes.statusCode === 200) {
                        console.log('[Server] ✅ Gemini API responded successfully!');
                        res.writeHead(200, {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                        });

                        // We must send the JSON data exactly as the frontend expects it.
                        // Since aiFormatter.js expects `data.candidates[0].content.parts[0].text`
                        // we can just forward the parsed Gemini response directly.
                        try {
                            const parsedData = JSON.parse(responseData);
                            res.end(JSON.stringify(parsedData));
                        } catch (e) {
                            console.error('[Server] Failed to parse Gemini response JSON:', e);
                            res.end(responseData); // Fallback to raw string
                        }

                    } else {
                        console.error(`[Server] ❌ Gemini API error: ${geminiRes.statusCode}`);
                        res.writeHead(geminiRes.statusCode, {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                        });
                        res.end(responseData);
                    }
                });
            });

            geminiReq.on('error', (err) => {
                console.error('[Server] ❌ Network error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            });

            geminiReq.write(requestBody);
            geminiReq.end();

        } catch (parseErr) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON body.' }));
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
            'Access-Control-Allow-Headers': 'Content-Type',
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
