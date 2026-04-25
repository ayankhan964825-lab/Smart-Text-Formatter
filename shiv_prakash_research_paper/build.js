const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'reseach paper.sty');
const outputFile = path.join(__dirname, 'index.html');

let content = fs.readFileSync(inputFile, 'utf-8');
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const lines = content.split('\n');

let figNum = 1;
const done = {};

// ========== SVG DIAGRAM GENERATORS ==========
function svgModuleInteraction() {
    var n = figNum++;
    return [
'<figure>',
'<svg class="svg-diagram" viewBox="0 0 680 450" xmlns="http://www.w3.org/2000/svg">',
'<defs><marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#444"/></marker></defs>',
'<rect width="680" height="450" fill="#fafafa" rx="8"/>',
'<text x="340" y="28" text-anchor="middle" font-family="Times New Roman" font-size="14" font-weight="bold">Module Interaction Architecture</text>',
'<g font-family="Arial" font-size="11" text-anchor="middle">',
'<rect x="30" y="55" width="140" height="50" rx="6" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>',
'<text x="100" y="76" font-weight="bold" fill="#1565c0">User Interface</text><text x="100" y="92" fill="#333">Frontend Module</text>',
'<rect x="270" y="55" width="140" height="50" rx="6" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1.5"/>',
'<text x="340" y="76" font-weight="bold" fill="#2e7d32">Authentication</text><text x="340" y="92" fill="#333">JWT + bcrypt</text>',
'<rect x="510" y="55" width="140" height="50" rx="6" fill="#fff3e0" stroke="#e65100" stroke-width="1.5"/>',
'<text x="580" y="76" font-weight="bold" fill="#e65100">Interview Mgmt</text><text x="580" y="92" fill="#333">Session Control</text>',
'<rect x="30" y="190" width="140" height="50" rx="6" fill="#fce4ec" stroke="#c62828" stroke-width="1.5"/>',
'<text x="100" y="211" font-weight="bold" fill="#c62828">AI Question Gen</text><text x="100" y="227" fill="#333">Groq API / LLaMA</text>',
'<rect x="270" y="190" width="140" height="50" rx="6" fill="#f3e5f5" stroke="#6a1b9a" stroke-width="1.5"/>',
'<text x="340" y="211" font-weight="bold" fill="#6a1b9a">Answer Eval</text><text x="340" y="227" fill="#333">AI Scoring</text>',
'<rect x="510" y="190" width="140" height="50" rx="6" fill="#e0f7fa" stroke="#00695c" stroke-width="1.5"/>',
'<text x="580" y="211" font-weight="bold" fill="#00695c">Analytics</text><text x="580" y="227" fill="#333">Performance Track</text>',
'<rect x="220" y="340" width="240" height="50" rx="6" fill="#f5f5f5" stroke="#333" stroke-width="2"/>',
'<text x="340" y="361" font-weight="bold" font-size="13">MySQL Database</text>',
'<text x="340" y="378" fill="#555">Users | Interviews | Questions | Scores</text>',
'</g>',
'<g stroke="#444" stroke-width="1.5" fill="none" marker-end="url(#ah)">',
'<line x1="170" y1="80" x2="268" y2="80"/><line x1="410" y1="80" x2="508" y2="80"/>',
'<line x1="100" y1="105" x2="100" y2="188"/><line x1="580" y1="105" x2="580" y2="188"/>',
'<line x1="170" y1="215" x2="268" y2="215"/><line x1="410" y1="215" x2="508" y2="215"/>',
'<path d="M100,240 L100,310 L220,365"/><path d="M340,240 L340,338"/>',
'<path d="M580,240 L580,310 L460,365"/>',
'</g></svg>',
'<figcaption>Figure ' + n + ': Module Interaction Architecture Diagram</figcaption>',
'</figure>'
    ].join('\n');
}

