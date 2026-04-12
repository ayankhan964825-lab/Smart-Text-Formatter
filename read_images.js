const Tesseract = require('tesseract.js');

async function extractText(imagePath) {
    try {
        console.log(`\n=== EXTRACTING ${imagePath} ===`);
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'eng',
        );
        console.log(text);
    } catch(err) {
        console.log(err);
    }
}

async function run() {
    await extractText('./image/1.jpeg');
    await extractText('./image/2.jpeg');
    await extractText('./image/3.jpeg');
}

run();
