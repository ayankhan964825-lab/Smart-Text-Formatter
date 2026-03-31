// exportPptx.js
// Custom PPTX Builder for the OOPD Presentation

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-pptx-btn');
    const overlay = document.getElementById('export-overlay');
    const pctLabel = document.getElementById('export-pct');

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            if (typeof pptxgen === 'undefined') {
                alert('PptxGenJS library is not loaded. Please check your internet connection.');
                return;
            }

            try {
                // Show overlay
                overlay.style.display = 'flex';
                pctLabel.innerText = 'Initializing...';

                // Allow UI to update
                await new Promise(r => setTimeout(r, 100));

                let pptx = new pptxgen();
                pptx.layout = 'LAYOUT_16x9';

                // Global formatting constants
                const BG_DARK = "0D0E15";
                const BG_MID = "151723";
                const TEXT_PRIMARY = "FFFFFF";
                const TEXT_SEC = "A0A0B0";
                
                const COLOR_PINK = "FF2D55";
                const COLOR_BLUE = "2997FF";
                const COLOR_GREEN = "30D158";
                const COLOR_GOLD = "FFD60A";
                const COLOR_PURPLE = "BF5AF2";

                // ==================== SLIDE 1: TITLE ====================
                pctLabel.innerText = 'Building Slide 1 (Title)...';
                let slide1 = pptx.addSlide();
                slide1.background = { color: BG_DARK };
                
                slide1.addText("OOPD PROJECT SHOWCASE", {
                    x: 1, y: 1.5, w: 8, h: 0.5,
                    fontSize: 12, color: TEXT_SEC, align: "center", bold: true,
                    anim: { type: "fade", delay: 0 }
                });
                slide1.addText("Smart Text Formatter", {
                    x: 1, y: 2.2, w: 8, h: 1.2,
                    fontSize: 54, color: TEXT_PRIMARY, align: "center", bold: true,
                    anim: { type: "fly", direction: "bottom", delay: 0.5 }
                });
                slide1.addText("Intelligent Document Formatting, Reimagined.", {
                    x: 1, y: 3.5, w: 8, h: 0.5,
                    fontSize: 18, color: TEXT_SEC, align: "center",
                    anim: { type: "fade", delay: 1 }
                });


                // ==================== SLIDE 2: AUTHORS ====================
                pctLabel.innerText = 'Building Slide 2 (Authors)...';
                let slide2 = pptx.addSlide();
                slide2.background = { color: BG_MID };

                slide2.addText("Presented By", { x: 5, y: 1.5, w: 4, fontSize: 14, color: TEXT_SEC, anim: { type: "fade" }});
                slide2.addText("Our Group", { x: 5, y: 1.8, w: 4, fontSize: 36, color: TEXT_PRIMARY, bold: true, anim: { type: "fly", direction:"bottom", delay: 0.2 }});

                slide2.addText("Mohd Ayan Khan", { x: 5, y: 2.8, w: 2, fontSize: 16, color: TEXT_PRIMARY, bold: true, anim: { type: "fade", delay: 0.5 }});
                slide2.addText("RA2511003030020", { x: 5, y: 3.1, w: 2, fontSize: 12, color: COLOR_BLUE, anim: { type: "fade", delay: 0.5 }});

                slide2.addText("Tapish Ganesh Ingle", { x: 7.5, y: 2.8, w: 2, fontSize: 16, color: TEXT_PRIMARY, bold: true, anim: { type: "fade", delay: 0.5 }});
                slide2.addText("RA2511003030044", { x: 7.5, y: 3.1, w: 2, fontSize: 12, color: COLOR_BLUE, anim: { type: "fade", delay: 0.5 }});

                slide2.addText("Shreyansh Singh", { x: 5, y: 3.6, w: 2, fontSize: 16, color: TEXT_PRIMARY, bold: true, anim: { type: "fade", delay: 0.8 }});
                slide2.addText("RA2511003030008", { x: 5, y: 3.9, w: 2, fontSize: 12, color: COLOR_BLUE, anim: { type: "fade", delay: 0.8 }});

                slide2.addText("Yashasvi Sharma", { x: 7.5, y: 3.6, w: 2, fontSize: 16, color: TEXT_PRIMARY, bold: true, anim: { type: "fade", delay: 0.8 }});
                slide2.addText("RA2511003030003", { x: 7.5, y: 3.9, w: 2, fontSize: 12, color: COLOR_BLUE, anim: { type: "fade", delay: 0.8 }});
                
                slide2.addText("Under the guidance of Dr. Umma Meena", { x: 5, y: 4.6, w: 4, fontSize: 14, color: COLOR_GOLD, anim: { type: "fade", delay: 1 }});

                // Mock orbit network visually via shapes
                slide2.addShape(pptx.ShapeType.ellipse, { x: 1.5, y: 2.5, w: 1, h: 1, fill: { color: COLOR_BLUE }, line: { color: "FFFFFF" }, anim: {type: 'zoom'} });
                slide2.addText("TEAM", { x: 1.5, y: 2.5, w: 1, h: 1, align: "center", color: "FFFFFF", fontSize: 12, bold: true });


                // ==================== SLIDE 3: PROBLEM ====================
                pctLabel.innerText = 'Building Slide 3 (Challenge)...';
                let slide3 = pptx.addSlide();
                slide3.background = { color: BG_DARK };
                slide3.addText("The Challenge", { x: 1, y: 0.5, w: 8, fontSize: 14, color: TEXT_SEC, anim: { type: "fade"} });
                slide3.addText("Manual formatting is broken.", { x: 1, y: 0.8, w: 8, fontSize: 36, color: TEXT_PRIMARY, bold: true, anim: { type:"fly", direction:"bottom", delay:0.2} });

                // 3 Boxes
                slide3.addShape(pptx.ShapeType.rect, { x: 1, y: 2, w: 2.5, h: 2, fill: { color: "1A1D24" }, line: { color: COLOR_PINK }, anim: {type:"fly", direction:"bottom", delay:0.4} });
                slide3.addText("Time-Consuming\n\nHours spent manually adjusting headings and spacing.", { x: 1.1, y: 2.1, w: 2.3, h: 1.8, fontSize: 14, color: "FFFFFF", valign: "top" });

                slide3.addShape(pptx.ShapeType.rect, { x: 3.8, y: 2, w: 2.5, h: 2, fill: { color: "1A1D24" }, line: { color: COLOR_GOLD }, anim: {type:"fly", direction:"bottom", delay:0.6} });
                slide3.addText("Inconsistent\n\nDifferent heading levels, sizes create unprofessional results.", { x: 3.9, y: 2.1, w: 2.3, h: 1.8, fontSize: 14, color: "FFFFFF", valign: "top" });

                slide3.addShape(pptx.ShapeType.rect, { x: 6.6, y: 2, w: 2.5, h: 2, fill: { color: "1A1D24" }, line: { color: COLOR_PINK }, anim: {type:"fly", direction:"bottom", delay:0.8} });
                slide3.addText("No Browser Solution\n\nNo lightweight tool auto-detects and formats natively.", { x: 6.7, y: 2.1, w: 2.3, h: 1.8, fontSize: 14, color: "FFFFFF", valign: "top" });


                // ==================== SLIDE 4: SOLUTION ====================
                let slide4 = pptx.addSlide();
                slide4.background = { color: BG_MID };
                slide4.addText("The Solution", { x: 1, y: 1.5, w: 8, fontSize: 14, color: TEXT_SEC, align: "center", anim: { type:"fade" } });
                slide4.addText("Smart Text Formatter", { x: 1, y: 1.8, w: 8, fontSize: 44, color: COLOR_GOLD, bold: true, align: "center", anim: { type:"fly", direction:"bottom", delay: 0.2 } });
                slide4.addText("A web-based application that intelligently reads, understands, and formats unstructured text documents — powered by AI & OOP.", 
                    { x: 1.5, y: 2.8, w: 7, fontSize: 18, color: TEXT_PRIMARY, align: "center", anim: { type:"fade", delay: 0.5 } });


                // ==================== SLIDE 5: WHY OOP ====================
                let slide5 = pptx.addSlide();
                slide5.background = { color: BG_DARK };
                slide5.addText("Design Philosophy", { x: 1, y: 0.5, w: 8, fontSize: 14, color: TEXT_SEC });
                slide5.addText("Why Object-Oriented Design?", { x: 1, y: 0.8, w: 8, fontSize: 36, color: TEXT_PRIMARY, bold: true });

                slide5.addText("Modularity: Self-contained classes", { x: 1, y: 2.0, w: 4, fontSize: 16, color: "FFFFFF", bullet: true });
                slide5.addText("Reusability: Abstract configurations", { x: 5, y: 2.0, w: 4, fontSize: 16, color: "FFFFFF", bullet: true });
                slide5.addText("Maintainability: Isolated fixes without breaking core", { x: 1, y: 3.5, w: 4, fontSize: 16, color: "FFFFFF", bullet: true });
                slide5.addText("Testability: Unit-testing capable", { x: 5, y: 3.5, w: 4, fontSize: 16, color: "FFFFFF", bullet: true });


                // ==================== SLIDE 6: ARCHITECTURE ====================
                pctLabel.innerText = 'Building Slide 6 (Architecture)...';
                let slide6 = pptx.addSlide();
                slide6.background = { color: BG_MID };
                slide6.addText("System Architecture", { x: 1, y: 0.5, w: 8, fontSize: 14, color: TEXT_SEC, align: "center" });
                slide6.addText("The 4-Stage Pipeline", { x: 1, y: 0.8, w: 8, fontSize: 36, color: TEXT_PRIMARY, bold: true, align: "center" });

                slide6.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 2.5, w: 2, h: 1, fill: { color: "1A1D24" } });
                slide6.addText("1. TextProcessor", { x: 0.5, y: 2.5, w: 2, h: 1, align: "center", color: "FFFFFF" });
                
                slide6.addShape(pptx.ShapeType.rightArrow, { x: 2.6, y: 2.8, w: 0.4, h: 0.4, fill: { color: COLOR_BLUE } });

                slide6.addShape(pptx.ShapeType.roundRect, { x: 3.1, y: 2.5, w: 2, h: 1, fill: { color: "1A1D24" } });
                slide6.addText("2. StructureDetector", { x: 3.1, y: 2.5, w: 2, h: 1, align: "center", color: "FFFFFF" });

                slide6.addShape(pptx.ShapeType.rightArrow, { x: 5.2, y: 2.8, w: 0.4, h: 0.4, fill: { color: COLOR_BLUE } });

                slide6.addShape(pptx.ShapeType.roundRect, { x: 5.7, y: 2.5, w: 1.8, h: 1, fill: { color: "1A1D24" } });
                slide6.addText("3. RuleEngine", { x: 5.7, y: 2.5, w: 1.8, h: 1, align: "center", color: "FFFFFF" });

                slide6.addShape(pptx.ShapeType.rightArrow, { x: 7.6, y: 2.8, w: 0.4, h: 0.4, fill: { color: COLOR_BLUE } });

                slide6.addShape(pptx.ShapeType.roundRect, { x: 8.1, y: 2.5, w: 1.6, h: 1, fill: { color: "1A1D24" } });
                slide6.addText("4. Output", { x: 8.1, y: 2.5, w: 1.6, h: 1, align: "center", color: "FFFFFF" });


                // ==================== SLIDE 7, 8, 9: CLASSES ====================
                pctLabel.innerText = 'Building Slides 7-9 (Code Classes)...';
                const classSlides = [
                    { t: "Input Pipeline", c1: "TextProcessor", c1col: COLOR_PINK, c2: "StructureDetector", c2col: COLOR_GREEN },
                    { t: "Processing Pipeline", c1: "RuleEngine", c1col: COLOR_PURPLE, c2: "OutputGenerator", c2col: COLOR_GOLD },
                    { t: "AI & Export Extensions", c1: "AIFormatter", c1col: COLOR_BLUE, c2: "DocxExporter", c2col: COLOR_PINK }
                ];

                classSlides.forEach(item => {
                    let sl = pptx.addSlide();
                    sl.background = { color: BG_DARK };
                    sl.addText("OOPD Deep Dive", { x: 1, y: 0.5, w: 8, fontSize: 14, color: TEXT_SEC, align: "center" });
                    sl.addText(item.t + " Classes", { x: 1, y: 0.8, w: 8, fontSize: 36, color: TEXT_PRIMARY, bold: true, align: "center" });

                    // Simulating the MacOS Code Window layout using generic boxes
                    sl.addShape(pptx.ShapeType.rect, { x: 1, y: 2, w: 3.5, h: 2.5, fill: { color: "1A1D24" }, line: { color: item.c1col } });
                    sl.addText(item.c1 + ".js", { x: 1, y: 2.1, w: 3.5, h: 0.4, fontSize: 14, color: item.c1col, align: "center" });
                    sl.addText("class " + item.c1 + " {\\n   // simulated logic\\n}", { x: 1.2, y: 2.6, w: 3, h: 1, color: "FFFFFF", fontFace: "Courier New", fontSize: 12 });

                    sl.addShape(pptx.ShapeType.rect, { x: 5.5, y: 2, w: 3.5, h: 2.5, fill: { color: "1A1D24" }, line: { color: item.c2col } });
                    sl.addText(item.c2 + ".js", { x: 5.5, y: 2.1, w: 3.5, h: 0.4, fontSize: 14, color: item.c2col, align: "center" });
                    sl.addText("class " + item.c2 + " {\\n   // simulated logic\\n}", { x: 5.7, y: 2.6, w: 3, h: 1, color: "FFFFFF", fontFace: "Courier New", fontSize: 12 });
                });


                // ==================== SLIDE 10: OOP CONCEPTS ====================
                let slide10 = pptx.addSlide();
                slide10.background = { color: BG_MID };
                slide10.addText("Core Concepts", { x: 1, y: 0.5, w: 8, fontSize: 14, color: TEXT_SEC });
                slide10.addText("OOP Principles in Action", { x: 1, y: 0.8, w: 8, fontSize: 36, color: TEXT_PRIMARY, bold: true });

                slide10.addText("Encapsulation: Hiding internal states", { x: 1, y: 2, w: 4, color: COLOR_PINK, bold: true, bullet: true});
                slide10.addText("Abstraction: Simplified logical routing", { x: 5, y: 2, w: 4, color: COLOR_BLUE, bold: true, bullet: true});
                slide10.addText("Inheritance Ready: Extension based scaling", { x: 1, y: 3, w: 4, color: COLOR_GREEN, bold: true, bullet: true});
                slide10.addText("Polymorphism: Flexible API formatting", { x: 5, y: 3, w: 4, color: COLOR_GOLD, bold: true, bullet: true});


                // ==================== SLIDE 11: TECH STACK ====================
                let slide11 = pptx.addSlide();
                slide11.background = { color: BG_DARK };
                slide11.addText("Tech Stack & Deployment", { x: 1, y: 1, w: 8, fontSize: 36, color: TEXT_PRIMARY, bold: true, align:"center" });

                const tech = ["HTML5/CSS3", "Vanilla JS", "Gemini API", "Vercel", "GitHub", "Docxtemplater"];
                let yPos = 2.5;
                for (let i = 0; i < 3; i++) {
                    slide11.addText(tech[i], { x: 1.5 + (i * 2.5), y: 2.5, w: 2, fontSize: 18, align: "center", color: COLOR_BLUE, bold: true });
                    slide11.addText(tech[i+3], { x: 1.5 + (i * 2.5), y: 3.5, w: 2, fontSize: 18, align: "center", color: COLOR_PINK, bold: true });
                }


                // ==================== SLIDE 12: DEMO ====================
                let slide12 = pptx.addSlide();
                slide12.background = { color: BG_MID };
                slide12.addText("In Action", { x: 1, y: 1.5, w: 8, fontSize: 14, color: TEXT_SEC, align: "center" });
                slide12.addText("Live Demo", { x: 1, y: 1.8, w: 8, fontSize: 44, color: COLOR_GOLD, bold: true, align: "center" });


                // ==================== SLIDE 13: CONCLUSION ====================
                pctLabel.innerText = 'Finishing export...';
                let slide13 = pptx.addSlide();
                slide13.background = { color: "000000" };
                slide13.addText("Thank You.", { x: 1, y: 2, w: 8, fontSize: 60, color: "FF2D55", bold: true, align: "center" });
                slide13.addText("Smart Text Formatter — OOPD Project Showcase", { x: 1, y: 3, w: 8, fontSize: 18, color: TEXT_SEC, align: "center" });
                slide13.addText("Questions & Answers", { x: 1, y: 4, w: 8, fontSize: 14, color: "A0A0B0", align: "center" });

                // Final Output
                await pptx.writeFile({ fileName: "OOPD_Showcase.pptx" });
            } catch (err) {
                console.error("PPTX Generation Error:", err);
                alert("Failed to export PPTX. Check console log.");
            } finally {
                overlay.style.display = 'none';
            }
        });
    }
});