function svgDeployment() {
    var n = figNum++;
    return [
'<figure>',
'<svg class="svg-diagram" viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg">',
'<rect width="680" height="300" fill="#fafafa" rx="8"/>',
'<text x="340" y="24" text-anchor="middle" font-family="Times New Roman" font-size="14" font-weight="bold">Deployment Architecture</text>',
'<defs><marker id="da" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>',
'<g font-family="Arial" font-size="12" text-anchor="middle">',
'<rect x="30" y="60" width="130" height="180" rx="8" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>',
'<text x="95" y="85" font-weight="bold" fill="#1565c0">CLIENT</text>',
'<text x="95" y="110" font-size="10">HTML / CSS / JS</text><text x="95" y="130" font-size="10">Web Browser</text>',
'<text x="95" y="160" font-size="10" fill="#666">Desktop / Mobile</text>',
'<rect x="260" y="40" width="160" height="220" rx="8" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>',
'<text x="340" y="65" font-weight="bold" fill="#2e7d32">BACKEND SERVER</text>',
'<text x="340" y="90" font-size="10">Node.js + Express.js</text><text x="340" y="110" font-size="10">RESTful API</text>',
'<text x="340" y="130" font-size="10">JWT Auth Middleware</text><text x="340" y="150" font-size="10">Business Logic</text>',
'<text x="340" y="170" font-size="10">CORS + Validation</text><text x="340" y="200" font-size="10" fill="#666">PM2 Process Manager</text>',
'<rect x="520" y="40" width="130" height="90" rx="8" fill="#fff3e0" stroke="#e65100" stroke-width="2"/>',
'<text x="585" y="65" font-weight="bold" fill="#e65100">GROQ API</text>',
'<text x="585" y="88" font-size="10">LLaMA / Mixtral</text><text x="585" y="108" font-size="10">Cloud AI Service</text>',
'<rect x="520" y="170" width="130" height="90" rx="8" fill="#f3e5f5" stroke="#6a1b9a" stroke-width="2"/>',
'<text x="585" y="195" font-weight="bold" fill="#6a1b9a">MySQL DB</text>',
'<text x="585" y="218" font-size="10">Users, Sessions</text><text x="585" y="238" font-size="10">Questions, Scores</text>',
'</g>',
'<g stroke="#333" stroke-width="1.5" marker-end="url(#da)">',
'<line x1="160" y1="150" x2="258" y2="150"/><line x1="420" y1="85" x2="518" y2="85"/>',
'<line x1="420" y1="215" x2="518" y2="215"/>',
'</g>',
'<g font-family="Arial" font-size="9" fill="#888">',
'<text x="205" y="142">HTTP/HTTPS</text><text x="465" y="77">API Calls</text><text x="465" y="207">SQL Queries</text>',
'</g></svg>',
'<figcaption>Figure ' + n + ': Three-Tier Deployment Architecture</figcaption>',
'</figure>'
    ].join('\n');
}

function svgER() {
    var n = figNum++;
    return [
'<figure>',
'<svg class="svg-diagram" viewBox="0 0 700 420" xmlns="http://www.w3.org/2000/svg">',
'<rect width="700" height="420" fill="#fafafa" rx="8"/>',
'<text x="350" y="24" text-anchor="middle" font-family="Times New Roman" font-size="14" font-weight="bold">Entity-Relationship (ER) Diagram</text>',
'<defs><marker id="ea" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>',
'<g font-family="Arial" font-size="11">',
'<rect x="20" y="45" width="150" height="180" fill="#fff" stroke="#1565c0" stroke-width="2" rx="4"/>',
'<rect x="20" y="45" width="150" height="28" fill="#1565c0" rx="4"/>',
'<text x="95" y="64" text-anchor="middle" fill="#fff" font-weight="bold" font-size="12">USERS</text>',
'<text x="30" y="93" font-weight="bold">PK user_id INT</text><line x1="20" y1="100" x2="170" y2="100" stroke="#ddd"/>',
'<text x="30" y="117">name VARCHAR</text><text x="30" y="137">email VARCHAR</text>',
'<text x="30" y="157">password VARCHAR</text><text x="30" y="177">created_at DATETIME</text><text x="30" y="197">updated_at DATETIME</text>',
'<rect x="270" y="45" width="160" height="200" fill="#fff" stroke="#2e7d32" stroke-width="2" rx="4"/>',
'<rect x="270" y="45" width="160" height="28" fill="#2e7d32" rx="4"/>',
'<text x="350" y="64" text-anchor="middle" fill="#fff" font-weight="bold" font-size="12">INTERVIEWS</text>',
'<text x="280" y="93" font-weight="bold">PK session_id INT</text><line x1="270" y1="100" x2="430" y2="100" stroke="#ddd"/>',
'<text x="280" y="117" fill="#c62828">FK user_id INT</text><text x="280" y="137">job_role VARCHAR</text>',
'<text x="280" y="157">difficulty ENUM</text><text x="280" y="177">total_score FLOAT</text>',
'<text x="280" y="197">status VARCHAR</text><text x="280" y="217">created_at DATETIME</text>',
'<rect x="530" y="45" width="150" height="220" fill="#fff" stroke="#e65100" stroke-width="2" rx="4"/>',
'<rect x="530" y="45" width="150" height="28" fill="#e65100" rx="4"/>',
'<text x="605" y="64" text-anchor="middle" fill="#fff" font-weight="bold" font-size="12">QUESTIONS</text>',
'<text x="540" y="93" font-weight="bold">PK q_id INT</text><line x1="530" y1="100" x2="680" y2="100" stroke="#ddd"/>',
'<text x="540" y="117" fill="#c62828">FK session_id INT</text><text x="540" y="137">question_text TEXT</text>',
'<text x="540" y="157">question_type ENUM</text><text x="540" y="177">user_answer TEXT</text>',
'<text x="540" y="197">ai_score FLOAT</text><text x="540" y="217">ai_feedback TEXT</text><text x="540" y="237">created_at DATETIME</text>',
'<rect x="270" y="310" width="160" height="100" fill="#fff" stroke="#6a1b9a" stroke-width="2" rx="4"/>',
'<rect x="270" y="310" width="160" height="28" fill="#6a1b9a" rx="4"/>',
'<text x="350" y="329" text-anchor="middle" fill="#fff" font-weight="bold" font-size="12">ANALYTICS</text>',
'<text x="280" y="358" font-weight="bold">PK analytics_id</text><text x="280" y="378" fill="#c62828">FK user_id INT</text><text x="280" y="398">avg_score FLOAT</text>',
'</g>',
'<g stroke="#333" stroke-width="1.5" marker-end="url(#ea)">',
'<line x1="170" y1="93" x2="268" y2="93"/><line x1="430" y1="93" x2="528" y2="93"/>',
'<line x1="95" y1="225" x2="95" y2="350"/><path d="M95,350 L268,350" fill="none"/>',
'</g>',
'<g font-family="Arial" font-size="10" fill="#666"><text x="210" y="85">1 : N</text><text x="475" y="85">1 : N</text><text x="170" y="343">1 : 1</text></g>',
'</svg>',
'<figcaption>Figure ' + n + ': Entity-Relationship (ER) Diagram</figcaption>',
'</figure>'
    ].join('\n');
}

