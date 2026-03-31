// exportPptx.js
// Custom High-Res Screenshot PPTX Exporter (Option A)

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
                // Show overlay
                overlay.style.display = 'flex';
                pctLabel.innerText = 'Initializing snapshot engine...';

                // Save current slide index to restore later
                const originalActiveSlide = document.querySelector('.slide.active');
                
                let pptx = new PptxGenJS();
                pptx.layout = 'LAYOUT_16x9';

                // Grab all structural slides DOM nodes
                const slides = document.querySelectorAll('.slide');
                const totalSlides = slides.length;

                for (let i = 0; i < totalSlides; i++) {
                    pctLabel.innerText = `Taking high-res snapshot of Slide ${i + 1}/${totalSlides}...`;
                    
                    const slide = slides[i];
                    
                    // Force the slide to be active for accurate DOM rendering
                    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
                    slide.classList.add('active');
                    
                    // Temporarily force all internally animated CSS elements to be 100% visible
                    // otherwise html2canvas might capture them while they are invisible (opacity 0)
                    const animatedChildren = slide.querySelectorAll('.animate-in');
                    animatedChildren.forEach(el => {
                        el.style.opacity = '1';
                        el.style.transform = 'none';
                        el.style.animation = 'none';
                        el.style.transition = 'none';
                    });

                    // Wait a tiny bit for the DOM changes to visually snap into place
                    await new Promise(r => setTimeout(r, 150));

                    // Take Snapshot using html2canvas
                    const canvas = await html2canvas(slide, {
                        scale: 2, // 2x High resolution for crisp PowerPoint text viewing
                        backgroundColor: '#0D0E15', 
                        logging: false,
                        allowTaint: true,
                        useCORS: true
                    });

                    // Convert to base64 generic image format
                    const base64Image = canvas.toDataURL("image/jpeg", 0.9);

                    // Create PowerPoint slide
                    let pptSlide = pptx.addSlide();
                    pptSlide.background = { color: "0D0E15" };

                    // Append the High-Res Image covering EXACTLY 100% of the slide (Widescreen 16:9)
                    // We attach the 'fade' animation specifically to simulate a SLIDE TRANSITION effect naturally
                    pptSlide.addImage({
                        data: base64Image,
                        x: 0,
                        y: 0,
                        w: 10,     // PowerPoint sets LAYOUT_16x9 width dynamically as 10 inches natively
                        h: 5.625,  // Height mathematically equivalent to 16:9
                        anim: { type: 'fade', speed: 'fast' } // <--- THE FAKED SLIDE TRANSITION (Fades perfectly into view)
                    });

                    // Cleanup forced static styles to not break the DOM engine
                    animatedChildren.forEach(el => {
                        el.style.opacity = '';
                        el.style.transform = '';
                        el.style.animation = '';
                        el.style.transition = '';
                    });
                }

                pctLabel.innerText = 'Compiling native .pptx file...';

                // Securely restore the exactly originally viewed slide for the user
                document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
                if (originalActiveSlide) originalActiveSlide.classList.add('active');

                // Output File
                await pptx.writeFile({ fileName: "OOPD_Showcase_HighRes.pptx" });
                
                pctLabel.innerText = 'Download Complete!';
                await new Promise(r => setTimeout(r, 1000));

            } catch (err) {
                console.error("PPTX Generation Error:", err);
                alert("Failed to export PPTX snapshots. Check console log.");
            } finally {
                // Always assure overlay closes securely
                overlay.style.display = 'none';
                pctLabel.innerText = '';
            }
        });
    }
});
