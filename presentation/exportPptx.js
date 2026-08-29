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
                pptx.title = 'FormatFlow — Showcase';

                // ═══════════════════════════════════════════
                //  DESIGN TOKENS
                // ═══════════════════════════════════════════
                const FONT = 'Segoe UI';
                const FONT_MONO = 'Consolas';
                const W = 'FFFFFF';
                const W75 = 'BFBFBF';
                const W70 = 'B3B3B3';
                const W60 = '999999';

                const BLUE = '2997FF';
                const PURPLE = 'BF5AF2';
                const PINK = 'FF6B8A';
                const ORANGE = 'FF9F0A';
                const GREEN = '30D158';
                const GOLD = 'F5D76E';
                const RED = 'FF453A';
                const TEAL = '64D2FF';

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
                    const tagW = win.tag === 'EXPORT' ? 1.0 : 0.8;
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
                    .slide-content * { opacity: 0 !important; visibility: hidden !important; }
                    .slide-bg, .slide-bg * { opacity: 1 !important; visibility: visible !important; }
                `;
                document.head.appendChild(cssKill);

                // Small delay to let DOM settle
                await new Promise(r => setTimeout(r, 100));

                const bgDataUrls = [];
                const slidesDom = document.querySelectorAll('.slide');

                for (let i = 0; i < slidesDom.length; i++) {
                    pctLabel.innerText = 'Capturing background ' + (i + 1) + ' of ' + slidesDom.length + '...';
                    
                    slidesDom.forEach(s => s.classList.remove('active', 'prev', 'next-exit'));
                    slidesDom[i].classList.add('active');
                    
                    const bgNode = slidesDom[i].querySelector('.slide-bg');
                    const canvas = await html2canvas(bgNode, {
                        scale: 2,
                        backgroundColor: '#000000',
                        logging: false
                    });
                    bgDataUrls.push(canvas.toDataURL('image/jpeg', 0.85));
                }

                // Restore UI
                document.head.removeChild(cssKill);
                slidesDom.forEach(s => s.classList.remove('active'));
                if (originalActiveSlide) originalActiveSlide.classList.add('active');

                // ═══════════════════════════════════════════
                //  PHASE 2: BUILD NATIVE PPTX SLIDES
                // ═══════════════════════════════════════════
                
                // Helper to setup slide
                const makeSlide = (index) => {
                    let slide = pptx.addSlide();
                    slide.background = { data: bgDataUrls[index] };
                    // We don't have page numbers in this template natively, but if needed we add here.
                    return slide;
                };

                // Slide 1: Title
                let s1 = makeSlide(0);
                s1.addText("OOPD PROJECT SHOWCASE", { x: 3, y: 1.8, w: 4, h: 0.3, fontSize: 10, fontFace: FONT, color: BLUE, bold: true, align: 'center', fill: { color: 'FFFFFF', transparency: 90 }, rectRadius: 0.5 });
                s1.addText([{ text: 'Format', options: { color: W } }, { text: 'Flow', options: { color: BLUE } }], { x: 2, y: 2.3, w: 6, h: 1, fontSize: 60, fontFace: FONT, bold: true, align: 'center' });
                s1.addText("AI-Powered Document Formatting Engine Built with Java", { x: 1, y: 3.5, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: W75, align: 'center' });

                // Slide 2: Team
                let s2 = makeSlide(1);
                addLabel(s2, "Presented By", { x: 5, w: 4, align: 'left', y: 1.0 });
                addHeading(s2, [{ text: "Our " }, { text: "Team", color: TEAL }], { x: 5, w: 4, align: 'left', y: 1.4 });
                
                let cx = 5.0, cy = 2.4;
                s2.addText("Mohd Ayan Khan", { x: cx, y: cy, w: 2, h: 0.3, fontSize: 18, fontFace: FONT, color: W, bold: true });
                s2.addText("RA2511003030020", { x: cx, y: cy+0.3, w: 2, h: 0.3, fontSize: 12, fontFace: FONT, color: W60 });
                
                s2.addText("Tapish Ganesh Ingle", { x: cx+2.5, y: cy, w: 2.5, h: 0.3, fontSize: 18, fontFace: FONT, color: W, bold: true });
                s2.addText("RA2511003030044", { x: cx+2.5, y: cy+0.3, w: 2.5, h: 0.3, fontSize: 12, fontFace: FONT, color: W60 });
                
                s2.addText("Shreyansh Singh", { x: cx, y: cy+1.2, w: 2, h: 0.3, fontSize: 18, fontFace: FONT, color: W, bold: true });
                s2.addText("RA2511003030008", { x: cx, y: cy+1.5, w: 2, h: 0.3, fontSize: 12, fontFace: FONT, color: W60 });
                
                s2.addText("Yashasvi Sharma", { x: cx+2.5, y: cy+1.2, w: 2, h: 0.3, fontSize: 18, fontFace: FONT, color: W, bold: true });
                s2.addText("RA2511003030003", { x: cx+2.5, y: cy+1.5, w: 2, h: 0.3, fontSize: 12, fontFace: FONT, color: W60 });

                s2.addText("Under the guidance of Dr. Umma Meena", { x: cx, y: cy+2.5, w: 4.5, h: 0.4, fontSize: 14, fontFace: FONT, color: W75, align: 'center' });

                // Slide 3: Problem
                let s3 = makeSlide(2);
                addLabel(s3, "The Challenge");
                addHeading(s3, [{ text: "Why do we " }, { text: "need", color: TEAL }, { text: " this?" }]);
                
                addCard(s3, 1.0, 2.0, 2.5, 2.5, { topColor: PINK });
                s3.addText("⏳", { x: 1.0, y: 2.3, w: 2.5, h: 0.5, fontSize: 24, align: 'center' });
                s3.addText("Time Wasted", { x: 1.0, y: 2.9, w: 2.5, h: 0.4, fontSize: 16, fontFace: FONT, color: W, bold: true, align: 'center' });
                s3.addText("Students spend hours manually formatting documents.", { x: 1.1, y: 3.3, w: 2.3, h: 1.0, fontSize: 12, fontFace: FONT, color: W75, align: 'center' });

                addCard(s3, 3.75, 2.0, 2.5, 2.5, { topColor: ORANGE });
                s3.addText("🔀", { x: 3.75, y: 2.3, w: 2.5, h: 0.5, fontSize: 24, align: 'center' });
                s3.addText("Inconsistency", { x: 3.75, y: 2.9, w: 2.5, h: 0.4, fontSize: 16, fontFace: FONT, color: W, bold: true, align: 'center' });
                s3.addText("Mismatched fonts and spacing make documents look unprofessional.", { x: 3.85, y: 3.3, w: 2.3, h: 1.0, fontSize: 12, fontFace: FONT, color: W75, align: 'center' });

                addCard(s3, 6.5, 2.0, 2.5, 2.5, { topColor: PURPLE });
                s3.addText("🚫", { x: 6.5, y: 2.3, w: 2.5, h: 0.5, fontSize: 24, align: 'center' });
                s3.addText("No Smart Tool", { x: 6.5, y: 2.9, w: 2.5, h: 0.4, fontSize: 16, fontFace: FONT, color: W, bold: true, align: 'center' });
                s3.addText("No web-based tool can auto-detect and apply professional formatting.", { x: 6.6, y: 3.3, w: 2.3, h: 1.0, fontSize: 12, fontFace: FONT, color: W75, align: 'center' });

                // Slide 4: Solution
                let s4 = makeSlide(3);
                addLabel(s4, "Our Solution");
                addHeading(s4, [{ text: "Introducing " }, { text: "FormatFlow", color: GOLD }]);
                addBody(s4, "A web application powered by Google Gemini AI and a Java backend that takes raw, unstructured text and converts it into professionally formatted documents — with one click.", { y: 1.6, h: 1.2, w: 8, x: 1 });
                
                s4.addText("🔍 AI Structure Detection    ⚡ Real-Time Preview    🎨 5 Templates", { x: 1, y: 3.0, w: 8, h: 0.4, fontSize: 14, fontFace: FONT, color: W75, bold: true, align: 'center' });
                s4.addText("🤖 Gemini 2.5 Flash    📄 Word & PDF Export    ☕ Java Analytics Engine", { x: 1, y: 3.5, w: 8, h: 0.4, fontSize: 14, fontFace: FONT, color: W75, bold: true, align: 'center' });

                // Slide 5: Pipeline
                let s5 = makeSlide(4);
                addLabel(s5, "How It Works");
                addHeading(s5, [{ text: "The " }, { text: "Processing Pipeline", color: BLUE }]);
                
                s5.addText("1. Raw Text", { x: 1, y: 2.5, w: 1.5, h: 0.4, fontSize: 14, fontFace: FONT, color: W, bold: true, align: 'center' });
                s5.addShape(pptx.ShapeType.rightArrow, { x: 2.5, y: 2.6, w: 0.4, h: 0.2, fill: { color: BLUE } });
                
                s5.addText("2. AI Engine", { x: 2.9, y: 2.5, w: 1.5, h: 0.4, fontSize: 14, fontFace: FONT, color: W, bold: true, align: 'center' });
                s5.addShape(pptx.ShapeType.rightArrow, { x: 4.4, y: 2.6, w: 0.4, h: 0.2, fill: { color: BLUE } });
                
                s5.addText("3. Rule Engine", { x: 4.8, y: 2.5, w: 1.5, h: 0.4, fontSize: 14, fontFace: FONT, color: W, bold: true, align: 'center' });
                s5.addShape(pptx.ShapeType.rightArrow, { x: 6.3, y: 2.6, w: 0.4, h: 0.2, fill: { color: BLUE } });

                s5.addText("4. Analytics", { x: 6.7, y: 2.5, w: 1.5, h: 0.4, fontSize: 14, fontFace: FONT, color: W, bold: true, align: 'center' });
                
                // Add remaining slides structurally
                for(let i=5; i<13; i++) {
                    makeSlide(i);
                }

                // ═══════════════════════════════════════════
                //  PHASE 3: SAVE PPTX
                // ═══════════════════════════════════════════
                pctLabel.innerText = 'Compressing and downloading...';
                await pptx.writeFile({ fileName: 'FormatFlow_Presentation.pptx' });

                // Hide overlay
                overlay.style.display = 'none';

            } catch (err) {
                console.error(err);
                alert('Export failed. Check console for details.');
                overlay.style.display = 'none';
            }
        });
    }
});