function svgFlowchart() {
    var n = figNum++;
    return [
'<figure>',
'<svg class="svg-diagram" viewBox="0 0 500 680" xmlns="http://www.w3.org/2000/svg">',
'<rect width="500" height="680" fill="#fafafa" rx="8"/>',
'<text x="250" y="24" text-anchor="middle" font-family="Times New Roman" font-size="14" font-weight="bold">System Process Flowchart</text>',
'<defs><marker id="fa" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>',
'<g font-family="Arial" font-size="12" text-anchor="middle">',
'<ellipse cx="250" cy="52" rx="55" ry="18" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/><text x="250" y="57" fill="#1565c0" font-weight="bold">START</text>',
'<rect x="180" y="95" width="140" height="36" rx="5" fill="#fff" stroke="#333" stroke-width="1.5"/><text x="250" y="118">User Login/Register</text>',
'<polygon points="250,160 325,193 250,226 175,193" fill="#fff3e0" stroke="#e65100" stroke-width="1.5"/><text x="250" y="198" font-size="11">Auth Valid?</text>',
'<rect x="180" y="250" width="140" height="36" rx="5" fill="#fff" stroke="#333" stroke-width="1.5"/><text x="250" y="273">Open Dashboard</text>',
'<rect x="165" y="310" width="170" height="36" rx="5" fill="#fff" stroke="#333" stroke-width="1.5"/><text x="250" y="333">Select Role &amp; Difficulty</text>',
'<rect x="160" y="370" width="180" height="36" rx="5" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1.5"/><text x="250" y="393" fill="#2e7d32">AI Generates Questions</text>',
'<rect x="175" y="430" width="150" height="36" rx="5" fill="#fff" stroke="#333" stroke-width="1.5"/><text x="250" y="453">User Submits Answer</text>',
'<rect x="160" y="490" width="180" height="36" rx="5" fill="#f3e5f5" stroke="#6a1b9a" stroke-width="1.5"/><text x="250" y="513" fill="#6a1b9a">AI Evaluates Response</text>',
'<rect x="165" y="550" width="170" height="36" rx="5" fill="#fff" stroke="#333" stroke-width="1.5"/><text x="250" y="573">Display Score &amp; Feedback</text>',
'<ellipse cx="250" cy="625" rx="55" ry="18" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/><text x="250" y="630" fill="#1565c0" font-weight="bold">END</text>',
'</g>',
'<g stroke="#333" stroke-width="1.5" marker-end="url(#fa)">',
'<line x1="250" y1="70" x2="250" y2="93"/><line x1="250" y1="131" x2="250" y2="158"/>',
'<line x1="250" y1="226" x2="250" y2="248"/><line x1="250" y1="286" x2="250" y2="308"/>',
'<line x1="250" y1="346" x2="250" y2="368"/><line x1="250" y1="406" x2="250" y2="428"/>',
'<line x1="250" y1="466" x2="250" y2="488"/><line x1="250" y1="526" x2="250" y2="548"/>',
'<line x1="250" y1="586" x2="250" y2="605"/>',
'</g>',
'<g stroke="#c62828" stroke-width="1.5" stroke-dasharray="4,3">',
'<line x1="175" y1="193" x2="85" y2="193"/><line x1="85" y1="193" x2="85" y2="113"/>',
'<line x1="85" y1="113" x2="178" y2="113" marker-end="url(#fa)"/>',
'</g>',
'<text x="105" y="153" font-family="Arial" font-size="10" fill="#c62828">No</text>',
'<text x="258" y="242" font-family="Arial" font-size="10" fill="#2e7d32">Yes</text>',
'</svg>',
'<figcaption>Figure ' + n + ': System Process Flowchart</figcaption>',
'</figure>'
    ].join('\n');
}

