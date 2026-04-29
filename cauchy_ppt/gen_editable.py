js_content = """// exportPptx.js — Hybrid Editable PPTX Exporter
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
                pptx.author = 'Smart Text Formatter Team';
                pptx.title = 'Cauchy Integral Theorem';

                // Colors
                const FONT = 'Segoe UI';
                const FONT_MATH = 'Cambria Math';
                const W = 'FFFFFF';
                const W80 = 'CCCCCC';
                const W70 = 'B3B3B3';
                const W50 = '808080';
                const W40 = '666666';
                const W30 = '4D4D4D';
                const BLUE = '2997FF';
                const PURPLE = 'BF5AF2';
                const PINK = 'FF375F';
                const ORANGE = 'FF9F0A';
                const GREEN = '30D158';
                const TEAL = '5AC8FA';
                const GOLD = 'FFD60A';
                const ROSE = 'FF6B8A';

                const TRANSITION = { type: 'fade', speed: 'fast' };

                // Helpers
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
                    slide.addText(text, { x: opts.x || 1.5, y: opts.y || 1.85, w: opts.w || 7, h: opts.h || 0.7, fontSize: opts.fontSize || 14, fontFace: FONT, color: opts.color || W70, align: opts.align || 'center', valign: 'top', lineSpacingMultiple: 1.4 });
                }
                function addCard(slide, x, y, w, h, opts = {}) {
                    slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: W, transparency: 96 }, line: { color: W, width: 0.5, transparency: 92 }, rectRadius: 0.15 });
                    if (opts.topColor) slide.addShape(pptx.ShapeType.line, { x: x + 0.12, y, w: w - 0.24, h: 0, line: { color: opts.topColor, width: 3 } });
                }
                function addMathBox(slide, x, y, w, h, text) {
                    slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: BLUE, transparency: 92 }, line: { color: BLUE, width: 1, transparency: 75 }, rectRadius: 0.15 });
                    slide.addText(text, { x, y, w, h, fontSize: 32, fontFace: FONT_MATH, color: TEAL, bold: true, align: 'center', valign: 'middle' });
                }

                // ═══════════════════════════════════════════
                //  PHASE 1: CAPTURE ALL SLIDE BACKGROUNDS
                // ═══════════════════════════════════════════
                pctLabel.innerText = 'Freezing animations...';
                const originalActiveSlide = document.querySelector('.slide.active');

                // Kill CSS animations/transitions
                const cssKill = document.createElement('style');
                cssKill.innerHTML = `
                    * { transition: none !important; animation: none !important; animation-play-state: paused !important; }
                    .animate-in { opacity: 1 !important; transform: none !important; filter: none !important; }
                    .slide { opacity: 1 !important; visibility: visible !important; transform: none !important; }
                `;
                document.head.appendChild(cssKill);

                const allSlides = document.querySelectorAll('.slide');
                const totalSlides = allSlides.length;
                const bgImages = [];

                for (let i = 0; i < totalSlides; i++) {
                    pctLabel.innerText = `Capturing background ${i + 1}/${totalSlides}...`;

                    allSlides.forEach(s => s.classList.remove('active'));
                    allSlides[i].classList.add('active');

                    await new Promise(r => setTimeout(r, 400));
                    await new Promise(r => requestAnimationFrame(r));

                    const canvas = await html2canvas(allSlides[i], {
                        scale: 2,
                        backgroundColor: '#000000',
                        logging: false,
                        allowTaint: true,
                        useCORS: true,
                        onclone: (clonedDoc, clonedEl) => {
                            // Hide all text content to capture only background/theme
                            const content = clonedEl.querySelector('.slide-content');
                            if (content) content.style.visibility = 'hidden';
                            // Also hide UI overlays
                            const uiEls = clonedDoc.querySelectorAll('.nav-arrow, .slide-counter, .slide-dots, .fullscreen-btn, .export-pptx-btn, .progress-bar');
                            uiEls.forEach(el => el.style.display = 'none');
                        }
                    });

                    bgImages.push(canvas.toDataURL('image/jpeg', 0.92));
                }

                // Restore state
                document.head.removeChild(cssKill);
                allSlides.forEach(s => s.classList.remove('active'));
                if (originalActiveSlide) originalActiveSlide.classList.add('active');

                // ═══════════════════════════════════════════
                //  PHASE 2: BUILD PPTX WITH BG IMAGES + EDITABLE TEXT
                // ═══════════════════════════════════════════
                const delayStr = 'Building Slide ';
                const slideW = 10;
                
                // ── SLIDE 1: Title ──
                pctLabel.innerText = delayStr + '1/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[0] };
                    s.transition = TRANSITION;
                    
                    s.addText('COMPLEX ANALYSIS PRESENTATION', { x: 3.0, y: 0.7, w: 4.0, h: 0.42, fontSize: 10, fontFace: FONT, color: W60, bold: true, charSpacing: 4, align: 'center', valign: 'middle' });
                    s.addText([ { text: 'Cauchy Integral\\n', options: { fontSize: 56, fontFace: FONT, bold: true, color: W } }, { text: 'Theorem', options: { fontSize: 56, fontFace: FONT, bold: true, color: BLUE } } ], { x: 0.5, y: 1.4, w: 9, h: 1.9, align: 'center', valign: 'middle', lineSpacingMultiple: 0.95 });
                    s.addText('Understanding Analytic Functions & Contour Integration', { x: 1.5, y: 3.4, w: 7, h: 0.5, fontSize: 18, fontFace: FONT, italic: true, color: W70, align: 'center' });
                    s.addText('B.Tech Mathematics • SRM Institute of Science and Technology', { x: 1.5, y: 4.15, w: 7, h: 0.42, fontSize: 11, fontFace: FONT, color: BLUE, bold: true, align: 'center', valign: 'middle' });
                }

                // ── SLIDE 2: Team ──
                pctLabel.innerText = delayStr + '2/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[1] };
                    s.transition = TRANSITION;
                    
                    s.addText('TEAM', { x: 1.0, y: 2.0, w: 2.5, h: 1.5, fontSize: 22, fontFace: FONT, color: W, bold: true, align: 'center', valign: 'middle' });
                    addLabel(s, 'Presented By', { x: 4.5, y: 0.8, w: 5.0, align: 'left', color: BLUE });
                    s.addText([ { text: 'Our ', options: { fontSize: 36, fontFace: FONT, bold: true, color: W } }, { text: 'Group', options: { fontSize: 36, fontFace: FONT, bold: true, color: BLUE } } ], { x: 4.5, y: 1.1, w: 5.0, h: 0.65, align: 'left', valign: 'middle' });
                    
                    const members = [ { n: 'Member 1', id: 'RA24XXXXXXXXXX' }, { n: 'Member 2', id: 'RA24XXXXXXXXXX' }, { n: 'Member 3', id: 'RA24XXXXXXXXXX' }, { n: 'Member 4', id: 'RA24XXXXXXXXXX' } ];
                    members.forEach((m, i) => {
                        const col = i % 2, row = Math.floor(i / 2);
                        const mx = 4.5 + col * 2.5, my = 2.0 + row * 1.0;
                        s.addText(m.n, { x: mx, y: my, w: 2.4, h: 0.35, fontSize: 15, fontFace: FONT, color: W80, align: 'left' });
                        s.addText(m.id, { x: mx, y: my + 0.32, w: 2.4, h: 0.28, fontSize: 10, fontFace: FONT, color: W30, align: 'left' });
                    });
                    s.addText([ { text: 'Under the guidance of ', options: { fontSize: 13, fontFace: FONT, color: W50 } }, { text: 'Dr. [Guide Name]', options: { fontSize: 13, fontFace: FONT, color: W, bold: true } }, { text: '\\n(Professor, Mathematics Department)', options: { fontSize: 11, fontFace: FONT, color: W50 } } ], { x: 4.5, y: 4.1, w: 5.0, h: 0.8, align: 'left', valign: 'top' });
                }

                // ── SLIDE 3: Intro ──
                pctLabel.innerText = delayStr + '3/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[2] };
                    s.transition = TRANSITION;
                    
                    addLabel(s, 'Foundation');
                    addHeading(s, [{ text: 'Introduction to ' }, { text: 'Complex Analysis', color: GOLD }]);
                    addBody(s, 'Complex analysis studies functions of complex variables z = x + iy, where i = √-1.', { y: 1.6, h: 0.4 });
                    
                    addCard(s, 1.5, 2.2, 3.2, 2.8, { topColor: GOLD });
                    s.addText('∮', { x: 1.5, y: 2.4, w: 3.2, h: 0.6, fontSize: 36, fontFace: FONT_MATH, align: 'center', color: W });
                    s.addText('Analytic Functions', { x: 1.5, y: 3.1, w: 3.2, h: 0.4, fontSize: 16, fontFace: FONT, color: GOLD, bold: true, align: 'center' });
                    s.addText('Functions differentiable w.r.t. complex variables. They have remarkable properties: infinite differentiability and power series representation.', { x: 1.7, y: 3.6, w: 2.8, h: 1.2, fontSize: 11, fontFace: FONT, color: W70, align: 'left', valign: 'top' });
                    
                    addCard(s, 5.3, 2.2, 3.2, 2.8, { topColor: ROSE });
                    s.addText('∫', { x: 5.3, y: 2.4, w: 3.2, h: 0.6, fontSize: 36, fontFace: FONT_MATH, align: 'center', color: W });
                    s.addText('Contour Integration', { x: 5.3, y: 3.1, w: 3.2, h: 0.4, fontSize: 16, fontFace: FONT, color: ROSE, bold: true, align: 'center' });
                    s.addText('Integration along paths in the complex plane. This leads to powerful results that simplify many difficult real integrals.', { x: 5.5, y: 3.6, w: 2.8, h: 1.2, fontSize: 11, fontFace: FONT, color: W70, align: 'left', valign: 'top' });
                }

                // ── SLIDE 4: Why Complex ──
                pctLabel.innerText = delayStr + '4/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[3] };
                    s.transition = TRANSITION;
                    
                    addLabel(s, 'The Power');
                    addHeading(s, [{ text: 'Why Complex Integration is ' }, { text: 'Powerful', color: TEAL }]);
                    addBody(s, 'In real calculus, evaluating certain integrals can be extremely difficult. By extending into the complex plane, many become simple.', { y: 1.6, h: 0.6 });
                    
                    s.addShape(pptx.ShapeType.roundRect, { x: 1.5, y: 2.5, w: 1.6, h: 0.4, fill: { color: PINK, transparency: 80 }, rectRadius: 0.2 });
                    s.addText('Path Independence', { x: 1.5, y: 2.5, w: 1.6, h: 0.4, fontSize: 10, color: W, align: 'center' });
                    
                    s.addShape(pptx.ShapeType.roundRect, { x: 3.3, y: 2.5, w: 1.6, h: 0.4, fill: { color: GREEN, transparency: 80 }, rectRadius: 0.2 });
                    s.addText('Evaluate Real Integrals', { x: 3.3, y: 2.5, w: 1.6, h: 0.4, fontSize: 10, color: W, align: 'center' });
                    
                    s.addShape(pptx.ShapeType.roundRect, { x: 5.1, y: 2.5, w: 1.6, h: 0.4, fill: { color: BLUE, transparency: 80 }, rectRadius: 0.2 });
                    s.addText('Residue Theorem', { x: 5.1, y: 2.5, w: 1.6, h: 0.4, fontSize: 10, color: W, align: 'center' });
                    
                    s.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 2.5, w: 1.6, h: 0.4, fill: { color: PURPLE, transparency: 80 }, rectRadius: 0.2 });
                    s.addText('Laurent Series', { x: 6.9, y: 2.5, w: 1.6, h: 0.4, fontSize: 10, color: W, align: 'center' });
                    
                    addMathBox(s, 2.5, 3.4, 5.0, 1.2, '∮_C f(z) dz = 0');
                }

                // ── SLIDE 5: Definitions ──
                pctLabel.innerText = delayStr + '5/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[4] };
                    s.transition = TRANSITION;
                    
                    addLabel(s, 'Prerequisites');
                    addHeading(s, [{ text: 'Basic ' }, { text: 'Definitions', color: BLUE }]);
                    
                    const defs = [
                        { t: 'Complex Function', d: 'f(z) = u(x,y) + iv(x,y) where z = x + iy. u = real part, v = imaginary part.' },
                        { t: 'Analytic Function', d: 'Differentiable at every point in a region. Also called holomorphic. Examples: z², eᶻ, sin(z).' },
                        { t: 'Contour', d: 'A smooth curve/path in the complex plane along which integration is performed. Can be a line, circle, or curve.' },
                        { t: 'Closed Contour', d: "A path whose start and end points are the same. Example: circle, closed loop. Critical for Cauchy's theorem." },
                        { t: 'Simply Connected', d: 'A region where any closed contour can be shrunk to a point without leaving the region. No holes allowed.' },
                        { t: 'Derivative', d: "f'(z) = lim (Δz→0) [f(z+Δz) − f(z)] / Δz. If this limit exists, the function is differentiable." }
                    ];
                    defs.forEach((def, i) => {
                        const col = i % 2, row = Math.floor(i / 2);
                        const cx = 1.0 + col * 4.2, cy = 1.8 + row * 1.1, cw = 3.8, ch = 0.9;
                        addCard(s, cx, cy, cw, ch);
                        s.addText(def.t, { x: cx + 0.15, y: cy + 0.1, w: cw - 0.3, h: 0.3, fontSize: 12, fontFace: FONT, color: TEAL, bold: true, align: 'left' });
                        s.addText(def.d, { x: cx + 0.15, y: cy + 0.4, w: cw - 0.3, h: 0.4, fontSize: 10, fontFace: FONT, color: W70, align: 'left', valign: 'top' });
                    });
                }

                // ── SLIDE 6: Theorem Statement ──
                pctLabel.innerText = delayStr + '6/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[5] };
                    s.transition = TRANSITION;
                    
                    addHeading(s, [{ text: 'Cauchy Integral ' }, { text: 'Theorem', color: ROSE }], { y: 0.7 });
                    addBody(s, 'If f(z) is analytic everywhere inside and on a closed contour C in a simply connected region, then:', { y: 1.4 });
                    
                    addMathBox(s, 2.5, 2.1, 5.0, 1.2, '∮_C f(z) dz = 0');
                    
                    addCard(s, 1.5, 3.6, 7.0, 1.4);
                    s.addText('KEY INSIGHTS', { x: 1.5, y: 3.7, w: 7.0, h: 0.3, fontSize: 10, color: W50, bold: true, align: 'center' });
                    const ins = [
                        'The integral depends only on analyticity — NOT the contour shape.',
                        'No singularities inside C means the integral is always zero.',
                        'Analogous to conservative vector fields in real calculus.',
                        'Discovered by Augustin-Louis Cauchy (1825).'
                    ];
                    ins.forEach((txt, i) => {
                        const col = i % 2, row = Math.floor(i / 2);
                        s.addText(txt, { x: 1.7 + col * 3.4, y: 4.1 + row * 0.4, w: 3.2, h: 0.3, fontSize: 10, color: W70, align: 'left' });
                    });
                }

                // ── SLIDE 7: Conditions ──
                pctLabel.innerText = delayStr + '7/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[6] };
                    s.transition = TRANSITION;
                    
                    s.addText('∮', { x: 0.5, y: 1.0, w: 2.0, h: 3.0, fontSize: 120, fontFace: FONT_MATH, color: GREEN, align: 'center', valign: 'middle', transparency: 85 });
                    addHeading(s, [{ text: 'Conditions of the ' }, { text: 'Theorem', color: GREEN }], { x: 2.5, w: 6.5, align: 'left', y: 0.8 });
                    addBody(s, 'For the Cauchy Integral Theorem to hold, ALL of the following must be satisfied:', { x: 2.5, w: 6.5, align: 'left', y: 1.5 });
                    
                    const conds = [
                        'f(z) must be analytic inside the region',
                        'f(z) must be analytic on the boundary (contour C)',
                        'The contour C must be closed',
                        'The region must be simply connected (no holes)',
                        'No singularities inside the contour'
                    ];
                    conds.forEach((c, i) => {
                        s.addText('✔', { x: 2.5, y: 2.2 + i * 0.5, w: 0.4, h: 0.4, fontSize: 14, color: GREEN, bold: true, align: 'center' });
                        s.addText(c, { x: 3.0, y: 2.2 + i * 0.5, w: 6.0, h: 0.4, fontSize: 12, color: W80, align: 'left' });
                    });
                }

                // ── SLIDE 8: Proof ──
                pctLabel.innerText = delayStr + '8/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[7] };
                    s.transition = TRANSITION;
                    
                    addHeading(s, [{ text: 'Proof ' }, { text: 'Outline', color: ORANGE }], { y: 0.6 });
                    
                    const steps = [
                        'Step 1: Write f(z) = u(x,y) + iv(x,y) and dz = dx + idy',
                        'Step 2: Expand ∮_C f(z)dz = ∮_C(u dx − v dy) + i∮_C(v dx + u dy)',
                        "Step 3: Apply Green's Theorem → convert line integrals to double integrals over R",
                        'Step 4: Use Cauchy–Riemann equations: ∂u/∂x = ∂v/∂y and ∂u/∂y = −∂v/∂x',
                        'Step 5: Both double integrals = 0 ⇒ ∮_C f(z) dz = 0 ✔'
                    ];
                    steps.forEach((st, i) => {
                        const sy = 1.6 + i * 0.7;
                        s.addShape(pptx.ShapeType.roundRect, { x: 1.5, y: sy, w: 7.0, h: 0.5, fill: { color: W, transparency: 96 }, line: { color: W, width: 0.5, transparency: 92 }, rectRadius: 0.1 });
                        s.addShape(pptx.ShapeType.rect, { x: 1.5, y: sy, w: 0.05, h: 0.5, fill: { color: PURPLE } });
                        s.addText(st, { x: 1.7, y: sy, w: 6.6, h: 0.5, fontSize: 11, fontFace: FONT, color: W80, align: 'left', valign: 'middle' });
                    });
                }

                // ── SLIDE 9: Formula ──
                pctLabel.innerText = delayStr + '9/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[8] };
                    s.transition = TRANSITION;
                    
                    s.addText('f', { x: 0.5, y: 1.0, w: 2.0, h: 3.0, fontSize: 120, fontFace: FONT_MATH, color: PURPLE, align: 'center', valign: 'middle', transparency: 85 });
                    addHeading(s, [{ text: 'Cauchy Integral ' }, { text: 'Formula', color: GOLD }], { x: 2.5, w: 6.5, align: 'left', y: 0.8 });
                    addBody(s, "If f(z) is analytic inside and on C, and 'a' is any point inside C:", { x: 2.5, w: 6.5, align: 'left', y: 1.5 });
                    
                    addMathBox(s, 2.5, 2.0, 5.0, 1.0, 'f(a) = (1/2πi) ∮_C f(z)/(z−a) dz');
                    
                    addCard(s, 2.5, 3.3, 6.0, 1.4);
                    s.addText('WHY IT MATTERS', { x: 2.5, y: 3.4, w: 6.0, h: 0.3, fontSize: 10, color: W50, bold: true, align: 'center' });
                    const ins = [
                        'Value at any interior point determined by boundary values',
                        'Analytic functions are infinitely differentiable',
                        'Leads to Taylor series expansions',
                        'Foundation for the Residue Theorem'
                    ];
                    ins.forEach((txt, i) => {
                        const col = i % 2, row = Math.floor(i / 2);
                        s.addText(txt, { x: 2.7 + col * 2.8, y: 3.8 + row * 0.4, w: 2.6, h: 0.3, fontSize: 10, color: W70, align: 'left' });
                    });
                }

                // ── SLIDE 10: Applications ──
                pctLabel.innerText = delayStr + '10/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[9] };
                    s.transition = TRANSITION;
                    
                    addLabel(s, 'Real-World Impact');
                    addHeading(s, [{ text: 'Applications of ' }, { text: "Cauchy's Theorem", color: TEAL }]);
                    
                    const apps = [
                        { icon: '🌊', title: 'Fluid Dynamics', desc: 'Flow analysis around airfoils and obstacles using complex potentials.' },
                        { icon: '⚡', title: 'Electromagnetic Theory', desc: "Solving Maxwell's equations in 2D using conformal mapping." },
                        { icon: '🧪', title: 'Quantum Physics', desc: 'Path integrals and residue calculus in quantum field theory.' }
                    ];
                    apps.forEach((a, i) => {
                        const cx = 1.0 + i * 2.8, cy = 2.0, cw = 2.4, ch = 2.5;
                        addCard(s, cx, cy, cw, ch);
                        s.addText(a.icon, { x: cx, y: cy + 0.3, w: cw, h: 0.6, fontSize: 40, align: 'center' });
                        s.addText(a.title, { x: cx, y: cy + 1.0, w: cw, h: 0.4, fontSize: 14, fontFace: FONT, color: W, bold: true, align: 'center' });
                        s.addText(a.desc, { x: cx + 0.2, y: cy + 1.5, w: cw - 0.4, h: 0.8, fontSize: 11, fontFace: FONT, color: W70, align: 'left', valign: 'top' });
                    });
                }

                // ── SLIDE 11: Examples ──
                pctLabel.innerText = delayStr + '11/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[10] };
                    s.transition = TRANSITION;
                    
                    addHeading(s, [{ text: 'Worked ' }, { text: 'Examples', color: ROSE }], { y: 0.6 });
                    addBody(s, 'Applying the theorem to evaluate contour integrals of analytic functions:', { y: 1.3 });
                    
                    const exs = [
                        { lbl: 'Ex 1', frm: '∮_C z² dz', res: 'f(z)=z² is a polynomial — analytic everywhere → = 0' },
                        { lbl: 'Ex 2', frm: '∮_C (3z+2) dz', res: 'f(z)=3z+2 is linear — analytic everywhere → = 0' },
                        { lbl: 'Ex 3', frm: '∮_C eᶻ dz', res: 'f(z)=eᶻ is exponential — analytic everywhere → = 0' }
                    ];
                    exs.forEach((ex, i) => {
                        const cy = 2.0 + i * 0.7;
                        addCard(s, 1.5, cy, 7.0, 0.6);
                        s.addText(ex.lbl, { x: 1.7, y: cy + 0.15, w: 0.6, h: 0.3, fontSize: 11, color: PINK, bold: true, align: 'left' });
                        s.addText(ex.frm, { x: 2.3, y: cy + 0.15, w: 1.5, h: 0.3, fontSize: 13, fontFace: FONT_MATH, color: TEAL, bold: true, align: 'left' });
                        s.addText(ex.res, { x: 3.9, y: cy + 0.15, w: 4.4, h: 0.3, fontSize: 11, color: W70, align: 'left' });
                    });
                    
                    addCard(s, 2.0, 4.3, 6.0, 0.8, { topColor: PINK });
                    s.addText("All polynomial, exponential, and trigonometric functions are analytic everywhere in the complex plane.\\nBy Cauchy's Theorem: their closed contour integrals = 0.", { x: 2.2, y: 4.4, w: 5.6, h: 0.6, fontSize: 10, fontFace: FONT_MONO, color: PINK, align: 'left', valign: 'middle' });
                }

                // ── SLIDE 12: What We Learned ──
                pctLabel.innerText = delayStr + '12/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[11] };
                    s.transition = TRANSITION;
                    
                    addHeading(s, [{ text: 'What We ' }, { text: 'Learned', color: ORANGE }], { y: 0.6 });
                    
                    const points = [
                        { t: '1. Integral is Zero: ', d: 'If a function has no breaks or sharp points inside a closed path, its integral is zero.', c: BLUE },
                        { t: '2. Inside Value: ', d: 'We can find the value of a function at any inside point using only its boundary values.', c: PURPLE },
                        { t: '3. Path Independence: ', d: 'The path you take does not matter — only the function matters.', c: GREEN },
                        { t: '4. Real-World Use: ', d: 'This helps solve very hard math problems easily in Physics, Engineering, Signal Processing & Quantum Mechanics.', c: ORANGE }
                    ];
                    points.forEach((p, i) => {
                        const cy = 1.6 + i * 0.9;
                        s.addShape(pptx.ShapeType.roundRect, { x: 1.5, y: cy, w: 7.0, h: 0.7, fill: { color: p.c, transparency: 85 }, line: { color: p.c, width: 1, transparency: 75 }, rectRadius: 0.1 });
                        s.addText([ { text: p.t, options: { bold: true, color: p.c } }, { text: p.d, options: { color: W } } ], { x: 1.7, y: cy, w: 6.6, h: 0.7, fontSize: 12, fontFace: FONT, align: 'left', valign: 'middle' });
                    });
                }

                // ── SLIDE 13: Conclusion ──
                pctLabel.innerText = delayStr + '13/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[12] };
                    s.transition = TRANSITION;
                    
                    addLabel(s, 'Wrapping Up');
                    addHeading(s, [{ text: 'Conclusion', color: GOLD }, { text: ' & References' }]);
                    addBody(s, 'The Cauchy Integral Theorem is a cornerstone of complex analysis. It shows that analytic functions have very special behavior — their integrals over closed paths are always zero. This one result leads to the Cauchy Integral Formula, Residue Theorem, Taylor Series, and Laurent Series. It is used across mathematics, physics, and engineering to solve problems that would otherwise be extremely difficult.', { y: 1.8, h: 1.5 });
                    
                    addCard(s, 2.0, 3.5, 6.0, 1.5);
                    s.addText('REFERENCES', { x: 2.2, y: 3.6, w: 5.6, h: 0.3, fontSize: 10, color: W50, bold: true, align: 'left' });
                    const refs = [
                        '1. Kreyszig, E. — Advanced Engineering Mathematics (10th Ed.)',
                        '2. Churchill, R.V. & Brown, J.W. — Complex Variables and Applications',
                        '3. Class lecture notes on Complex Analysis'
                    ];
                    refs.forEach((r, i) => {
                        s.addText(r, { x: 2.2, y: 4.0 + i * 0.3, w: 5.6, h: 0.3, fontSize: 11, color: W70, align: 'left' });
                    });
                }

                // ── SLIDE 14: Thank You ──
                pctLabel.innerText = delayStr + '14/14...';
                await new Promise(r => setTimeout(r, 10));
                {
                    const s = pptx.addSlide();
                    s.background = { data: bgImages[13] };
                    s.transition = TRANSITION;
                    
                    s.addText('Thank You', { x: 0.5, y: 2.0, w: 9, h: 1.0, fontSize: 64, fontFace: FONT, color: W, bold: true, align: 'center', valign: 'middle' });
                    s.addText('Questions & Discussion Welcome', { x: 0.5, y: 3.0, w: 9, h: 0.5, fontSize: 16, fontFace: FONT, color: GOLD, align: 'center' });
                    s.addText('Complex Analysis • SRM Institute of Science and Technology', { x: 0.5, y: 4.5, w: 9, h: 0.5, fontSize: 12, fontFace: FONT, color: W60, align: 'center', bold: true });
                }

                // ═══════════════════════════════════════════
                //  COMPILE & DOWNLOAD
                // ═══════════════════════════════════════════
                pctLabel.innerText = 'Compiling native .pptx...';
                await pptx.writeFile({ fileName: 'Cauchy_Integral_Theorem_Editable.pptx' });
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
"""

open(r'c:\Users\ayyub\.gemini\antigravity\scratch\NewProject\cauchy_ppt\exportPptx.js', 'w', encoding='utf-8').write(js_content)
print("Updated exportPptx.js!")
