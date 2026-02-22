/**
 * Smart Text Formatting Algorithm
 * Core Application Logic (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- UI Elements ---
    const rawInput = document.getElementById('raw-input');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    const statusText = document.getElementById('status-text');

    // --- State Management ---
    let currentTheme = localStorage.getItem('theme') || 'light';

    // Initialize Theme
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
        localStorage.setItem('theme', theme);
    };

    // Set initial theme
    applyTheme(currentTheme);

    // --- Event Listeners ---
    const formatBtn = document.getElementById('format-btn');

    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
    });

    // Handle Format Button Click
    formatBtn.addEventListener('click', () => {
        statusText.textContent = "Processing...";
        processTextUpdate();
    });



    // Add Live Updating for Ribbon Controls
    const ribbonControls = document.querySelectorAll('.formatting-ribbon select, .formatting-ribbon input');
    ribbonControls.forEach(control => {
        // Trigger update when a dropdown option changes or number changes
        control.addEventListener('change', () => {
            if (rawInput.value.trim() !== '') {
                statusText.textContent = "Updating Format...";
                processTextUpdate();
            }
        });

        // Also trigger on manual typing for number inputs
        if (control.tagName === 'INPUT') {
            control.addEventListener('input', () => {
                if (rawInput.value.trim() !== '') {
                    statusText.textContent = "Updating Format...";
                    processTextUpdate();
                }
            });
        }
    });

    // Helper function to extract rule values from ribbon
    function getRibbonRules() {
        const rules = {
            h1: {
                'font-family': document.getElementById('h1-font').value,
                'font-size': document.getElementById('h1-size').value + 'pt'
            },
            h2: {
                'font-family': document.getElementById('h2-font').value,
                'font-size': document.getElementById('h2-size').value + 'pt'
            },
            'sub-subheading': {
                'font-family': document.getElementById('sub-sub-font').value,
                'font-size': document.getElementById('sub-sub-size').value + 'pt'
            },
            p: {
                'font-family': document.getElementById('p-font').value,
                'font-size': document.getElementById('p-size').value + 'pt'
            },
            global: {
                'text-align': document.getElementById('global-alignment').value
            }
        };

        // Filter out 'inherit' defaults so we fallback to the parent CSS
        for (const type in rules) {
            if (rules[type]['font-family'] === 'inherit') {
                delete rules[type]['font-family'];
            }
        }
        return rules;
    }

    // --- Core Processing Placeholder ---
    function processTextUpdate() {
        const textToProcess = rawInput.value;
        const previewContainer = document.getElementById('formatted-preview');

        if (textToProcess.trim() === '') {
            previewContainer.innerHTML = '<div class="placeholder-text">Live preview will appear here...</div>';
            statusText.textContent = "Waiting for input";
            return;
        }

        try {
            // 1. TextProcessor
            const processor = new window.TextProcessor(textToProcess);
            const textBlocks = processor.tokenize();

            // 2. StructureDetector
            const detector = new window.StructureDetector();
            const elements = detector.classifyBlocks(textBlocks);

            // 3. RuleEngine (Pass ribbon rules here)
            const customRibbonRules = typeof getRibbonRules === 'function' ? getRibbonRules() : null;
            const rules = new window.RuleEngine(customRibbonRules);
            const styledElements = rules.applyRules(elements);

            // 4. OutputGenerator
            const generator = new window.OutputGenerator();
            const finalHtml = generator.generateHTML(styledElements);

            // Render to DOM
            previewContainer.innerHTML = finalHtml || '<div class="placeholder-text">Live preview will appear here...</div>';
            statusText.textContent = "Formatted Successfully";

        } catch (error) {
            console.error("Formatting Error:", error);
            statusText.textContent = "Error Formatting";
        }
    }

    // --- Export Functionality ---
    const exportPdfBtn = document.getElementById('export-pdf');
    const exportWordBtn = document.getElementById('export-word');

    // 2. Export PDF (using html2pdf.js)
    exportPdfBtn.addEventListener('click', () => {
        const previewContainer = document.getElementById('formatted-preview');
        if (previewContainer.querySelector('.placeholder-text')) {
            alert("No content to export. Please format some text first.");
            return;
        }

        statusText.textContent = "Generating PDF...";

        // Clone the container to avoid messing up the live view during PDF generation
        const copyForPdf = previewContainer.cloneNode(true);
        // Ensure it has a white background for the PDF
        copyForPdf.style.backgroundColor = '#ffffff';
        copyForPdf.style.padding = '40px'; // Give it some print margins

        const opt = {
            margin: 10,
            filename: 'formatted_document.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // html2pdf is brought in via CDN in index.html
        html2pdf().set(opt).from(copyForPdf).save().then(() => {
            statusText.textContent = "PDF Exported";
        }).catch(err => {
            console.error("PDF Export Error:", err);
            statusText.textContent = "Export Failed";
        });
    });

    // 3. Export Word (.doc)
    exportWordBtn.addEventListener('click', () => {
        const previewContainer = document.getElementById('formatted-preview');
        if (previewContainer.querySelector('.placeholder-text')) {
            alert("No content to export. Please format some text first.");
            return;
        }

        const htmlContent = previewContainer.innerHTML;

        // A minimal HTML shell that MS Word understands
        const wordHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Exported Document</title>
                <!-- Include any specific styles if needed here -->
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', wordHtml], {
            type: 'application/msword'
        });

        // Setup download link
        const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(wordHtml);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted_document.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

});