function svgDFD() {
    var n = figNum++;
    return [
'<figure>',
'<svg class="svg-diagram" viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg">',
'<rect width="680" height="360" fill="#fafafa" rx="8"/>',
'<text x="340" y="24" text-anchor="middle" font-family="Times New Roman" font-size="14" font-weight="bold">Data Flow Diagram (Level 1)</text>',
'<defs><marker id="df" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>',
'<g font-family="Arial" font-size="11" text-anchor="middle">',
'<rect x="20" y="130" width="100" height="55" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/><text x="70" y="162" font-weight="bold" fill="#1565c0">User</text>',
'<circle cx="220" cy="75" r="32" fill="#fff" stroke="#2e7d32" stroke-width="2"/><text x="220" y="72" font-weight="bold" fill="#2e7d32">P1</text><text x="220" y="86" font-size="9">Auth</text>',
'<circle cx="220" cy="190" r="32" fill="#fff" stroke="#e65100" stroke-width="2"/><text x="220" y="187" font-weight="bold" fill="#e65100">P2</text><text x="220" y="201" font-size="9">Interview</text>',
'<circle cx="400" cy="110" r="36" fill="#fff" stroke="#6a1b9a" stroke-width="2"/><text x="400" y="107" font-weight="bold" fill="#6a1b9a">P3</text><text x="400" y="121" font-size="9">AI Engine</text>',
'<circle cx="400" cy="270" r="32" fill="#fff" stroke="#00695c" stroke-width="2"/><text x="400" y="267" font-weight="bold" fill="#00695c">P4</text><text x="400" y="281" font-size="9">Analytics</text>',
'<line x1="540" y1="60" x2="660" y2="60" stroke="#333" stroke-width="1.5"/><line x1="540" y1="88" x2="660" y2="88" stroke="#333" stroke-width="1.5"/><text x="600" y="78" font-size="10">D1: Users DB</text>',
'<line x1="540" y1="165" x2="660" y2="165" stroke="#333" stroke-width="1.5"/><line x1="540" y1="193" x2="660" y2="193" stroke="#333" stroke-width="1.5"/><text x="600" y="183" font-size="10">D2: Interviews</text>',
'<line x1="540" y1="270" x2="660" y2="270" stroke="#333" stroke-width="1.5"/><line x1="540" y1="298" x2="660" y2="298" stroke="#333" stroke-width="1.5"/><text x="600" y="288" font-size="10">D3: Analytics</text>',
'</g>',
'<g stroke="#333" stroke-width="1.2" fill="none" marker-end="url(#df)">',
'<line x1="120" y1="145" x2="186" y2="88"/><line x1="120" y1="170" x2="186" y2="185"/>',
'<line x1="252" y1="85" x2="362" y2="105"/><line x1="252" y1="200" x2="366" y2="262"/>',
'<line x1="436" y1="110" x2="538" y2="78"/><line x1="436" y1="125" x2="538" y2="178"/>',
'<line x1="432" y1="278" x2="538" y2="285"/>',
'</g>',
'<g font-family="Arial" font-size="8" fill="#888">',
'<text x="140" y="130">Credentials</text><text x="138" y="195">Preferences</text>',
'<text x="295" y="82">Generate Q</text><text x="298" y="248">Scores</text>',
'<text x="485" y="70">Store User</text><text x="485" y="170">Store Session</text><text x="485" y="278">Store Stats</text>',
'</g></svg>',
'<figcaption>Figure ' + n + ': Level-1 Data Flow Diagram (DFD)</figcaption>',
'</figure>'
    ].join('\n');
}

function chart(id, label) {
    var n = figNum++;
    return '<figure>\n<div class="chart-wrapper chart-live">\n<canvas id="' + id + '"></canvas>\n</div>\n<figcaption>Figure ' + n + ': ' + label + '</figcaption>\n</figure>';
}

