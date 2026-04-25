const puppeteer = require('puppeteer-core');
const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TOTAL_SLIDES = 20;
const WAIT_MS = 2000; // 2 seconds per slide for animations to complete
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const OUTPUT_FILE = path.join(__dirname, 'DTM_Presentation.pptx');

async function main() {
    // Create screenshots directory
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    console.log('Launching Chrome...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: [
            '--window-size=1920,1080',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        defaultViewport: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 2 // High-res screenshots
        }
    });

    const page = await browser.newPage();

    // Load the presentation
    console.log('Loading presentation...');
    await page.goto('http://127.0.0.1:8099/index.html', {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    // Wait for initial animations
    await new Promise(r => setTimeout(r, 3000));

    // Screenshot slide 1
    const slideFile1 = path.join(SCREENSHOT_DIR, 'slide_01.png');
    await page.screenshot({ path: slideFile1, type: 'png' });
    console.log(`✓ Captured slide 1/${TOTAL_SLIDES}`);

    // Navigate through remaining slides
    for (let i = 2; i <= TOTAL_SLIDES; i++) {
        // Click the next button
        await page.click('#nav-next');

        // Wait for slide transition + animations
        await new Promise(r => setTimeout(r, WAIT_MS));

        // Capture screenshot
        const slideFile = path.join(SCREENSHOT_DIR, `slide_${String(i).padStart(2, '0')}.png`);
        await page.screenshot({ path: slideFile, type: 'png' });
        console.log(`✓ Captured slide ${i}/${TOTAL_SLIDES}`);
    }

    await browser.close();
    console.log('\n📸 All slides captured! Building PPTX...\n');

    // ======== Create PPTX ========
    const pptx = new PptxGenJS();

    // Set 16:9 widescreen layout (standard presentation size)
    pptx.defineLayout({ name: 'WIDESCREEN', width: 13.33, height: 7.5 });
    pptx.layout = 'WIDESCREEN';
    pptx.title = 'Disruptive Methods to Make Society a Pollution-Free Environment';
    pptx.subject = 'Design Thinking Methodology — DTM Presentation';
    pptx.author = 'SRM Institute of Science and Technology';

    for (let i = 1; i <= TOTAL_SLIDES; i++) {
        const slideFile = path.join(SCREENSHOT_DIR, `slide_${String(i).padStart(2, '0')}.png`);

        if (!fs.existsSync(slideFile)) {
            console.error(`⚠ Missing screenshot: slide_${String(i).padStart(2, '0')}.png`);
            continue;
        }

        const slide = pptx.addSlide();
        // Set black background
        slide.background = { color: '0A0A1A' };

        // Read image as base64 data
        const imgData = fs.readFileSync(slideFile, { encoding: 'base64' });

        // Add full-slide image
        slide.addImage({
            data: `image/png;base64,${imgData}`,
            x: 0,
            y: 0,
            w: 13.33,
            h: 7.5
        });

        console.log(`✓ Added slide ${i}/${TOTAL_SLIDES} to PPTX`);
    }

    // Save the PPTX
    await pptx.writeFile({ fileName: OUTPUT_FILE });
    console.log(`\n🎉 PPTX saved successfully: ${OUTPUT_FILE}`);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
