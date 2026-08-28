// exportPptx.js — Hybrid Editable PPTX Exporter
// Strategy: Capture slide BACKGROUNDS as images (100% CSS match)
//           + overlay native editable text/shapes on top (full editability)

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-pptx-btn');
    const overlay = document.getElementById('export-overlay');
    const pctLabel = document.getElementById('export-pct');

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            if (typeof PptxGenJS === 'undefined' || typeof html2canvas === 'undefined') {
                alert('Export libraries are not loaded. Please check your internet connection.');
                return;
            }

            try {
                overlay.style.display = 'flex';
                pctLabel.innerText = 'Initializing export engine...';

                const pptx = new PptxGenJS();
                pptx.layout = 'LAYOUT_16x9';
                pptx.author = 'FormatFlow Team';
                pptx.title = 'FormatFlow — OOPD Showcase';

                // ═══════════════════════════════════════════
                //  DESIGN TOKENS
                // ═══════════════════════════════════════════
                const FONT = 'Segoe UI';
                const FONT_MONO = 'Consolas';
                const W = 'FFFFFF';
                const W80 = 'CCCCCC';
                const W75 = 'BFBFBF';
                const W70 = 'B3B3B3';
                const W60 = '999999';
                const W50 = '808080';
                const W40 = '666666';
                const W30 = '4D4D4D';
                const W20 = '333333';

                const BLUE = '2997FF';
                const PURPLE = 'BF5AF2';
                const PINK = 'FF375F';
                const ORANGE = 'FF9F0A';
                const GREEN = '30D158';
                const TEAL = '5AC8FA';
                const GOLD = 'FFD60A';
                const ROSE = 'FF6B8A';

                const TRANSITION = { type: 'fade', speed: 'fast' };

                // ═══════════════════════════════════════════
                //  HELPERS
                // ═══════════════════════════════════════════
                function addLabel(slide, text, opts = {}) {
                    slide.addText(text.toUpperCase(), {
                        x: opts.x || 0.5, y: opts.y || 0.55, w: opts.w || 9, h: 0.3,
                        fontSize: 11, fontFace: FONT, color: opts.color || BLUE,
                        bold: true, charSpacing: 3, align: opts.align || 'center'
                    });
                }
                function addHeading(slide, parts, opts = {}) {
                    const arr = parts.map(p => ({ text: p.text, options: { fontSize: opts.fontSize || 36, fontFace: FONT, bold: true, color: p.color || W } }));
                    slide.addText(arr, { x: opts.x || 0.5, y: opts.y || 0.95, w: opts.w || 9, h: opts.h || 0.7, align: opts.align || 'center', valign: 'middle' });
                }
                function addBody(slide, text, opts = {}) {
                    slide.addText(text, { x: opts.x || 1.5, y: opts.y || 1.85, w: opts.w || 7, h: opts.h || 0.7, fontSize: opts.fontSize || 14, fontFace: FONT, color: opts.color || W75, align: opts.align || 'center', valign: 'top', lineSpacingMultiple: 1.4 });
                }
                function addCard(slide, x, y, w, h, opts = {}) {
                    slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: W, transparency: 96 }, line: { color: W, width: 0.5, transparency: 92 }, rectRadius: 0.15 });
                    if (opts.topColor) {
                        slide.addShape(pptx.ShapeType.line, { x: x + 0.12, y, w: w - 0.24, h: 0, line: { color: opts.topColor, width: 3 } });
                    }
                }
                function addCodeWindow(slide, wx, wy, ww, wh, win) {
                    slide.addShape(pptx.ShapeType.roundRect, { x: wx, y: wy, w: ww, h: wh, fill: { color: '0D0E15' }, line: { color: W, width: 0.5, transparency: 92 }, rectRadius: 0.08 });
                    slide.addShape(pptx.ShapeType.rect, { x: wx, y: wy, w: ww, h: 0.35, fill: { color: '1A1A2E' }, line: { width: 0 } });
                    const dotY = wy + 0.12;
                    slide.addShape(pptx.ShapeType.ellipse, { x: wx + 0.15, y: dotY, w: 0.11, h: 0.11, fill: { color: 'FF5F57' }, line: { width: 0 } });
                    slide.addShape(pptx.ShapeType.ellipse, { x: wx + 0.30, y: dotY, w: 0.11, h: 0.11, fill: { color: 'FFBD2E' }, line: { width: 0 } });
                    slide.addShape(pptx.ShapeType.ellipse, { x: wx + 0.45, y: dotY, w: 0.11, h: 0.11, fill: { color: '28C840' }, line: { width: 0 } });
                    slide.addText(win.fileName, { x: wx + 0.65, y: wy, w: 2, h: 0.35, fontSize: 10, fontFace: FONT_MONO, color: win.fileColor, align: 'left', valign: 'middle' });
                    const tagW = win.tag === 'EXTENSION' ? 1.0 : 0.8;
                    slide.addShape(pptx.ShapeType.roundRect, { x: wx + ww - tagW - 0.15, y: wy + 0.07, w: tagW, h: 0.21, fill: { color: win.tagBg || '0A2A0A' }, line: { width: 0 }, rectRadius: 0.1 });
                    slide.addText(win.tag, { x: wx + ww - tagW - 0.15, y: wy + 0.07, w: tagW, h: 0.21, fontSize: 7, fontFace: FONT, color: win.tagColor || GREEN, bold: true, align: 'center', valign: 'middle' });
                    slide.addText(win.code, { x: wx + 0.25, y: wy + 0.45, w: ww - 0.5, h: wh - 0.55, fontSize: 9, fontFace: FONT_MONO, color: W70, align: 'left', valign: 'top', lineSpacingMultiple: 1.35 });
                }

                // ═══════════════════════════════════════════
                //  PHASE 1: CAPTURE ALL SLIDE BACKGROUNDS
                // ═══════════════════════════════════════════
                pctLabel.innerText = 'Freezing animations...';
                const originalActiveSlide = document.querySelector('.slide.active');

                // Kill all CSS animations/transitions
                const cssKill = document.createElement('style');
                cssKill.innerHTML = `
                    * { transition: none !important; animation: none !important; animation-play-state: paused !important; }
                    .animate-in { opacity: 1 !important; transform: none !important; }
                    .slide { opacity: 1 !important; visibility: visible !important; transform: none !important; }
                `;
                document.head.appendChild(cssKill);

                const allSlides = document.querySelectorAll('.slide');
                const totalSlides = allSlides.length;
                const bgImages = [];

                for (let i = 0; i < totalSlides; i++) {
                    pctLabel.innerText = `Capturing background ${i + 1}/${totalSlides}...`;

                    // Activate this slide
                    allSlides.forEach(s => s.classList.remove('active'));
                    allSlides[i].classList.add('active');

                    await new Promise(r => setTimeout(r, 600));
                    await new Promise(r => requestAnimationFrame(r));

                    // Capture slide but HIDE text content in the clone
                    const canvas = await html2canvas(allSlides[i], {
                        scale: 2,
                        backgroundColor: '#000000',
                        logging: false,
                        allowTaint: true,
                        useCORS: true,
                        onclone: (clonedDoc, clonedEl) => {
                            // Hide all text content — keep only the visual background/theme
                            const content = clonedEl.querySelector('.slide-content');
                            if (content) content.style.visibility = 'hidden';
                            // Also hide any UI overlays
                            const uiEls = clonedDoc.querySelectorAll('.nav-arrow, .slide-counter, .slide-dots, .fullscreen-btn, .export-pptx-btn, .progress-bar');
                            uiEls.forEach(el => el.style.display = 'none');
                        }
                    });

                    bgImages.push(canvas.toDataURL('image/jpeg', 0.92));
                }

                // Restore original state
                document.head.removeChild(cssKill);
                allSlides.forEach(s => s.classList.remove('active'));
                if (originalActiveSlide) originalActiveSlide.classList.add('active');

                // ═══════════════════════════════════════════
                //  PHASE 2: BUILD PPTX WITH BG IMAGES + EDITABLE TEXT
                // ═══════════════════════════════════════════

                // ── SLIDE 1: TITLE ──
                pctLabel.innerText = 'Building Slide 1/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[0] };
                    s.transition = TRANSITION;

                    s.addText('OOPD PROJECT SHOWCASE', {
                        x: 3.0, y: 0.7, w: 4.0, h: 0.42,
                        fontSize: 10, fontFace: FONT, color: W60,
                        bold: true, charSpacing: 4, align: 'center', valign: 'middle'
                    });
                    s.addText([
                        { text: 'FormatFlow\n', options: { fontSize: 56, fontFace: FONT, bold: true, color: W } },
                        { text: 'Formatter', options: { fontSize: 56, fontFace: FONT, bold: true, color: PURPLE } }
                    ], { x: 0.5, y: 1.4, w: 9, h: 1.9, align: 'center', valign: 'middle', lineSpacingMultiple: 0.95 });
                    s.addText('Intelligent Document Formatting, Reimagined.', {
                        x: 1.5, y: 3.4, w: 7, h: 0.5, fontSize: 20, fontFace: FONT, color: W70, align: 'center'
                    });
                    s.addText('Object-Oriented Programming & Design', {
                        x: 2.6, y: 4.15, w: 4.8, h: 0.42,
                        fontSize: 11, fontFace: FONT, color: BLUE, bold: true, align: 'center', valign: 'middle'
                    });
                }

                // ── SLIDE 2: AUTHORS ──
                pctLabel.innerText = 'Building Slide 2/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[1] };
                    s.transition = TRANSITION;

                    s.addText('TEAM', { x: 0.7, y: 1.3, w: 2.8, h: 2.8, fontSize: 22, fontFace: FONT, color: W, bold: true, align: 'center', valign: 'middle' });

                    addLabel(s, 'Presented By', { x: 4, w: 5.5, align: 'left', color: BLUE });
                    s.addText([
                        { text: 'Our ', options: { fontSize: 36, fontFace: FONT, bold: true, color: W } },
                        { text: 'Group', options: { fontSize: 36, fontFace: FONT, bold: true, color: TEAL } }
                    ], { x: 4, y: 1.0, w: 5.5, h: 0.65, align: 'left', valign: 'middle' });

                    const members = [
                        { name: 'Mohd Ayan Khan', id: 'RA2511003030020' },
                        { name: 'Tapish Ganesh Ingle', id: 'RA2511003030044' },
                        { name: 'Shreyansh Singh', id: 'RA2511003030008' },
                        { name: 'Yashasvi Sharma', id: 'RA2511003030003' }
                    ];
                    members.forEach((m, i) => {
                        const col = i % 2, row = Math.floor(i / 2);
                        const mx = 4.0 + col * 2.8, my = 1.85 + row * 1.0;
                        s.addText(m.name, { x: mx, y: my, w: 2.6, h: 0.35, fontSize: 15, fontFace: FONT, color: W80, align: 'left' });
                        s.addText(m.id, { x: mx, y: my + 0.32, w: 2.6, h: 0.28, fontSize: 10, fontFace: FONT_MONO, color: W30, align: 'left' });
                    });
                    s.addText([
                        { text: 'Under the guidance of ', options: { fontSize: 13, fontFace: FONT, color: W50 } },
                        { text: 'Dr. Umma Meena', options: { fontSize: 13, fontFace: FONT, color: W, bold: true } },
                        { text: '\n(Associate Professor, OOPD)', options: { fontSize: 11, fontFace: FONT, color: W50 } }
                    ], { x: 4, y: 4.1, w: 5.5, h: 0.8, align: 'center', valign: 'top' });
                }

                // ── SLIDE 3: THE PROBLEM ──
                pctLabel.innerText = 'Building Slide 3/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[2] };
                    s.transition = TRANSITION;

                    addLabel(s, 'The Challenge');
                    addHeading(s, [{ text: 'Manual formatting is ' }, { text: 'broken.', color: TEAL }]);

                    const cards = [
                        { icon: '⏳', title: 'Time-Consuming', desc: 'Hours spent manually adjusting headings, spacing, and fonts across long documents.', topColor: PINK },
                        { icon: '🔀', title: 'Inconsistent', desc: 'Different heading levels, font sizes, and spacing create unprofessional results.', topColor: ORANGE },
                        { icon: '🚫', title: 'No Browser Solution', desc: 'No lightweight, browser-based tool auto-detects document structure and applies formatting.', topColor: ROSE }
                    ];
                    cards.forEach((c, i) => {
                        const cx = 0.5 + i * 3.15, cy = 2.15, cw = 2.85, ch = 2.8;
                        addCard(s, cx, cy, cw, ch, { topColor: c.topColor });
                        s.addText(c.icon, { x: cx, y: cy + 0.25, w: cw, h: 0.5, fontSize: 28, align: 'center' });
                        s.addText(c.title, { x: cx + 0.15, y: cy + 0.85, w: cw - 0.3, h: 0.4, fontSize: 16, fontFace: FONT, color: W, bold: true, align: 'center' });
                        s.addText(c.desc, { x: cx + 0.15, y: cy + 1.35, w: cw - 0.3, h: 1.2, fontSize: 12, fontFace: FONT, color: W70, align: 'center', valign: 'top', lineSpacingMultiple: 1.4 });
                    });
                }

                // ── SLIDE 4: THE SOLUTION ──
                pctLabel.innerText = 'Building Slide 4/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[3] };
                    s.transition = TRANSITION;

                    addLabel(s, 'The Solution');
                    addHeading(s, [{ text: 'FormatFlow ' }, { text: 'Formatter', color: GOLD }]);
                    addBody(s, 'A web-based application that intelligently reads, understands, and formats unstructured text documents — powered by AI and pure Object-Oriented Design.', { y: 1.85, h: 0.65, fontSize: 15 });

                    const pills = [
                        { text: '🔍 Auto Structure Detection', color: TEAL },
                        { text: '⚡ Real-Time Preview', color: GREEN },
                        { text: '🎨 Custom Rules Engine', color: PURPLE },
                        { text: '🤖 Gemini AI Integration', color: PINK },
                        { text: '📄 PDF & Word Export', color: ORANGE },
                        { text: '🌐 100% Browser-Based', color: BLUE }
                    ];
                    pills.forEach((p, i) => {
                        const col = i % 3, row = Math.floor(i / 3);
                        const px = 0.85 + col * 2.9, py = 3.1 + row * 0.65;
                        s.addShape(pptx.ShapeType.roundRect, { x: px, y: py, w: 2.6, h: 0.48, fill: { color: p.color, transparency: 90 }, line: { color: p.color, width: 0.75, transparency: 70 }, rectRadius: 0.24 });
                        s.addText(p.text, { x: px, y: py, w: 2.6, h: 0.48, fontSize: 10, fontFace: FONT, color: p.color, bold: true, align: 'center', valign: 'middle' });
                    });
                }

                // ── SLIDE 5: WHY OOP ──
                pctLabel.innerText = 'Building Slide 5/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[4] };
                    s.transition = TRANSITION;

                    addLabel(s, 'Design Philosophy');
                    addHeading(s, [{ text: 'Why ' }, { text: 'Object-Oriented', color: ORANGE }, { text: ' Design?' }]);

                    const items = [
                        { num: '01', title: 'Modularity', desc: 'Each processing stage is a self-contained class with clear boundaries and single responsibility.' },
                        { num: '02', title: 'Reusability', desc: 'Classes can be instantiated with different configurations — custom rules, different AI models, export formats.' },
                        { num: '03', title: 'Maintainability', desc: 'Change one module without breaking others. Fix the RuleEngine without touching the StructureDetector.' },
                        { num: '04', title: 'Testability', desc: 'Each class can be unit-tested in isolation — mock inputs, verify outputs, measure performance.' }
                    ];
                    items.forEach((item, i) => {
                        const col = i % 2, row = Math.floor(i / 2);
                        const cx = 0.5 + col * 4.8, cy = 2.05 + row * 1.65, cw = 4.4, ch = 1.45;
                        addCard(s, cx, cy, cw, ch);
                        s.addText(item.num, { x: cx + 0.2, y: cy + 0.15, w: 0.65, h: 0.55, fontSize: 30, fontFace: FONT, color: W20, bold: true, align: 'left' });
                        s.addText(item.title, { x: cx + 0.9, y: cy + 0.15, w: cw - 1.2, h: 0.38, fontSize: 16, fontFace: FONT, color: W, bold: true, align: 'left' });
                        s.addText(item.desc, { x: cx + 0.9, y: cy + 0.58, w: cw - 1.2, h: 0.75, fontSize: 11, fontFace: FONT, color: W70, align: 'left', valign: 'top', lineSpacingMultiple: 1.35 });
                    });
                }

                // ── SLIDE 6: ARCHITECTURE ──
                pctLabel.innerText = 'Building Slide 6/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[5] };
                    s.transition = TRANSITION;

                    addLabel(s, 'System Architecture');
                    addHeading(s, [{ text: 'The ' }, { text: '4-Stage Pipeline', color: PURPLE }]);

                    const steps = [
                        { icon: '📝', label: '1. TextProcessor', sub: 'Tokenize' },
                        { icon: '🔎', label: '2. StructureDetector', sub: 'Classify' },
                        { icon: '⚙️', label: '3. RuleEngine', sub: 'Style' },
                        { icon: '✨', label: '4. OutputGenerator', sub: 'Render' }
                    ];
                    steps.forEach((step, i) => {
                        const sx = 0.65 + i * 2.45, sy = 2.15;
                        addCard(s, sx, sy, 1.9, 1.25);
                        s.addText(step.icon, { x: sx, y: sy + 0.1, w: 1.9, h: 0.4, fontSize: 22, align: 'center' });
                        s.addText(step.label, { x: sx + 0.05, y: sy + 0.52, w: 1.8, h: 0.3, fontSize: 10, fontFace: FONT, color: W, bold: true, align: 'center' });
                        s.addText(step.sub, { x: sx, y: sy + 0.85, w: 1.9, h: 0.25, fontSize: 9, fontFace: FONT, color: W40, align: 'center' });
                        if (i < 3) s.addText('→', { x: sx + 1.9, y: sy + 0.3, w: 0.55, h: 0.5, fontSize: 22, color: W40, align: 'center' });
                    });

                    addCard(s, 1.2, 3.8, 7.6, 1.3);
                    s.addText('EXTENSIONS & MODULES', { x: 1.2, y: 3.88, w: 7.6, h: 0.35, fontSize: 10, fontFace: FONT, color: W50, bold: true, charSpacing: 2, align: 'center' });
                    s.addText('🤖 AIFormatter  (Gemini API)', { x: 1.5, y: 4.35, w: 3.5, h: 0.35, fontSize: 13, fontFace: FONT, color: W70, align: 'center' });
                    s.addText('📦 DocxExporter  (OpenXML)', { x: 5.0, y: 4.35, w: 3.5, h: 0.35, fontSize: 13, fontFace: FONT, color: W70, align: 'center' });
                }

                // ── SLIDE 7: INPUT PIPELINE ──
                pctLabel.innerText = 'Building Slide 7/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[6] };
                    s.transition = TRANSITION;

                    addLabel(s, 'OOPD Deep Dive');
                    addHeading(s, [{ text: 'Input Pipeline', color: ROSE }, { text: ' Classes' }]);
                    addBody(s, 'Click any Code Module below to securely proxy its simulated execution pipeline logic and state output.', { y: 1.7, h: 0.5, fontSize: 12 });

                    addCodeWindow(s, 0.4, 2.4, 4.4, 2.7, { fileName: 'textProcessor.js', fileColor: PINK, tag: 'STAGE 1', tagBg: '0A2A0A', tagColor: GREEN, code: 'class TextProcessor {\n  constructor(rawText) {\n    this.rawText = rawText;\n  }\n\n  normalize() {\n    return this.rawText.trim();\n  }\n}' });
                    addCodeWindow(s, 5.2, 2.4, 4.4, 2.7, { fileName: 'structureDetector.js', fileColor: TEAL, tag: 'STAGE 2', tagBg: '0A2A0A', tagColor: GREEN, code: 'class StructureDetector {\n  classifyBlocks(textBlocks) {\n    // Identify: h1, h2, p, ul\n    return classifiedElements;\n  }\n\n  _detectType(block) {\n    // Heuristic matching\n  }\n}' });
                }

                // ── SLIDE 8: PROCESSING PIPELINE ──
                pctLabel.innerText = 'Building Slide 8/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[7] };
                    s.transition = TRANSITION;

                    addLabel(s, 'OOPD Deep Dive');
                    addHeading(s, [{ text: 'Processing', color: TEAL }, { text: ' Classes' }]);
                    addBody(s, 'Click any Code Module below to securely proxy its simulated execution pipeline logic and state output.', { y: 1.7, h: 0.5, fontSize: 12 });

                    addCodeWindow(s, 0.4, 2.4, 4.4, 2.7, { fileName: 'ruleEngine.js', fileColor: PURPLE, tag: 'STAGE 3', tagBg: '0A2A0A', tagColor: GREEN, code: "class RuleEngine {\n  constructor(customRules) {\n    this.defaultRules = {\n      h1: { fontSize: '16pt' },\n    };\n  }\n\n  applyRules(elements) {\n    // Inject merged styling\n  }\n}" });
                    addCodeWindow(s, 5.2, 2.4, 4.4, 2.7, { fileName: 'outputGenerator.js', fileColor: GOLD, tag: 'STAGE 4', tagBg: '0A2A0A', tagColor: GREEN, code: "class OutputGenerator {\n  generateHTML(styledElements) {\n    // Build semantics\n    return htmlParts.join('\\n');\n  }\n\n  _escapeHTML(str) {\n    // XSS Prevention\n  }\n}" });
                }

                // ── SLIDE 9: AI & EXPORT ──
                pctLabel.innerText = 'Building Slide 9/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[8] };
                    s.transition = TRANSITION;

                    addLabel(s, 'OOPD Deep Dive');
                    addHeading(s, [{ text: 'AI & Export', color: GREEN }, { text: ' Classes' }]);
                    addBody(s, 'Click any Code Module below to securely proxy its simulated execution pipeline logic and state output.', { y: 1.7, h: 0.5, fontSize: 12 });

                    addCodeWindow(s, 0.4, 2.4, 4.4, 2.7, { fileName: 'aiFormatter.js', fileColor: BLUE, tag: 'EXTENSION', tagBg: '0A1A3D', tagColor: BLUE, code: "class AIFormatter {\n  async formatText(rawText) {\n    // Route to Gemini API\n    const res = await fetch('/api/format');\n    return res.json();\n  }\n}" });
                    addCodeWindow(s, 5.2, 2.4, 4.4, 2.7, { fileName: 'docxExporter.js', fileColor: ROSE, tag: 'EXTENSION', tagBg: '3D0A14', tagColor: ROSE, code: "const DocxExporter = (() => {\n  async function generate(el) {\n    // Build DOCX ZIP buffer\n    return zip.generateAsync({\n      type: 'blob'\n    });\n  }\n  return { generate };\n})();" });
                }

                // ── SLIDE 10: OOP PRINCIPLES ──
                pctLabel.innerText = 'Building Slide 10/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[9] };
                    s.transition = TRANSITION;

                    addLabel(s, 'Core Concepts');
                    addHeading(s, [{ text: 'OOP Principles ' }, { text: 'in Action', color: PURPLE }]);

                    const principles = [
                        { icon: '🔒', title: 'Encapsulation', titleColor: PINK, desc: 'Each class hides its internal data. TextProcessor privately manages rawText; RuleEngine encapsulates defaultRules.' },
                        { icon: '🎭', title: 'Abstraction', titleColor: BLUE, desc: 'app.js calls formatText() without knowing if it uses AI or heuristic engine. Complexity is hidden.' },
                        { icon: '🧬', title: 'Inheritance Ready', titleColor: GREEN, desc: 'Architecture supports extension — a MarkdownDetector could extend StructureDetector.' },
                        { icon: '🔄', title: 'Polymorphism', titleColor: GOLD, desc: "Both AIFormatter and the heuristic pipeline process input similarly — the controller doesn't care which runs." }
                    ];
                    principles.forEach((p, i) => {
                        const col = i % 2, row = Math.floor(i / 2);
                        const cx = 0.5 + col * 4.8, cy = 2.05 + row * 1.65, cw = 4.4, ch = 1.45;
                        addCard(s, cx, cy, cw, ch);
                        s.addText(p.icon, { x: cx + 0.15, y: cy + 0.15, w: 0.5, h: 0.45, fontSize: 24, align: 'center' });
                        s.addText(p.title, { x: cx + 0.7, y: cy + 0.15, w: cw - 1.0, h: 0.4, fontSize: 16, fontFace: FONT, color: p.titleColor, bold: true, align: 'left' });
                        s.addText(p.desc, { x: cx + 0.2, y: cy + 0.6, w: cw - 0.4, h: 0.75, fontSize: 11, fontFace: FONT, color: W70, align: 'left', valign: 'top', lineSpacingMultiple: 1.35 });
                    });
                }

                // ── SLIDE 11: TECH STACK ──
                pctLabel.innerText = 'Building Slide 11/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[10] };
                    s.transition = TRANSITION;

                    addLabel(s, 'Under the Hood');
                    addHeading(s, [{ text: 'Tech Stack', color: PURPLE }, { text: ' & Deployment' }]);

                    const techs = [
                        { title: 'HTML5 & CSS3', desc: 'Pure geometry, semantic views.', color: W },
                        { title: 'JS Vanilla', desc: '0 Dependencies Architecture.', color: GOLD },
                        { title: 'Gemini Flash', desc: 'RESTful Pipeline Integration.', color: BLUE },
                        { title: 'Vercel', desc: 'Serverless Edge Node delivery.', color: PURPLE },
                        { title: 'GitHub', desc: 'Automated CI/CD Pipeline.', color: TEAL },
                        { title: 'Docxtemplater', desc: 'Client-side document encoding.', color: ROSE }
                    ];
                    techs.forEach((t, i) => {
                        const col = i % 3, row = Math.floor(i / 3);
                        const cx = 0.5 + col * 3.15, cy = 2.15 + row * 1.55;
                        addCard(s, cx, cy, 2.85, 1.35);
                        s.addText(t.title, { x: cx, y: cy + 0.2, w: 2.85, h: 0.5, fontSize: 18, fontFace: FONT, color: t.color, bold: true, align: 'center' });
                        s.addText(t.desc, { x: cx + 0.15, y: cy + 0.75, w: 2.55, h: 0.4, fontSize: 11, fontFace: FONT, color: W50, align: 'center' });
                    });
                }

                // ── SLIDE 12: LIVE DEMO ──
                pctLabel.innerText = 'Building Slide 12/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[11] };
                    s.transition = TRANSITION;

                    addLabel(s, 'In Action');
                    addHeading(s, [{ text: 'Live Demo', color: GOLD }]);

                    const demoSteps = [
                        { icon: '📝', label: 'Unformatted Blob', color: W },
                        { icon: '🔄', label: 'OOP Pipeline', color: GREEN },
                        { icon: '✨', label: 'Semantic Output', color: BLUE }
                    ];
                    demoSteps.forEach((step, i) => {
                        const sx = 0.9 + i * 2.9, sy = 2.3;
                        addCard(s, sx, sy, 2.4, 1.6);
                        s.addText(step.icon, { x: sx, y: sy + 0.2, w: 2.4, h: 0.55, fontSize: 30, align: 'center' });
                        s.addText(step.label, { x: sx, y: sy + 0.85, w: 2.4, h: 0.4, fontSize: 14, fontFace: FONT, color: step.color, bold: true, align: 'center' });
                        if (i < 2) s.addText('→', { x: sx + 2.4, y: sy + 0.35, w: 0.5, h: 0.55, fontSize: 24, color: W40, align: 'center' });
                    });
                }

                // ── SLIDE 13: THANK YOU ──
                pctLabel.innerText = 'Building Slide 13/13...';
                await new Promise(r => setTimeout(r, 30));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[12] };
                    s.transition = TRANSITION;

                    s.addText([
                        { text: 'Thank ', options: { fontSize: 56, fontFace: FONT, bold: true, color: W } },
                        { text: 'You.', options: { fontSize: 56, fontFace: FONT, bold: true, color: ORANGE } }
                    ], { x: 0.5, y: 0.7, w: 9, h: 1.3, align: 'center', valign: 'middle' });

                    s.addText('FormatFlow — OOPD Project Showcase', {
                        x: 1, y: 2.1, w: 8, h: 0.5, fontSize: 20, fontFace: FONT, color: W70, align: 'center'
                    });

                    s.addShape(pptx.ShapeType.roundRect, { x: 2.0, y: 3.1, w: 2.8, h: 0.55, fill: { color: W, transparency: 90 }, line: { color: W, width: 0.5, transparency: 80 }, rectRadius: 0.27 });
                    s.addText('⚡ View Source Code', {
                        x: 2.0, y: 3.1, w: 2.8, h: 0.55, fontSize: 12, fontFace: FONT, color: W, bold: true, align: 'center', valign: 'middle',
                        hyperlink: { url: 'https://github.com/ayankhan964825-lab/Smart-Text-Formatter', tooltip: 'Open GitHub Repository' }
                    });

                    s.addShape(pptx.ShapeType.roundRect, { x: 5.2, y: 3.1, w: 2.8, h: 0.55, fill: { color: BLUE }, line: { width: 0 }, rectRadius: 0.27, shadow: { type: 'outer', blur: 8, offset: 2, color: BLUE, opacity: 0.4 } });
                    s.addText('🚀 Live Demo App', {
                        x: 5.2, y: 3.1, w: 2.8, h: 0.55, fontSize: 12, fontFace: FONT, color: W, bold: true, align: 'center', valign: 'middle',
                        hyperlink: { url: 'https://smart-text-formatter.vercel.app', tooltip: 'Open Live Application' }
                    });

                    s.addText('Questions & Answers', { x: 2, y: 4.3, w: 6, h: 0.5, fontSize: 18, fontFace: FONT, color: W50, align: 'center' });
                }

                // ═══════════════════════════════════════════
                //  COMPILE & DOWNLOAD
                // ═══════════════════════════════════════════
                pctLabel.innerText = 'Compiling native .pptx...';
                await pptx.writeFile({ fileName: 'OOPD_Showcase_Editable.pptx' });
                pctLabel.innerText = 'Download complete!';
                await new Promise(r => setTimeout(r, 1200));

            } catch (err) {
                console.error('PPTX Generation Error:', err);
                alert('Failed to export PPTX. Error: ' + err.message);
            } finally {
                overlay.style.display = 'none';
                pctLabel.innerText = '';
            }
        });
    }
});