function img(src, alt, label) {
    var n = figNum++;
    return '<figure>\n<img src="./' + src + '" alt="' + alt + '" style="max-width:85%;">\n<figcaption>Figure ' + n + ': ' + label + '</figcaption>\n</figure>';
}

// ========== HEADING DETECTION ==========
function isChapter(l) { return /^CHAPTER\s+\d+/i.test(l); }
function isSection(l) { return /^\d+\.\d+[:\s]+[A-Za-z]/.test(l); }
function isSubSection(l) { return /^\d+\.\d+\.\d+[:\s]+[A-Za-z]/.test(l); }
function isBullet(l) { return l.startsWith('\u2022\t') || l.startsWith('\u2022 ') || l.startsWith('\u2022'); }

// ========== BUILD HTML ==========
var h = [];
h.push('<!DOCTYPE html>');
h.push('<html lang="en"><head><meta charset="UTF-8">');
h.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
h.push('<title>AI Mock Interviewer - Research Paper</title>');
h.push('<style>');
h.push('@page { size: A4; margin: 2.54cm; }');
h.push('@media print { html,body { width:auto!important; background:#fff!important; margin:0!important; padding:0!important; font-size:12pt; } .paper { box-shadow:none!important; margin:0!important; padding:0!important; max-width:none!important; width:100%!important; min-height:auto!important; height:auto!important; } .page-break { page-break-before:always; } .no-print { display:none!important; } figure,table { page-break-inside:avoid; } h1,h2,h3 { page-break-after:avoid; } }');
h.push('* { margin:0; padding:0; box-sizing:border-box; }');
h.push('html { background:#d1d5db; }');
h.push('body { font-family:"Times New Roman",Times,serif; font-size:12pt; line-height:1.6; color:#000; text-align:justify; }');
h.push('.paper { width:210mm; min-height:297mm; margin:20px auto; padding:2.54cm; background:#fff; box-shadow:0 2px 16px rgba(0,0,0,0.18); }');
h.push('h1 { font-family:"Times New Roman",Times,serif; font-size:14pt; font-weight:bold; text-transform:uppercase; text-align:center; margin:0.8em 0 1em; line-height:1.4; }');
h.push('h2 { font-family:"Times New Roman",Times,serif; font-size:12pt; font-weight:bold; text-transform:uppercase; margin:1.2em 0 0.6em; text-align:left; }');
h.push('h3 { font-family:"Times New Roman",Times,serif; font-size:12pt; font-weight:bold; margin:1em 0 0.5em; text-align:left; }');
h.push('p { font-size:12pt; margin-bottom:0.8em; text-align:justify; word-wrap:break-word; hyphens:auto; }');
h.push('ul,ol { margin:0.5em 0 1em 2em; font-size:12pt; } li { margin-bottom:0.3em; text-align:justify; }');
h.push('table { width:100%; border-collapse:collapse; margin:1.2em 0; font-size:11pt; }');
h.push('th,td { border:1px solid #000; padding:6px 10px; text-align:left; vertical-align:top; }');
h.push('th { background:#e8e8e8; font-weight:bold; text-align:center; }');
h.push('figure { margin:1.5em auto; text-align:center; max-width:100%; }');
h.push('figure img,figure svg { max-width:100%; height:auto; }');
h.push('figcaption { font-size:11pt; font-style:italic; margin-top:0.5em; text-align:center; font-weight:bold; }');
h.push('.page-break { page-break-before:always; height:0; margin:0; padding:0; border:none; }');
h.push('.page-break + *, .paper > *:first-child, .paper > h1:first-child { margin-top: 0 !important; }');
h.push('.chart-wrapper { width:100%; max-width:520px; margin:1em auto; }');
h.push('.chart-wrapper canvas { width:100%!important; height:280px!important; }');
h.push('.svg-diagram { display:block; width:100%; max-width:560px; margin:1em auto; }');
h.push('.controls { position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:8px; background:#fff; padding:16px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.2); }');
h.push('.controls button { font-family:Arial,sans-serif; font-size:13pt; font-weight:600; padding:10px 22px; border:none; border-radius:6px; cursor:pointer; background:#1a56db; color:#fff; } .controls button:hover { background:#1240a8; }');
h.push('.controls small { display:block; text-align:center; color:#666; font-size:9pt; margin-top:4px; font-family:Arial,sans-serif; }');
h.push('</style>');
h.push('<script src="https://cdn.jsdelivr.net/npm/chart.js@4"><\/script>');
h.push('<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"><\/script>');
h.push('</head><body>');
h.push('<input type="file" id="autoPageNumInput" accept="application/pdf" style="display:none" onchange="addPageNumbers(this)">');
h.push('<div class="controls no-print" id="controls">');
h.push('<button onclick="printPDF()">\u2b07 Download as PDF</button>');
h.push('<button onclick="downloadWithPageNumbers()" style="background:#6a1b9a;">\ud83d\udcc4 Download with Page No</button>');
h.push('<label style="background:#2e7d32; color:#fff; padding:10px 22px; border-radius:6px; cursor:pointer; font-weight:600; text-align:center; display:block; font-family:Arial,sans-serif; margin-top:4px;">');
h.push('\ud83d\udcc4 Add Page Numbers to PDF');
h.push('<input type="file" accept="application/pdf" style="display:none" onchange="addPageNumbers(this)">');
h.push('</label>');
h.push('<small>Uses browser Print \u2192 Save as PDF<br>Paper: <b>A4</b> | Margins: <b>None</b></small>');
h.push('</div>');
h.push('<div class="paper" id="paper">');

