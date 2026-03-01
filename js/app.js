/**
 * Smart Text Formatting Algorithm
 * Core Application Logic (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- UI Elements ---
    const rawInput = document.getElementById('raw-input');
    const htmlElement = document.documentElement;
    const statusText = document.getElementById('status-text');

    // --- State Management ---
    let hasFormattedOnce = false; // Only allow ribbon auto-updates after first manual format

    // Force Light Theme
    htmlElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');

    // --- Event Listeners ---
    const formatBtn = document.getElementById('format-btn');

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

        // Add visual spacing and preserve font-family if we are appending
        const htmlToInsert = `<div style="margin-top:20px; font-family: 'Times New Roman', serif;">${html}</div>`;

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

        // Fallback: Just append to the end of the container (use DOM methods to preserve existing styles)
        previewContainer.insertAdjacentHTML('beforeend', htmlToInsert);
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
        hasFormattedOnce = true;

        // Disable formatting ribbon controls
        const ribbonControls = document.querySelectorAll('.formatting-ribbon select, .formatting-ribbon input');
        ribbonControls.forEach(control => {
            control.disabled = true;
            // Add a visual cue that it is disabled
            control.style.opacity = '0.6';
            control.style.cursor = 'not-allowed';
        });

        await processTextUpdate(false); // Allow append modal for manual formats
    });



    // Live Updating for Ribbon Controls has been disabled.
    // The ribbon options will only be applied when the 'Format Now' button is explicitly clicked.
    // This allows users to tweak output using the 'Edit' mode without ribbon changes overwriting their work.

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

    // Helper function to remove AI boilerplate and UI elements from copied text
    function removeAIBoilerplate(text) {
        let cleaned = text;

        // 1. Remove introductory conversational fillers (e.g. "Sure, here is the code:\n")
        cleaned = cleaned.replace(/^(?:Sure[, ]*|Certainly[, ]*|Here is the[, ]*|Here are the[, ]*|As requested[, ]*)(?:[\w\s]+)?:\s*/i, '');

        // 2. Remove common AI UI artifacts (standalone lines)
        cleaned = cleaned.replace(/^[ \t]*(?:Copy code|Show drafts|Hide drafts|volume_up)[ \t]*$/gim, '');

        // 3. Remove outro conversational/feedback UI elements
        cleaned = cleaned.replace(/(?:Was this response better or worse\?|Regenerate response|Is this conversation helpful so far\?)[\s\S]*$/i, '');

        // 4. Clean up any excessive newlines created by removals
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

        return cleaned.trim();
    }

    // --- State for AI Caching ---
    let lastParsedText = null;
    let cachedElements = null;

    // --- Core Processing Placeholder ---
    async function processTextUpdate(forceOverwrite = false) {
        let textToProcess = rawInput.value;
        const previewContainer = document.getElementById('formatted-preview');

        if (textToProcess.trim() === '') {
            previewContainer.innerHTML = '<div class="placeholder-text">Live preview will appear here...</div>';
            statusText.textContent = "Waiting for input";
            hasFormattedOnce = false;

            // Re-enable formatting ribbon controls since input is empty
            const ribbonControls = document.querySelectorAll('.formatting-ribbon select, .formatting-ribbon input');
            ribbonControls.forEach(control => {
                control.disabled = false;
                control.style.opacity = '1';
                control.style.cursor = 'default';
            });

            return;
        }

        // Clean up conversational filler before attempting to format
        textToProcess = removeAIBoilerplate(textToProcess);

        try {
            let elements;

            // --- Extract Mermaid blocks before AI/heuristic processing ---
            // This prevents the AI from modifying or corrupting mermaid syntax
            const extractedMermaid = [];
            let cleanedText = textToProcess.replace(/```mermaid\s*\n([\s\S]*?)```/g, (match, code) => {
                const index = extractedMermaid.length;
                extractedMermaid.push(code.trim());
                return `\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`;
            });

            // --- Auto-detect and convert plain text flowcharts to Mermaid ---
            // Detects patterns like: Text1 \n | \n ▼ \n Text2 \n | \n ▼ \n Text3
            // Also detects tree structures with ├──, └──, │
            cleanedText = cleanedText.replace(
                /((?:^|\n)[ \t]*\S[^\n]*\n(?:[ \t]*[│|]\s*\n[ \t]*[▼▾►→↓]\s*\n[ \t]*\S[^\n]*\n?){2,})/gm,
                (match) => {
                    // Extract node names from the linear flow
                    const lines = match.trim().split('\n');
                    const nodes = [];
                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Skip connector lines (|, ▼, →, etc.)
                        if (/^[│|▼▾►→↓\s]+$/.test(trimmed) || trimmed === '') continue;
                        if (trimmed.length > 0) nodes.push(trimmed);
                    }
                    if (nodes.length >= 2) {
                        // Build Mermaid graph TD
                        let mermaidCode = 'graph TD\n';
                        for (let i = 0; i < nodes.length; i++) {
                            const safeLabel = nodes[i].replace(/"/g, "'");
                            mermaidCode += `    N${i}["${safeLabel}"]\n`;
                        }
                        for (let i = 0; i < nodes.length - 1; i++) {
                            mermaidCode += `    N${i} --> N${i + 1}\n`;
                        }
                        const index = extractedMermaid.length;
                        extractedMermaid.push(mermaidCode.trim());
                        return `\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`;
                    }
                    return match; // Not enough nodes, leave as-is
                }
            );

            // Also detect tree structures: ├── / └── / │
            cleanedText = cleanedText.replace(
                /((?:^|\n)[ \t]*\S[^\n]*\n(?:[ \t]*[│├└][──\s]*\S[^\n]*\n?){2,})/gm,
                (match) => {
                    const lines = match.trim().split('\n');
                    const nodes = [];
                    const edges = [];
                    let rootLabel = '';

                    // First non-empty line is the root
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed && !/^[│├└]/.test(trimmed)) {
                            rootLabel = trimmed;
                            break;
                        }
                    }
                    if (!rootLabel) return match;

                    nodes.push(rootLabel);
                    let parentStack = [0]; // Track parent indices by indent level

                    for (const line of lines) {
                        const branchMatch = line.match(/^(\s*)[├└]──\s*(.+)/);
                        if (branchMatch) {
                            const indent = branchMatch[1].length;
                            const label = branchMatch[2].trim();
                            const nodeIdx = nodes.length;
                            nodes.push(label);
                            // Determine parent based on indentation
                            const parentIdx = indent <= 0 ? 0 : (parentStack[Math.floor(indent / 4)] || 0);
                            edges.push([parentIdx, nodeIdx]);
                            parentStack[Math.floor(indent / 4) + 1] = nodeIdx;
                        }
                    }

                    if (nodes.length >= 3 && edges.length >= 2) {
                        let mermaidCode = 'graph TD\n';
                        for (let i = 0; i < nodes.length; i++) {
                            const safeLabel = nodes[i].replace(/"/g, "'");
                            mermaidCode += `    N${i}["${safeLabel}"]\n`;
                        }
                        for (const [from, to] of edges) {
                            mermaidCode += `    N${from} --> N${to}\n`;
                        }
                        const index = extractedMermaid.length;
                        extractedMermaid.push(mermaidCode.trim());
                        return `\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`;
                    }
                    return match;
                }
            );

            // --- Auto-detect and convert plain text bar charts to Mermaid xychart ---
            // Detects patterns like: 1951    ████    18%
            cleanedText = cleanedText.replace(
                /((?:^|\n)[ \t]*\S[^\n]*\n(?:[ \t]*[^\n█▓▒░■▆▇▃▄▅▐▌]+?[ \t]+[█▓▒░■▆▇▃▄▅▐▌]+[ \t]+[\d.]+%?\s*\n?){2,})/gm,
                (match) => {
                    const lines = match.trim().split('\n');
                    let title = '';
                    const labels = [];
                    const values = [];

                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Match bar pattern: label  ████  value%
                        const barMatch = trimmed.match(/^([^\n█▓▒░■▆▇▃▄▅▐▌]+?)\s+[█▓▒░■▆▇▃▄▅▐▌]+\s+([\d.]+)%?\s*$/);
                        if (barMatch) {
                            labels.push(barMatch[1].trim());
                            values.push(parseFloat(barMatch[2]));
                        } else if (!title && trimmed && labels.length === 0) {
                            // First non-bar line is the title
                            title = trimmed;
                        }
                    }

                    if (labels.length >= 2 && values.length >= 2) {
                        const maxVal = Math.max(...values);
                        const yMax = Math.ceil(maxVal / 10) * 10 + 10; // Round up
                        let mermaidCode = 'xychart-beta\n';
                        if (title) mermaidCode += `    title "${title}"\n`;
                        mermaidCode += `    x-axis [${labels.map(l => `"${l}"`).join(', ')}]\n`;
                        mermaidCode += `    y-axis "Value" 0 --> ${yMax}\n`;
                        mermaidCode += `    bar [${values.join(', ')}]\n`;

                        const index = extractedMermaid.length;
                        extractedMermaid.push(mermaidCode.trim());
                        return `\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`;
                    }
                    return match;
                }
            );

            // --- Auto-detect and convert markdown tables to HTML ---
            // Detects patterns like: | Year | Rate | \n | --- | --- | \n | 1951 | 18% |
            cleanedText = cleanedText.replace(
                /((?:^|\n)\|[^\n]+\|\s*\n\|[\s\-:|]+\|\s*\n(?:\|[^\n]+\|\s*\n?){1,})/gm,
                (match) => {
                    const lines = match.trim().split('\n').filter(l => l.trim());
                    if (lines.length < 3) return match;

                    const parseRow = (line) => line.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());

                    const headerCells = parseRow(lines[0]);
                    // lines[1] is the separator row (---), skip it
                    const dataRows = lines.slice(2).map(parseRow);

                    if (headerCells.length < 2) return match;

                    // Build an HTML table and inject directly (not mermaid)
                    let tableHtml = '<table class="formatted-table" style="border-collapse:collapse; width:100%; margin:12px 0;">';
                    tableHtml += '<thead><tr>';
                    for (const cell of headerCells) {
                        tableHtml += `<th style="border:1px solid #ddd; padding:8px 12px; background:#f5f7fa; font-weight:bold; text-align:left;">${cell}</th>`;
                    }
                    tableHtml += '</tr></thead><tbody>';
                    for (const row of dataRows) {
                        tableHtml += '<tr>';
                        for (let i = 0; i < headerCells.length; i++) {
                            tableHtml += `<td style="border:1px solid #ddd; padding:8px 12px;">${row[i] || ''}</td>`;
                        }
                        tableHtml += '</tr>';
                    }
                    tableHtml += '</tbody></table>';

                    // Store as a special type - we'll inject the raw HTML
                    const placeholderIdx = extractedMermaid.length;
                    extractedMermaid.push(`__HTML_TABLE__${tableHtml}`);
                    return `\n\n%%MERMAID_PLACEHOLDER_${placeholderIdx}%%\n\n`;
                }
            );

            if (textToProcess === lastParsedText && cachedElements) {
                elements = cachedElements;
            } else {
                // Otherwise, call the AI Formatter (with mermaid-free text)
                try {
                    const aiFormatter = new window.AIFormatter();
                    elements = await aiFormatter.formatText(cleanedText);
                } catch (aiError) {
                    console.warn("AI formatting failed, falling back to local heuristic", aiError);
                    // Fallback to local heuristic engine
                    try {
                        const processor = new window.TextProcessor(cleanedText);
                        const textBlocks = processor.tokenize();
                        const detector = new window.StructureDetector();
                        elements = detector.classifyBlocks(textBlocks, processor._mermaidBlocks || []);
                    } catch (heuristicError) {
                        console.warn("Local heuristic also failed, using raw text", heuristicError);
                        // Ultimate fallback: just wrap everything in paragraphs
                        elements = cleanedText.split(/\n\s*\n/).filter(b => b.trim()).map(block => ({
                            type: 'p',
                            content: block.trim()
                        }));
                    }

                    // Show info about using heuristic fallback
                    statusText.textContent = "Formatted with local engine (AI unavailable)";
                }

                // --- Inject extracted Mermaid blocks back into the elements array ---
                if (extractedMermaid.length > 0) {
                    const finalElements = [];
                    for (const el of elements) {
                        // Check if this element's content contains a mermaid placeholder
                        const placeholderMatch = (el.content || '').match(/%%MERMAID_PLACEHOLDER_(\d+)%%/);
                        if (placeholderMatch) {
                            const idx = parseInt(placeholderMatch[1], 10);
                            // If there's text before the placeholder, keep it as a separate element
                            const before = (el.content || '').split(`%%MERMAID_PLACEHOLDER_${idx}%%`)[0].trim();
                            if (before) {
                                finalElements.push({ ...el, content: before });
                            }
                            // Insert the element with the correct type
                            const extractedContent = extractedMermaid[idx];
                            if (extractedContent.startsWith('__HTML_TABLE__')) {
                                finalElements.push({ type: 'html', content: extractedContent.replace('__HTML_TABLE__', '') });
                            } else {
                                finalElements.push({ type: 'mermaid', content: extractedContent });
                            }
                            // If there's text after the placeholder, keep it too
                            const after = (el.content || '').split(`%%MERMAID_PLACEHOLDER_${idx}%%`)[1]?.trim();
                            if (after) {
                                finalElements.push({ ...el, content: after });
                            }
                        } else {
                            finalElements.push(el);
                        }
                    }
                    elements = finalElements;
                }

                lastParsedText = textToProcess;
                cachedElements = elements;
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
                    let tocHtml = `<div class="toc-container" style="page-break-after: always;">
                        <h3 class="toc-title">CONTENT</h3>
                        <table class="toc-table">
                            <thead>
                                <tr>
                                    <th style="text-align: left;">Topic</th>
                                    <th style="text-align: right; width: 80px;">Page No.</th>
                                </tr>
                            </thead>
                            <tbody>`;

                    let pageEstimate = 1; // Start page numbering from 1 (after TOC)
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
                    // Content starts on a new page after TOC
                    finalHtml = tocHtml + `<div class="content-after-toc">${tempDiv.innerHTML}</div>`;
                }
            }

            // Render to DOM or Trigger Modal
            const currentPreviewHtml = previewContainer.innerHTML.trim();
            const isPlaceholder = previewContainer.querySelector('.placeholder-text');

            // If forced overwrite (ribbon/TOC changes), or customization is OFF, or the panel is empty/placeholder, just overwrite directly
            if (forceOverwrite || !window.isCustomizationActive || !currentPreviewHtml || isPlaceholder) {
                previewContainer.innerHTML = finalHtml;
                statusText.textContent = "Formatted Successfully ✨";
            } else {
                // Text exists! The user might have manual edits they don't want to lose. Show the modal.
                pendingFormattedHtml = finalHtml;
                const appendModal = document.getElementById('append-modal');
                appendModal.style.display = 'flex';
                statusText.textContent = "Waiting for Append/Overwrite decision...";
            }

            // Set up TOC link smooth-scroll behavior
            previewContainer.querySelectorAll('.toc-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetId = link.getAttribute('href')?.substring(1);
                    if (targetId) {
                        const targetEl = previewContainer.querySelector('#' + targetId);
                        if (targetEl) {
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            });

            // Render Mermaid diagrams if any exist in the output
            try {
                const mermaidEls = previewContainer.querySelectorAll('.mermaid');
                if (mermaidEls.length > 0) {
                    // Render each diagram individually to isolate errors
                    for (const el of mermaidEls) {
                        try {
                            const rawCode = el.textContent;
                            // Generate a unique id for each diagram
                            const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
                            const { svg } = await mermaid.render(id, rawCode);
                            el.innerHTML = svg;
                        } catch (singleErr) {
                            console.warn("Mermaid render failed for one diagram:", singleErr);
                            // Show raw code as fallback
                            const rawCode = el.textContent;
                            el.innerHTML = `<pre style="background:#fff3cd; padding:12px; border:1px solid #ffc107; border-radius:6px; white-space:pre-wrap; font-family:monospace; font-size:0.85rem; color:#856404;">⚠️ Diagram could not be rendered.\n\n${rawCode}</pre>`;
                        }
                    }
                }
            } catch (mermaidErr) {
                console.warn("Mermaid rendering error:", mermaidErr);
            }

        } catch (error) {
            console.error("Formatting Error Details:", error);
            const errorMsg = error.message || String(error);
            if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
                statusText.textContent = "⚠️ API quota exceeded. Please wait a few minutes and try again.";
            } else if (errorMsg.includes('API key') || errorMsg.includes('No API key')) {
                statusText.textContent = "⚠️ No API key configured. Set your Gemini API key.";
            } else {
                statusText.textContent = "Error Formatting — check console for details";
            }
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

    // Helper: Convert all SVGs in a container to Base64 Image tags
    // By disabling `htmlLabels` in Mermaid, we've removed CSS-crashing `foreignObject` nodes.
    // This allows native Canvas drawing of the SVG without "tainted canvas" security errors.
    // Exporting as Base64 PNGs is required because MS Word often fails to render Base64 SVGs.
    async function convertSvgsToImages(container) {
        const svgs = Array.from(container.querySelectorAll('svg'));

        for (const svg of svgs) {
            // Get original dimensions to maintain aspect ratio
            // Since this is often run on a cloned (detached) DOM, getBoundingClientRect() returns 0.
            // We MUST rely on the SVG's viewBox or explicit width/height attributes.
            let logicalWidth = parseFloat(svg.getAttribute('width'));
            let logicalHeight = parseFloat(svg.getAttribute('height'));

            if (!logicalWidth || isNaN(logicalWidth) || !logicalHeight || isNaN(logicalHeight)) {
                if (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width) {
                    logicalWidth = svg.viewBox.baseVal.width;
                    logicalHeight = svg.viewBox.baseVal.height;
                } else {
                    const bbox = svg.getBoundingClientRect(); // Fallback if attached
                    logicalWidth = bbox.width || 800; // Final fallback
                    logicalHeight = bbox.height || 600;
                }
            }

            // High DPI Canvas Scaling (2x resolution for crisp exports)
            const exportScale = 2;
            const canvasWidth = logicalWidth * exportScale;
            const canvasHeight = logicalHeight * exportScale;

            // Ensure the SVG has explicit dimensions for the canvas to draw onto at high res
            svg.setAttribute('width', canvasWidth);
            svg.setAttribute('height', canvasHeight);

            // Serialize SVG to string
            const serializer = new XMLSerializer();
            let svgString = serializer.serializeToString(svg);

            // Fix self-closing tags and namespaces (required for old browsers/canvas)
            if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }

            // Clean up unescaped XML characters
            svgString = svgString.replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '');

            // Create a safe data URI for the Image source
            const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

            const pngDataUrl = await new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous'; // Crucial for Canvas
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.ceil(canvasWidth);
                        canvas.height = Math.ceil(canvasHeight);
                        const ctx = canvas.getContext('2d');

                        // Draw white background so transparent parts don't look weird in Word
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw the SVG
                        ctx.drawImage(img, 0, 0);

                        resolve(canvas.toDataURL('image/png', 1.0));
                    } catch (e) {
                        console.warn('Canvas SVG drawing failed, falling back to SVG URI.', e);
                        // Fallback to pure base64 SVG if canvas drawing fails
                        resolve('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))));
                    }
                };
                img.onerror = () => {
                    console.warn('Failed to load SVG into image for conversion.');
                    resolve('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))));
                };
                img.src = svgUrl;
            });

            // Replace SVG node with standard Image tag
            const imgElement = document.createElement('img');
            imgElement.src = pngDataUrl;

            // MS Word STRICTLY relies on HTML width/height attributes for physical print size mappings.
            // A standard A4 page at 96 DPI has about 600px of printable width and 800px printable height.
            // To prevent large blank gaps on preceding pages, we restrict diagrams to a max of half a page (450px)
            const MAX_PRINT_WIDTH = 600;
            const MAX_PRINT_HEIGHT = 450;

            // Calculate scale to fit within BOTH width and height constraints
            const scaleX = MAX_PRINT_WIDTH / logicalWidth;
            const scaleY = MAX_PRINT_HEIGHT / logicalHeight;
            const printScale = Math.min(1, scaleX, scaleY);

            const printWidth = Math.round(logicalWidth * printScale);
            const printHeight = Math.round(logicalHeight * printScale);

            imgElement.setAttribute('width', printWidth);
            imgElement.setAttribute('height', printHeight);

            // CSS styles for PDF rendering / web preview
            imgElement.style.width = '100%';
            imgElement.style.maxWidth = `${printWidth}px`;
            imgElement.style.height = 'auto'; // Ensure aspect ratio is maintained
            imgElement.style.display = 'inline-block'; // Better for text-align centering in Word
            imgElement.alt = 'Rendered Diagram';

            // Wrap the image in a centered div to guarantee alignment in MS Word, 
            // since Word often ignores margin: auto on images.
            const wrapperDiv = document.createElement('div');
            wrapperDiv.style.textAlign = 'center';
            wrapperDiv.style.margin = '0'; // Inner margin is 0 since the outer lightbox handles padding/margins
            wrapperDiv.appendChild(imgElement);

            svg.parentNode.replaceChild(wrapperDiv, svg);
        }
    }

    // 2. Export PDF (using html2pdf.js)
    exportPdfBtn.addEventListener('click', async () => {
        try {
            const previewContainer = document.getElementById('formatted-preview');
            if (previewContainer.querySelector('.placeholder-text')) {
                alert("No content to export. Please format some text first.");
                return;
            }

            statusText.textContent = "Generating PDF...";

            // Check if TOC is included to determine page numbering offset
            const hasToc = previewContainer.querySelector('.toc-container') !== null;

            // Create a wrapper with page-numbering CSS
            const wrapper = document.createElement('div');

            // Deep clone the preview container so we don't modify the live DOM with our image swaps
            const clonedPreview = previewContainer.cloneNode(true);

            // Convert any Mermaid SVGs in the cloned node to PNG/SVG images so html2canvas renders them
            await convertSvgsToImages(clonedPreview);

            wrapper.innerHTML = buildExportHtml(clonedPreview.innerHTML);
            wrapper.style.backgroundColor = '#ffffff';
            wrapper.style.padding = '40px';
            wrapper.style.boxSizing = 'border-box'; // Ensure padding doesn't push width beyond 100%
            wrapper.style.width = '100%';
            wrapper.style.maxWidth = '100%';
            wrapper.style.overflowWrap = 'break-word'; // Prevent long words from clipping
            wrapper.style.wordWrap = 'break-word';

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

                const tocPages = hasToc ? 1 : 0;

                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    // Only add page numbers to content pages (after TOC)
                    if (i > tocPages) {
                        pdf.setFontSize(10);
                        pdf.setTextColor(100);
                        // Page number starts from 1 after TOC
                        const displayPageNum = i - tocPages;
                        pdf.text(String(displayPageNum), pageWidth / 2, pageHeight - 8, { align: 'center' });
                    }
                }
            }).save().then(() => {
                statusText.textContent = "PDF Exported ✨";
            }).catch(err => {
                console.error("PDF Export Error:", err);
                statusText.textContent = "Export Failed: " + (err.message || String(err));
            });
        } catch (globalErr) {
            console.error("Critical PDF Error:", globalErr);
            statusText.textContent = "Export Failed: " + (globalErr.message || String(globalErr));
        }
    });

    // 3. Export Word (.doc)
    exportWordBtn.addEventListener('click', async () => {
        try {
            const previewContainer = document.getElementById('formatted-preview');
            if (previewContainer.querySelector('.placeholder-text')) {
                alert("No content to export. Please format some text first.");
                return;
            }

            statusText.textContent = "Generating Word Document...";

            // Deep clone the preview container
            const clonedPreview = previewContainer.cloneNode(true);

            // Convert Mermaid containers on the cloned DOM
            await convertSvgsToImages(clonedPreview);

            // Separate TOC and content for Word export
            const tocEl = clonedPreview.querySelector('.toc-container');
            let tocHtml = '';
            let contentHtml = '';

            if (tocEl) {
                tocHtml = tocEl.outerHTML;
                // Get content after TOC
                const contentAfterToc = clonedPreview.querySelector('.content-after-toc');
                contentHtml = contentAfterToc ? contentAfterToc.innerHTML : clonedPreview.innerHTML.replace(tocEl.outerHTML, '');
            } else {
                contentHtml = clonedPreview.innerHTML;
            }

            // Word-compatible HTML with separate sections for TOC and content
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
                        /* TOC Section — no page numbers */
                        @page TocSection {
                            mso-footer: none;
                        }
                        div.TocSection { page: TocSection; }
                        /* Content Section — page numbers starting from 1 */
                        @page ContentSection {
                            mso-footer: f1;
                            mso-page-numbers-start: 1;
                        }
                        div.ContentSection { page: ContentSection; }
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
                    ${tocHtml ? `<div class="TocSection">${tocHtml}<br clear=all style='mso-special-character:line-break;page-break-before:always'></div>` : ''}
                    <div class="ContentSection">
                        ${contentHtml}
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

            // Use htmlDocx to convert the HTML payload into a true zipped .docx container
            // This natively supports Base64 images and guarantees cross-platform compatibility 
            // natively required by strict systems like iOS / Apple Pages and Google Docs.
            const docxBlob = htmlDocx.asBlob(wordHtml);
            const url = URL.createObjectURL(docxBlob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'formatted_document.docx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            statusText.textContent = "Word Exported ✨";
        } catch (globalErr) {
            console.error("Critical Word Export Error:", globalErr);
            statusText.textContent = "Export Failed: " + (globalErr.message || String(globalErr));
        }
    });

});
