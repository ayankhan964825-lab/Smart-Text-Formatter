// exportPptx.js
// Custom High-Res Screenshot PPTX Exporter with Invisible Hyperlink Engine

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-pptx-btn');
    const overlay = document.getElementById('export-overlay');
    const pctLabel = document.getElementById('export-pct');

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            if (typeof PptxGenJS === 'undefined' || typeof html2canvas === 'undefined') {
                alert('Export libraries are not loaded. Please wait a few seconds or check your internet connection.');
                return;
            }

            try {
                overlay.style.display = 'flex';
                pctLabel.innerText = 'Initializing snapshot engine...';

                const originalActiveSlide = document.querySelector('.slide.active');
                
                let pptx = new PptxGenJS();
                pptx.layout = 'LAYOUT_16x9'; 

                const slides = document.querySelectorAll('.slide');
                const totalSlides = slides.length;

                // 🌟 FIX: Absolute Animation Killer
                // This violently stops all CSS animations, transforms, and SVG transitions instantly.
                const cssThrottler = document.createElement('style');
                cssThrottler.innerHTML = `
                    * { 
                        transition: none !important; 
                        animation: none !important; 
                        animation-play-state: paused !important;
                    }
                    .animate-in { 
                        opacity: 1 !important; 
                        transform: none !important; 
                    }
                    .slide { 
                        opacity: 1 !important; 
                        visibility: visible !important; 
                    }
                `;
                document.head.appendChild(cssThrottler);

                for (let i = 0; i < totalSlides; i++) {
                    const slide = slides[i];
                    
                    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
                    slide.classList.add('active');
                    
                    pctLabel.innerText = `Preparing Slide ${i + 1}/${totalSlides} for snapshot...`;

                    // 🌟 FIX: Massive wait time + requestAnimationFrame 
                    // This forces the browser to actually paint the stopped CSS layout to screen memory before snap
                    await new Promise(resolve => setTimeout(resolve, 1200)); 
                    await new Promise(resolve => requestAnimationFrame(resolve));

                    pctLabel.innerText = `Capturing High-Res Snapshot ${i + 1}...`;
                    const canvas = await html2canvas(slide, {
                        scale: 2, 
                        backgroundColor: '#0D0E15',
                        logging: false,
                        allowTaint: true,
                        useCORS: true,
                        onclone: (clonedDoc) => {
                            // FIX: html2canvas does not support background-clip: text.
                            // It renders the background gradient as a solid block over the text.
                            // We strip the background and fallback to a solid color for the snapshot.
                            const gradients = clonedDoc.querySelectorAll('[class*="gradient-text"]');
                            gradients.forEach(el => {
                                el.style.background = 'none';
                                el.style.webkitTextFillColor = 'initial';
                                
                                if (el.classList.contains('gradient-text-hero')) el.style.color = '#5AC8FA'; // Teal
                                else if (el.classList.contains('gradient-text-electric')) el.style.color = '#2997FF'; // Blue
                                else if (el.classList.contains('gradient-text-warm')) el.style.color = '#FF9F0A'; // Orange
                                else if (el.classList.contains('gradient-text-gold')) el.style.color = '#FFD60A'; // Gold
                                else if (el.classList.contains('gradient-text-green') || el.classList.contains('gradient-text-sunrise')) el.style.color = '#30D158'; // Green
                                else if (el.classList.contains('gradient-text-rose')) el.style.color = '#FF6B8A'; // Pink
                                else el.style.color = '#BF5AF2'; // Default Purple
                            });
                        }
                    });

                    const base64Image = canvas.toDataURL("image/jpeg", 0.9);

                    let pptSlide = pptx.addSlide();
                    pptSlide.background = { color: "0D0E15" };

                    // 🌟 SLIDE TRANSITION FIX
                    // Embed the image taking exactly 10 inches by 5.625 inches natively.
                    // The 'fade' animation creates the simulated slide-to-slide transition!
                    pptSlide.addImage({
                        data: base64Image,
                        x: 0,
                        y: 0,
                        w: 10,  
                        h: 5.625,
                        anim: { type: 'fade', speed: 'fast' }
                    });

                    // 🌟 HYPERLINK MAPPING ENGINE
                    // Finds all <a> tags (like GitHub, Live Demo buttons) on this specific slide
                    const slideLinks = slide.querySelectorAll('a[href]');
                    if (slideLinks.length > 0) {
                        const slideRect = slide.getBoundingClientRect();
                        
                        slideLinks.forEach(link => {
                            const linkRect = link.getBoundingClientRect();
                            
                            // Math: Translate HTML absolute box pixels to percentages relative to slide
                            const relX = linkRect.left - slideRect.left;
                            const relY = linkRect.top - slideRect.top;
                            
                            // Math: Convert percentages to PptxGenJS Inches (10x5.625 master canvas)
                            const pptX = (relX / slideRect.width) * 10;
                            const pptY = (relY / slideRect.height) * 5.625;
                            const pptW = (linkRect.width / slideRect.width) * 10;
                            const pptH = (linkRect.height / slideRect.height) * 5.625;
                            
                            // Inject a 100% Invisible Rectangle precisely over the button in the picture
                            pptSlide.addShape(pptx.ShapeType.rect, {
                                x: pptX, y: pptY, w: pptW, h: pptH,
                                fill: { transparency: 100 },
                                line: { transparency: 100 },
                                hyperlink: { url: link.href, tooltip: "Open Web Link" }
                            });
                        });
                    }
                }

                // Restore Presentation Vitality
                document.head.removeChild(cssThrottler);
                document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
                if (originalActiveSlide) originalActiveSlide.classList.add('active');

                pctLabel.innerText = 'Compiling native .pptx...';
                await pptx.writeFile({ fileName: "OOPD_Showcase_HighRes.pptx" });
                
                pctLabel.innerText = 'Ready!';
                await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
                console.error("PPTX Generation Error:", err);
                alert("Failed to export PPTX snapshots. Check console log.");
            } finally {
                overlay.style.display = 'none';
                pctLabel.innerText = '';
            }
        });
    }
});