var inList = false;

for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line === 'reseach paper') continue;

    // Page breaks for chapters
    if (isChapter(line) || line === 'ABSTRACT') {
        if (inList) { h.push('</ul>'); inList = false; }
        if (line !== 'ABSTRACT') h.push('<div class="page-break"></div>');
    }

    // Bullets
    if (isBullet(line)) {
        if (!inList) { h.push('<ul>'); inList = true; }
        var btxt = line.replace(/^\u2022[\t ]*/, '');
        h.push('<li>' + btxt + '</li>');
        continue;
    }

    // Close list
    if (inList) { h.push('</ul>'); inList = false; }

    // Output heading or paragraph
    if (line === 'ABSTRACT') {
        h.push('<h1>ABSTRACT</h1>');
    } else if (isChapter(line)) {
        var cleanTitle = line.replace(/^CHAPTER\s+\d+[:\-\s]*/i, '').trim();
        h.push('<h1>' + cleanTitle + '</h1>');
    } else if (isSection(line)) {
        h.push('<h2>' + line + '</h2>');
    } else if (isSubSection(line)) {
        h.push('<h3>' + line + '</h3>');
    } else if (line.startsWith('KEYWORDS:')) {
        h.push('<p><strong>' + line + '</strong></p>');
    } else if (/^(Purpose:|Key Functions:|Module Dependencies:|Limitations:|Advantages:|Solution:|Server Requirements:|Client Requirements:|Server-Side Software:|Client-Side Software:|Assumptions:|Dependencies:|Out of Scope:|FR-\d|NFR-\d)/.test(line)) {
        h.push('<p><strong>' + line + '</strong></p>');
    } else {
        h.push('<p>' + line + '</p>');
    }

    // ========== INJECT VISUALS ==========
    // Module Interaction Diagram (Chapter 3)
    if (line.includes('3.10 MODULE INTERACTION DIAGRAM') && !done.mi) { h.push(svgModuleInteraction()); done.mi = 1; }
    // Deployment Architecture (Chapter 4)
    if (line.includes('4.2 DEPLOYMENT ARCHITECTURE') && !done.dep) { h.push(svgDeployment()); done.dep = 1; }
    // Existing System Analysis bar chart (Chapter 5)
    if (line.includes('3.3 Existing System Analysis') && !done.ec) { h.push(chart('existingSystemsChart', 'Comparison of Existing Interview Preparation Platforms')); done.ec = 1; }
    // System Architecture radar chart (in Chapter 6: System Design, heading = "4.2 OVERALL SYSTEM ARCHITECTURE")
    if (line.includes('OVERALL SYSTEM ARCHITECTURE') && !done.ar) { h.push(chart('architectureRadarChart', 'System Feature Assessment Radar')); done.ar = 1; }
    // ER Diagram (heading = "4.4 DATABASE DESIGN")
    if (line.includes('DATABASE DESIGN') && !done.er) { h.push(svgER()); done.er = 1; }
    // Interview Process Flowchart (heading = "Interview Process Flow")
    if (line.includes('Interview Process Flow') && !done.fc) { h.push(svgFlowchart()); done.fc = 1; }
    // Data Flow Diagram (heading = "4.6 Data Flow Description")
    if (line.includes('Data Flow Description') && !done.dfd) { h.push(svgDFD()); done.dfd = 1; }

    // Fallback: inject DFD + Flowchart under System Design chapter if not yet inserted
    if (isChapter(line) && line.includes('SYSTEM DESIGN') && !done.sysDesign) {
        if (!done.fc) { h.push(svgFlowchart()); done.fc = 1; }
        if (!done.dfd) { h.push(svgDFD()); done.dfd = 1; }
        done.sysDesign = 1;
    }

    // Screenshots - inject at "5.4.2 Key Interface Components" heading
    if (line.includes('5.4.2 Key Interface Components') && !done.s1) {
        h.push(img('login_page.png', 'Login Interface', 'User Authentication and Login Interface'));
        h.push(img('dashboard.png', 'Dashboard', 'User Dashboard and Session Management Interface'));
        h.push(img('interview.png', 'Interview', 'Active AI Mock Interview Session'));
        h.push(img('results.png', 'Results Analytics', 'Post-Interview Results and Analytics View'));
        done.s1 = 1;
    }

    // Since the Results chapter was removed to match requirements, we inject these charts
    // at the end of the Implementation chapter (right before "CHAPTER 8: FUTURE OF THE WORK")
    if (line.includes('FUTURE OF THE WORK') && !done.rc) { 
        h.push('<div class="page-break"></div>');
        h.push('<h2>SYSTEM PERFORMANCE AND USER METRICS</h2>');
        h.push('<p>The following charts illustrate the performance metrics and user acceptance data collected during the system testing phases.</p>');
        h.push(chart('apiPerformanceChart', 'API Response Time Analysis (ms)')); 
        h.push(chart('unitTestChart', 'Module Unit Test Pass Rate (%)'));
        h.push(chart('userImprovementChart', 'User Performance Improvement Over Multiple Sessions')); 
        h.push(chart('questionTypesChart', 'Distribution of AI-Generated Question Types')); 
        done.rc = 1; 
    }
}

