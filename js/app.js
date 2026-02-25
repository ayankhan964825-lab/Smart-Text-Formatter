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

    // --- Rich Text Editing Toolbar & Customization Toggle ---
    window.isCustomizationActive = false;
    const customizeBtn = document.getElementById('toggle-customization-btn');
    const miniToolbar = document.getElementById('mini-rtf-toolbar');
    const previewContainerEl = document.getElementById('formatted-preview');

    customizeBtn.addEventListener('click', () => {
        window.isCustomizationActive = !window.isCustomizationActive;

        if (window.isCustomizationActive) {
            customizeBtn.innerHTML = '✅ Editing';
            customizeBtn.classList.add('primary');
            customizeBtn.classList.remove('secondary');
            miniToolbar.style.display = 'flex';
            previewContainerEl.setAttribute('contenteditable', 'true');
            previewContainerEl.focus();
        } else {
            customizeBtn.innerHTML = '✏️ Edit';
            customizeBtn.classList.add('secondary');
            customizeBtn.classList.remove('primary');
            miniToolbar.style.display = 'none';
            previewContainerEl.setAttribute('contenteditable', 'false');
        }
    });

    const rtfBtns = document.querySelectorAll('.rtf-btn');
    rtfBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.getAttribute('data-command');
            document.execCommand(command, false, null);
            document.getElementById('formatted-preview').focus();
        });
    });

    const rtfSelects = document.querySelectorAll('.rtf-select');
    rtfSelects.forEach(select => {
        select.addEventListener('change', () => {
            const command = select.getAttribute('data-command');
            if (command) {
                document.execCommand(command, false, select.value);
            } else if (select.classList.contains('rtf-align')) {
                // Alignment select options are the commands themselves (e.g. justifyLeft)
                document.execCommand(select.value, false, null);
            }
            document.getElementById('formatted-preview').focus();
        });
    });

    const rtfColors = document.querySelectorAll('.rtf-color');
    rtfColors.forEach(input => {
        input.addEventListener('input', () => {
            const command = input.getAttribute('data-command');
            document.execCommand(command, false, input.value);
            document.getElementById('formatted-preview').focus();
        });
    });

    const rtfNumbers = document.querySelectorAll('.rtf-number');
    rtfNumbers.forEach(input => {
        input.addEventListener('change', () => {
            const command = input.getAttribute('data-command');
            if (command === 'fontSizePt') {
                // Hack: Apply a dummy size '7' using execCommand, then swap it for the precise pt size.
                document.execCommand('fontSize', false, '7');
                const fonts = document.getElementById('formatted-preview').querySelectorAll('font[size="7"]');
                fonts.forEach(font => {
                    font.removeAttribute('size');
                    font.style.fontSize = input.value + 'pt';
                });
                document.getElementById('formatted-preview').focus();
            }
        });
    });

    // --- Overwrite/Append Modal Logic ---
    const appendModal = document.getElementById('append-modal');
    const modalOverwriteBtn = document.getElementById('modal-overwrite-btn');
    const modalAppendBtn = document.getElementById('modal-append-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    let pendingFormattedHtml = '';

    function insertHtmlAtCursor(html) {
        const previewContainer = document.getElementById('formatted-preview');
        previewContainer.focus();

        // Add visual spacing if we are appending
        const htmlToInsert = `<div style="margin-top:20px;">${html}</div>`;

        let sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                // Only insert at cursor if the highest-level anchor is inside our preview box
                if (previewContainer.contains(sel.anchorNode)) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();

                    const el = document.createElement("div");
                    el.innerHTML = htmlToInsert;
                    let frag = document.createDocumentFragment(), node, lastNode;
                    while ((node = el.firstChild)) {
                        lastNode = frag.appendChild(node);
                    }
                    range.insertNode(frag);

                    if (lastNode) {
                        range = range.cloneRange();
                        range.setStartAfter(lastNode);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    return;
                }
            }
        }

        // Fallback: Just append to the end of the container
        previewContainer.innerHTML += htmlToInsert;
    }

    modalOverwriteBtn.addEventListener('click', () => {
        document.getElementById('formatted-preview').innerHTML = pendingFormattedHtml;
        appendModal.style.display = 'none';
        statusText.textContent = "Formatted Successfully ✨";
    });

    modalAppendBtn.addEventListener('click', () => {
        insertHtmlAtCursor(pendingFormattedHtml);
        appendModal.style.display = 'none';
        statusText.textContent = "Appended Successfully ✨";
    });

    modalCancelBtn.addEventListener('click', () => {
        appendModal.style.display = 'none';
        statusText.textContent = "Format Cancelled";
    });

    // Handle Format Button Click
    formatBtn.addEventListener('click', async () => {
        statusText.textContent = "Analyzing structure with AI...";
        await processTextUpdate();
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

    // --- State for AI Caching ---
    let lastParsedText = null;
    let cachedElements = null;

    // --- Core Processing Placeholder ---
    async function processTextUpdate() {
        const textToProcess = rawInput.value;
        const previewContainer = document.getElementById('formatted-preview');

        if (textToProcess.trim() === '') {
            previewContainer.innerHTML = '<div class="placeholder-text">Live preview will appear here...</div>';
            statusText.textContent = "Waiting for input";
            return;
        }

        try {
            let elements;

            // If the raw text is unchanged from the last AI scan, just re-apply the font rules (cached)
            if (textToProcess === lastParsedText && cachedElements) {
                elements = cachedElements;
            } else {
                // Otherwise, call the AI Formatter
                try {
                    const aiFormatter = new window.AIFormatter();
                    elements = await aiFormatter.formatText(textToProcess);
                    lastParsedText = textToProcess;
                    cachedElements = elements;
                } catch (aiError) {
                    console.warn("AI formatting failed, falling back to local heuristic", aiError);
                    // Fallback to local heuristic engine
                    const processor = new window.TextProcessor(textToProcess);
                    const textBlocks = processor.tokenize();
                    const detector = new window.StructureDetector();
                    elements = detector.classifyBlocks(textBlocks);
                }
            }

            // 3. RuleEngine (Pass ribbon rules here)
            const customRibbonRules = typeof getRibbonRules === 'function' ? getRibbonRules() : null;
            const rules = new window.RuleEngine(customRibbonRules);
            const styledElements = rules.applyRules(elements);

            // 4. OutputGenerator
            const generator = new window.OutputGenerator();
            let finalHtml = generator.generateHTML(styledElements);

            // Add Table of Contents if checked
            const includeToc = document.getElementById('include-toc')?.checked;
            if (includeToc) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = finalHtml;
                const headings = tempDiv.querySelectorAll('h2, h3');

                if (headings.length > 0) {
                    // Build academic-style bordered table ToC
                    let tocHtml = `<div class="toc-container">
                        <h3 class="toc-title">CONTENT</h3>
                        <table class="toc-table">
                            <thead>
                                <tr>
                                    <th style="text-align: left;">Topic</th>
                                    <th style="text-align: right; width: 80px;">Page No.</th>
                                </tr>
                            </thead>
                            <tbody>`;

                    let pageEstimate = 1; // Start page numbering from 1
                    headings.forEach((heading, index) => {
                        const id = 'heading-' + index;
                        heading.setAttribute('id', id);

                        const isBold = heading.tagName === 'H1' || heading.tagName === 'H2';
                        const fontStyle = isBold ? 'font-weight: 700;' : 'font-weight: 400; padding-left: 20px;';

                        tocHtml += `<tr>
                            <td style="${fontStyle}"><a href="#${id}" class="toc-link">${heading.textContent}</a></td>
                            <td style="text-align: right; font-weight: 700;">${pageEstimate}</td>
                        </tr>`;

                        // Rough page estimate: increment page every 2-3 headings
                        if ((index + 1) % 2 === 0) pageEstimate++;
                    });

                    tocHtml += `</tbody></table></div>`;
                    finalHtml = tocHtml + tempDiv.innerHTML;
                }
            }

            // Render to DOM or Trigger Modal
            const currentPreviewHtml = previewContainer.innerHTML.trim();
            const isPlaceholder = previewContainer.querySelector('.placeholder-text');

            // If customization is OFF, or the panel is empty/placeholder, just overwrite directly without asking
            if (!window.isCustomizationActive || !currentPreviewHtml || isPlaceholder) {
                previewContainer.innerHTML = finalHtml;
                statusText.textContent = "Formatted Successfully ✨";
            } else {
                // Text exists! The user might have manual edits they don't want to lose. Show the modal.
                pendingFormattedHtml = finalHtml;
                const appendModal = document.getElementById('append-modal');
                appendModal.style.display = 'flex';
                statusText.textContent = "Waiting for Append/Overwrite decision...";
            }

        } catch (error) {
            console.error("Formatting Error:", error);
            statusText.textContent = "Error Formatting";
        }
    }

    // --- Export Functionality ---
    const exportPdfBtn = document.getElementById('export-pdf');
    const exportWordBtn = document.getElementById('export-word');

    // Helper: Build export-ready HTML with page number footer styles
    function buildExportHtml(contentHtml) {
        return `
            <div style="font-family: 'Times New Roman', serif; color: #000;">
                ${contentHtml}
            </div>
        `;
    }

    // 2. Export PDF (using html2pdf.js)
    exportPdfBtn.addEventListener('click', () => {
        const previewContainer = document.getElementById('formatted-preview');
        if (previewContainer.querySelector('.placeholder-text')) {
            alert("No content to export. Please format some text first.");
            return;
        }

        statusText.textContent = "Generating PDF...";

        // Create a wrapper with page-numbering CSS
        const wrapper = document.createElement('div');
        wrapper.innerHTML = buildExportHtml(previewContainer.innerHTML);
        wrapper.style.backgroundColor = '#ffffff';
        wrapper.style.padding = '40px';

        const opt = {
            margin: [15, 10, 20, 10], // top, right, bottom, left (mm) — extra bottom for page number
            filename: 'formatted_document.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(wrapper).toPdf().get('pdf').then(function (pdf) {
            const totalPages = pdf.internal.getNumberOfPages();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.setTextColor(100);
                // Center the page number at the bottom
                pdf.text(String(i), pageWidth / 2, pageHeight - 8, { align: 'center' });
            }
        }).save().then(() => {
            statusText.textContent = "PDF Exported ✨";
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

        // Word-compatible HTML with page number footer via XML namespace
        const wordHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Exported Document</title>
                <style>
                    @page {
                        mso-page-orientation: portrait;
                        size: A4;
                        margin: 2.54cm 2.54cm 2.54cm 2.54cm;
                        mso-header-margin: 1.27cm;
                        mso-footer-margin: 1.27cm;
                    }
                    @page Section1 {
                        mso-footer: f1;
                    }
                    div.Section1 { page: Section1; }
                    table.MsoFooter { margin: 0 auto; }
                    body {
                        font-family: 'Times New Roman', serif;
                        font-size: 12pt;
                        line-height: 1.6;
                    }
                    .toc-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .toc-table th, .toc-table td {
                        border: 1px solid #000;
                        padding: 6px 10px;
                    }
                </style>
            </head>
            <body>
                <div class="Section1">
                    ${htmlContent}
                </div>
                <div style="mso-element: footer;" id="f1">
                    <p style="text-align: center; font-size: 10pt; color: #666;">
                        <span style="mso-field-code: 'PAGE'"></span>
                        <!--[if supportFields]><span style="mso-element:field-begin"></span>PAGE<span style="mso-element:field-end"></span><![endif]-->
                    </p>
                </div>
            </body>
            </html>
        `;

        const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(wordHtml);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted_document.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        statusText.textContent = "Word Exported ✨";
    });

});