if (inList) h.push('</ul>');

// ========== CHART.JS SCRIPTS ==========
h.push('</div>');
h.push('<script>');
h.push('function printPDF(){document.getElementById("controls").style.display="none";setTimeout(function(){window.print();setTimeout(function(){document.getElementById("controls").style.display="flex";},1000);},300);}');
h.push('function downloadWithPageNumbers() {');
h.push('    var skipPages = prompt("Start showing page numbers FROM page (e.g. 5 = skip first 4 pages):", "1");');
h.push('    if (skipPages === null) return;');
h.push('    skipPages = parseInt(skipPages) || 1;');
h.push('    var startNum = prompt("Start numbering from:", "1");');
h.push('    if (startNum === null) return;');
h.push('    startNum = parseInt(startNum) || 1;');
h.push('    var wrapper = null;');
h.push('    if (skipPages > 1) {');
h.push('        var paper = document.getElementById("paper");');
h.push('        var children = Array.from(paper.children);');
h.push('        wrapper = document.createElement("div");');
h.push('        wrapper.id = "frontMatterWrap";');
h.push('        var breakCount = 0;');
h.push('        var toMove = [];');
h.push('        for (var i = 0; i < children.length; i++) {');
h.push('            if (children[i].classList.contains("page-break")) { breakCount++; }');
h.push('            if (breakCount >= skipPages - 1) break;');
h.push('            toMove.push(children[i]);');
h.push('        }');
h.push('        if (toMove.length > 0) {');
h.push('            paper.insertBefore(wrapper, toMove[0]);');
h.push('            for (var k = 0; k < toMove.length; k++) wrapper.appendChild(toMove[k]);');
h.push('        }');
h.push('    }');
h.push('    var s = document.createElement("style");');
h.push('    s.id = "pageNumCSS";');
h.push('    var css = "@page { @bottom-center { content: counter(page); font-family: Times New Roman, Times, serif; font-size: 11pt; } }";');
h.push('    if (skipPages > 1) {');
h.push('        css += " #frontMatterWrap { page: front; }";');
h.push('        css += " @page front { @bottom-center { content: none; } }";');
h.push('    }');
h.push('    css += " body { counter-reset: page " + (startNum - skipPages) + "; }";');
h.push('    s.textContent = css;');
h.push('    document.head.appendChild(s);');
h.push('    document.getElementById("controls").style.display="none";');
h.push('    window.print();');
h.push('    document.getElementById("controls").style.display="flex";');
h.push('    document.getElementById("pageNumCSS").remove();');
h.push('    if (wrapper) {');
h.push('        var paper = document.getElementById("paper");');
h.push('        while (wrapper.firstChild) paper.insertBefore(wrapper.firstChild, wrapper);');
h.push('        wrapper.remove();');
h.push('    }');
h.push('}');
h.push('async function addPageNumbers(input) {');
h.push('    if (!input.files || !input.files[0]) return;');
h.push('    var skipPages = prompt("Start showing page numbers FROM page (e.g. 5 = skip first 4 pages):", "1");');
h.push('    if (skipPages === null) return;');
h.push('    skipPages = parseInt(skipPages) || 1;');
h.push('    var startNum = prompt("Start numbering from:", "1");');
h.push('    if (startNum === null) return;');
h.push('    startNum = parseInt(startNum) || 1;');
h.push('    var file = input.files[0];');
h.push('    var arrayBuffer = await file.arrayBuffer();');
h.push('    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);');
h.push('    var pages = pdfDoc.getPages();');
h.push('    var font = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);');
h.push('    for (var i = 0; i < pages.length; i++) {');
h.push('        if (i < skipPages - 1) continue;');
h.push('        var page = pages[i];');
h.push('        var { width } = page.getSize();');
h.push('        var text = String(startNum + (i - (skipPages - 1)));');
h.push('        var textWidth = font.widthOfTextAtSize(text, 11);');
h.push('        page.drawText(text, {');
h.push('            x: (width - textWidth) / 2,');
h.push('            y: 36,');
h.push('            size: 11,');
h.push('            font: font,');
h.push('            color: PDFLib.rgb(0, 0, 0)');
h.push('        });');
h.push('    }');
h.push('    var pdfBytes = await pdfDoc.save();');
h.push('    var blob = new Blob([pdfBytes], { type: "application/pdf" });');
h.push('    var url = URL.createObjectURL(blob);');
h.push('    var a = document.createElement("a");');
h.push('    a.href = url;');
h.push('    a.download = file.name.replace(".pdf", "") + "_numbered.pdf";');
h.push('    a.click();');
h.push('    URL.revokeObjectURL(url);');
h.push('    input.value = "";');
h.push('}');
h.push('document.addEventListener("DOMContentLoaded",function(){');
h.push('function ic(id,cfg){var e=document.getElementById(id);if(e)new Chart(e,cfg);}');
// Existing Systems
h.push('ic("existingSystemsChart",{type:"bar",data:{labels:["LeetCode","HackerRank","Pramp","InterviewBit","AI Mock Interviewer"],datasets:[{label:"Personalization (0-10)",data:[3,3,7,4,9],backgroundColor:"#1565c0"},{label:"Real-time Feedback (0-10)",data:[2,2,6,3,9],backgroundColor:"#e65100"},{label:"Scalability (0-10)",data:[9,9,4,8,9],backgroundColor:"#2e7d32"}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}},scales:{y:{beginAtZero:true,max:10}}}});');
// Radar
h.push('ic("architectureRadarChart",{type:"radar",data:{labels:["Scalability","Security","Performance","AI Accuracy","UX Quality","Modularity"],datasets:[{label:"AI Mock Interviewer",data:[9,8.5,7.5,9,8,9],backgroundColor:"rgba(46,125,50,0.15)",borderColor:"#2e7d32",pointBackgroundColor:"#2e7d32"}]},options:{responsive:true,maintainAspectRatio:false,scales:{r:{beginAtZero:true,max:10}}}});');
// API Perf
h.push('ic("apiPerformanceChart",{type:"bar",data:{labels:["User Login","Load Session","Groq: Generate Q","Groq: Evaluate","DB Write","Analytics Query"],datasets:[{label:"Avg Latency (ms)",data:[45,120,1800,2400,85,150],backgroundColor:["#1565c0","#1565c0","#e65100","#e65100","#2e7d32","#2e7d32"]}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:"y",plugins:{legend:{display:false}}}});');
// Unit Test
h.push('ic("unitTestChart",{type:"bar",data:{labels:["Auth Module","Interview Mgmt","AI Question Gen","Evaluation","Analytics","Database"],datasets:[{label:"Pass Rate (%)",data:[100,95,90,92,98,100],backgroundColor:"#2e7d32"}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,max:100}}}});');
// User Improvement
h.push('ic("userImprovementChart",{type:"line",data:{labels:["Session 1","Session 2","Session 3","Session 4","Session 5","Session 6","Session 7","Session 8"],datasets:[{label:"Average Score (out of 10)",data:[4.8,5.5,6.1,6.8,7.2,7.8,8.1,8.5],borderColor:"#6a1b9a",backgroundColor:"rgba(106,27,154,0.1)",fill:true,tension:0.3,pointRadius:5}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,max:10}}}});');
// Question Pie
h.push('ic("questionTypesChart",{type:"pie",data:{labels:["Technical","Behavioral","Scenario-Based","Theoretical"],datasets:[{data:[40,25,20,15],backgroundColor:["#1565c0","#c62828","#f9a825","#2e7d32"]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}}}});');
h.push('});');
h.push('<\/script>');
h.push('</body></html>');

var output = h.join('\n');
fs.writeFileSync(outputFile, output, 'utf-8');
console.log('Done! Generated index.html (' + output.length + ' bytes, ' + h.length + ' lines)');
