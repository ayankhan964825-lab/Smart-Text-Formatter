/**
 * Smart Text Formatting Algorithm
 * Core Application Logic (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- UI Elements ---
    const rawInput = document.getElementById('raw-input');
    const htmlElement = document.documentElement;
    const statusText = document.getElementById('status-text') || { textContent: '' };

    // --- State Management ---
    let hasFormattedOnce = false; // Only allow ribbon auto-updates after first manual format

    // Force Light Theme
    htmlElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');

    // --- Event Listeners ---
    const formatBtn = document.getElementById('format-btn');

    // --- Hamburger Menu Logic ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const customApiKeyInput = document.getElementById('custom-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyStatus = document.getElementById('api-key-status');

    // Clear saved API key on every page refresh (user requested)
    localStorage.removeItem('gemini_api_key');
    if (customApiKeyInput) {
        customApiKeyInput.value = '';
    }

    function openMenu() {
        settingsMenu.classList.add('open');
        menuOverlay.classList.add('active');
        // Double check on open in case another tab changed it
        const currentKey = localStorage.getItem('gemini_api_key');
        if (currentKey) {
            customApiKeyInput.value = currentKey;
        }
    }

    function closeMenu() {
        settingsMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        apiKeyStatus.style.display = 'none'; // reset status
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', () => {
            const val = customApiKeyInput.value.trim();
            if (val) {
                localStorage.setItem('gemini_api_key', val);
                // Also update the active formatter instance
                if (window.aiFormatter) {
                    window.aiFormatter.localApiKey = val;
                }
                apiKeyStatus.textContent = '✅ API Key saved! Ready to format.';
                apiKeyStatus.style.color = '#38a169'; // Green
            } else {
                localStorage.removeItem('gemini_api_key');
                if (window.aiFormatter) {
                    window.aiFormatter.localApiKey = '';
                }
                apiKeyStatus.textContent = '🗑️ Custom API Key removed. Using default server key.';
                apiKeyStatus.style.color = '#718096'; // Gray
            }
            apiKeyStatus.style.display = 'block';

            // Auto close after briefly showing success message
            setTimeout(closeMenu, 1500);
        });
    }

    // Expose openMenu globally so the quota error button can launch it
    window.openSettingsMenu = openMenu;

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

            // Also fade the label if it's a checkbox
            if (control.type === 'checkbox' && control.parentElement) {
                control.parentElement.style.opacity = '0.6';
                control.parentElement.style.cursor = 'not-allowed';
            }
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

        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingTitle = document.getElementById('loading-title-text');
        const loadingProgress = document.getElementById('loading-progress-text');

        if (loadingOverlay) {
            if (loadingTitle) loadingTitle.textContent = "Analyzing & Formatting...";
            if (loadingProgress) loadingProgress.textContent = "Applying AI rules, detecting diagrams, and structuring your content.";
            loadingOverlay.style.display = 'flex';
        }

        try {
            let elements = [];

            // --- Extract Mermaid blocks before AI/heuristic processing ---
            // This prevents the AI from modifying or corrupting mermaid syntax
            const extractedMermaid = [];
            let cleanedText = textToProcess.replace(/```mermaid\s*\n([\s\S]*?)```/g, (match, code) => {
                const index = extractedMermaid.length;
                extractedMermaid.push(code.trim());
                return `\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`;
            });

            // --- Auto-detect and convert plain text flowcharts to Mermaid ---
            // Strip out random standalone markdown backticks (```) that ChatGPT wraps text in
            cleanedText = cleanedText.replace(/^\s*```[a-zA-Z]*\s*$/gm, '');

            // 1. Auto-detect robust node-arrow flowchart sequences
            // Instead of a single complex regex, we'll find blocks of text that look like flowcharts and replace them.
            cleanedText = cleanedText.replace(
                // Capture everything between headings/lists or start/end of string
                /([\s\S]+?)(?=(?:\n#{1,6}\s|\n\d+\.\s|\n[A-Z]\.\s|$))/g,
                (passage) => {
                    const hasArrow = /(↓|→|->|=>|v|\^|<|>)/i.test(passage);
                    if (!hasArrow) return passage;

                    // Split the passage by newlines to examine it line by line
                    let lines = passage.split('\n');
                    let newPassage = [];

                    let isBuildingFlowchart = false;
                    let currentFlowchartParts = [];

                    const arrowLineRegex = /^[ \t]*(↓|→|->|=>|v|V|\^|<|>)[ \t]*$/i;
                    const inlineArrowRegex = /\s+(↓|→|->|=>)\s+/;

                    // Helper for finalizing accumulated multi-line flowcharts
                    const finalizeFlowchart = (parts) => {
                        let nodes = [];
                        let arrows = [];
                        const arrowValidator = /^(↓|→|->|=>|v|V|\^|<|>)$/i;

                        for (let part of parts) {
                            if (arrowValidator.test(part)) arrows.push(part);
                            else nodes.push(part);
                        }

                        // Minimum requirement for a flowchart
                        if (nodes.length >= 2 && arrows.length >= 1 && arrows.length >= nodes.length - 2) {
                            const hasDown = arrows.some(a => ['↓', 'v', 'V'].includes(a.toLowerCase()));
                            const direction = hasDown ? 'TD' : 'LR';
                            let mermaidCode = `graph ${direction}\n`;

                            for (let i = 0; i < nodes.length; i++) {
                                mermaidCode += `    N${i}["${nodes[i].replace(/"/g, "'")}"]\n`;
                            }
                            for (let i = 0; i < nodes.length - 1; i++) {
                                mermaidCode += `    N${i} --> N${i + 1}\n`;
                            }
                            const index = extractedMermaid.length;
                            extractedMermaid.push(mermaidCode.trim());
                            newPassage.push(`\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`);
                        } else {
                            // Not a valid sequence, just put the text back
                            newPassage.push(...parts);
                        }
                    };

                    for (let i = 0; i < lines.length; i++) {
                        const originalLine = lines[i];
                        const line = originalLine.trim();

                        if (!line) {
                            if (isBuildingFlowchart) continue; // Ignore blank lines inside a flowchart
                            else { newPassage.push(originalLine); continue; }
                        }

                        // Check if line itself is a full inline flowchart (e.g., A ↓ B)
                        if (!isBuildingFlowchart && inlineArrowRegex.test(line)) {
                            const parts = line.split(inlineArrowRegex);
                            if (parts.length >= 5) {
                                const nodes = [], arrows = [];
                                for (let p = 0; p < parts.length; p++) {
                                    if (p % 2 === 0) nodes.push(parts[p].trim());
                                    else arrows.push(parts[p].trim());
                                }
                                if (nodes.length >= 3) {
                                    const dir = (arrows[0] === '→' || arrows[0] === '->' || arrows[0] === '=>') ? 'LR' : 'TD';
                                    let mermaidCode = `graph ${dir}\n`;
                                    for (let n = 0; n < nodes.length; n++) mermaidCode += `    N${n}["${nodes[n].replace(/"/g, "'")}"]\n`;
                                    for (let n = 0; n < nodes.length - 1; n++) mermaidCode += `    N${n} --> N${n + 1}\n`;
                                    const index = extractedMermaid.length;
                                    extractedMermaid.push(mermaidCode.trim());
                                    newPassage.push(`\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`);
                                    continue;
                                }
                            }
                        }

                        // Start / Continue Multiline Flowchart
                        const isArrowOnlyLine = arrowLineRegex.test(line);

                        if (isBuildingFlowchart) {
                            // If it's a very long sentence, it's probably not a flowchart node anymore, break out.
                            if (line.length > 100) {
                                finalizeFlowchart(currentFlowchartParts);
                                isBuildingFlowchart = false;
                                currentFlowchartParts = [];
                                newPassage.push(originalLine); // Push the text that broke it
                            } else {
                                currentFlowchartParts.push(line);
                            }
                        } else {
                            // Lookahead to see if this is the start of a flowchart (Node \n Arrow)
                            if (line.length < 100 && i + 1 < lines.length) {
                                // Find next non-empty line
                                let nextLine = '';
                                for (let j = i + 1; j < lines.length; j++) {
                                    if (lines[j].trim()) { nextLine = lines[j].trim(); break; }
                                }
                                if (arrowLineRegex.test(nextLine)) {
                                    isBuildingFlowchart = true;
                                    currentFlowchartParts.push(line);
                                    continue;
                                }
                            }
                            newPassage.push(originalLine);
                        }
                    }

                    if (isBuildingFlowchart) finalizeFlowchart(currentFlowchartParts);

                    return newPassage.join('\n');
                }
            );

            // 2. Auto-detect vertical multiline flowcharts
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

            // Also detect ASCII org-chart trees using | and __ connectors
            // Format:     Poverty
            //                |
            //          __|__|__
            //          |   |   |
            //    Unemployment  Lack of Education  Population Growth
            //          |            |                   |
            //    Low Income    Skill Gap       Resource Pressure
            cleanedText = cleanedText.replace(
                /((?:^|\n)[ \t]*\S[^\n]*\n(?:[ \t]*(?:[|│]|[_─\-]+[|│]?[_─\-]*|[^\S\n]*[|│][^\S\n]*)+[ \t]*\n)*(?:[ \t]*\S[^\n]*\n)*(?:[ \t]*(?:[|│]|[_─\-]+[|│]?[_─\-]*)+[ \t]*\n)*(?:[ \t]*\S[^\n]*\n?)*){1,}/gm,
                (match) => {
                    const lines = match.trim().split('\n');

                    // Identify connector lines vs text lines
                    const isConnectorLine = (line) => {
                        const trimmed = line.trim();
                        if (!trimmed) return false;
                        // Lines that are ONLY made of |, _, -, ?, ?, spaces
                        if (!/^[|│_─\-\s]+$/.test(trimmed)) return false;
                        // Must contain at least one vertical bar to distinguish from standard horizontal rules (---)
                        return /[|│]/.test(trimmed);
                    };

                    // Extract text groups at each level  
                    const levels = [];
                    let currentLevel = [];
                    let hasConnectors = false;

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue; // Skip empty lines completely

                        if (isConnectorLine(line)) {
                            hasConnectors = true;
                            if (currentLevel.length > 0) {
                                levels.push(currentLevel);
                                currentLevel = [];
                            }
                        } else {
                            // Extract text segments from this line
                            // If a single line is extremely long, it's a paragraph, not a tree diagram node
                            if (trimmed.length > 250) return match;

                            // Multiple nodes might be on the same line separated by spaces
                            currentLevel.push(trimmed);
                        }
                    }
                    if (currentLevel.length > 0) levels.push(currentLevel);

                    // Need at least 2 levels and some connectors to be a tree
                    if (levels.length < 2 || !hasConnectors) return match;

                    // Flatten: first level is the root, subsequent levels are children
                    // We need to split multi-word lines into separate nodes when they represent siblings
                    const allNodes = [];
                    const edges = [];

                    // Process first level as root
                    const rootTexts = levels[0];
                    const rootLabel = rootTexts.join(' ').trim();
                    if (!rootLabel || rootLabel.length > 100) return match;
                    allNodes.push(rootLabel);

                    // Process subsequent levels
                    for (let lvl = 1; lvl < levels.length; lvl++) {
                        const parentStartIdx = allNodes.length - (lvl > 1 ? levels[lvl - 1].join(' ').split(/\s{2,}/).length : 1);

                        // Join all text lines at this level and split by double+ spaces (sibling separator)
                        const levelText = levels[lvl].join(' ');
                        const siblings = levelText.split(/\s{2,}/).map(s => s.trim()).filter(s => s.length > 0);

                        if (siblings.length === 0) continue;

                        // Determine parent: if this is level 1, parent is root
                        // If deeper, distribute among previous level's nodes
                        const prevLevelNodes = lvl === 1
                            ? [0]
                            : Array.from({ length: levels[lvl - 1].join(' ').split(/\s{2,}/).length }, (_, i) => parentStartIdx + i);

                        for (let s = 0; s < siblings.length; s++) {
                            const nodeIdx = allNodes.length;
                            allNodes.push(siblings[s]);
                            // Connect to parent: distribute siblings evenly among parents
                            const parentIdx = prevLevelNodes.length === 1
                                ? prevLevelNodes[0]
                                : prevLevelNodes[Math.min(s, prevLevelNodes.length - 1)];
                            if (parentIdx >= 0 && parentIdx < allNodes.length) {
                                edges.push([parentIdx, nodeIdx]);
                            }
                        }
                    }

                    if (allNodes.length >= 3 && edges.length >= 2) {
                        let mermaidCode = 'graph TD\n';
                        for (let i = 0; i < allNodes.length; i++) {
                            const safeLabel = allNodes[i].replace(/"/g, "'");
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

            // --- Auto-detect VERTICAL bar charts (ChatGPT format): value | ████ with axis labels at bottom ---
            // Detects: 50 | ████████████████████████
            //          40 | ████████████████████
            //          ...
            //          1993    2005    2011    2022
            cleanedText = cleanedText.replace(
                /((?:^|\n)[ \t]*(?:\S[^\n]*\n)?(?:[ \t]*\d+[\s]*\|[ \t]*[█▓▒░■▆▇▃▄▅▐▌]+[ \t]*\n?){2,}(?:[ \t]*\d+[\s]*\|[ \t]*[█▓▒░■▆▇▃▄▅▐▌]*[ \t]*\n)?(?:[ \t]*(?:\d{4}|\w+)(?:\s+(?:\d{4}|\w+))*[ \t]*\n?)?)/gm,
                (match) => {
                    const lines = match.trim().split('\n');
                    let title = '';
                    const yValues = [];
                    const barLengths = [];
                    let xLabels = [];

                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Match: value | ████ (Y-axis value on left, bars on right)
                        const vertBarMatch = trimmed.match(/^(\d+)\s*\|\s*([█▓▒░■▆▇▃▄▅▐▌]+)\s*$/);
                        // Match: value | (empty bar, value = 0)
                        const emptyBarMatch = trimmed.match(/^(\d+)\s*\|\s*$/);
                        // Match X-axis labels (multiple years/words separated by spaces)
                        const xLabelMatch = trimmed.match(/^(\d{4}(?:\s+\d{4}){1,})\s*$/);
                        const xLabelWordsMatch = trimmed.match(/^(\w+(?:\s+\w+){1,})\s*$/);

                        if (vertBarMatch) {
                            yValues.push(parseInt(vertBarMatch[1], 10));
                            barLengths.push(vertBarMatch[2].length);
                        } else if (emptyBarMatch) {
                            yValues.push(parseInt(emptyBarMatch[1], 10));
                            barLengths.push(0);
                        } else if (xLabelMatch) {
                            xLabels = xLabelMatch[1].split(/\s+/);
                        } else if (!title && trimmed && yValues.length === 0 && !xLabelMatch) {
                            title = trimmed;
                        } else if (xLabels.length === 0 && yValues.length > 0 && xLabelWordsMatch) {
                            // Fallback: try word-based X labels
                            const words = xLabelWordsMatch[1].split(/\s+/);
                            if (words.length >= 2) xLabels = words;
                        }
                    }

                    if (yValues.length >= 2 && barLengths.length >= 2) {
                        // Map bar lengths proportionally to Y-values
                        // The longest bar corresponds to the highest Y-axis value shown
                        const maxYValue = Math.max(...yValues);
                        const maxBarLen = Math.max(...barLengths);

                        // Use Y-axis values/bar lengths to estimate data values
                        // Each bar's value = (barLength / maxBarLength) * maxYValue
                        const dataValues = barLengths.map(len =>
                            maxBarLen > 0 ? Math.round((len / maxBarLen) * maxYValue) : 0
                        );

                        // If no X-axis labels were found, generate generic ones
                        if (xLabels.length === 0) {
                            xLabels = dataValues.map((_, i) => `Item ${i + 1}`);
                        }

                        // Ensure we have enough labels for the data
                        while (xLabels.length < dataValues.length) {
                            xLabels.push(`Item ${xLabels.length + 1}`);
                        }

                        // Reverse if needed (chart goes top-down: highest value first)
                        // The bars are listed from top (highest Y) to bottom (lowest Y)
                        const reversedValues = [...dataValues].reverse();
                        const finalLabels = xLabels.slice(0, reversedValues.length);

                        const yMax = Math.ceil(maxYValue / 10) * 10 + 10;
                        let mermaidCode = 'xychart-beta\n';
                        if (title) mermaidCode += `    title "${title}"\n`;
                        mermaidCode += `    x-axis [${finalLabels.map(l => `"${l}"`).join(', ')}]\n`;
                        mermaidCode += `    y-axis "Value" 0 --> ${yMax}\n`;
                        mermaidCode += `    bar [${reversedValues.join(', ')}]\n`;

                        const index = extractedMermaid.length;
                        extractedMermaid.push(mermaidCode.trim());
                        return `\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`;
                    }
                    return match;
                }
            );

            // --- Auto-detect ASCII line/scatter graphs with * markers ---
            // Detects: 45% |  *
            //          40% |    *
            //          ...
            //          10% |              *
            //              1993  2005  2011  2022
            cleanedText = cleanedText.replace(
                /((?:^|\n)[ \t]*(?:\S[^\n]*\n)?(?:[ \t]*\d+%?\s*\|[^\n*·•]*[*·•][^\n]*\n?){2,}(?:[ \t]*(?:\d{4}|\w+)(?:\s+(?:\d{4}|\w+))*[ \t]*\n?)?)/gm,
                (match) => {
                    const lines = match.trim().split('\n');
                    let title = '';
                    const dataPoints = []; // {y, col} where col = position of * relative to |
                    let xLabels = [];

                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Match: value% | spaces * (star at some position)
                        const graphLineMatch = trimmed.match(/^(\d+)%?\s*\|(.*)([*·•])/);
                        if (graphLineMatch) {
                            const yValue = parseInt(graphLineMatch[1], 10);
                            const beforeStar = graphLineMatch[2]; // text between | and *
                            const starCol = beforeStar.length; // horizontal position of *
                            dataPoints.push({ y: yValue, col: starCol });
                            continue;
                        }

                        // Match X-axis labels (years separated by spaces)
                        const xLabelMatch = trimmed.match(/^(\d{4}(?:\s+\d{4}){1,})\s*$/);
                        if (xLabelMatch) {
                            xLabels = xLabelMatch[1].split(/\s+/);
                            continue;
                        }

                        // Non-data, non-label line = title candidate
                        if (!title && trimmed && dataPoints.length === 0 && !xLabelMatch) {
                            title = trimmed;
                        }
                    }

                    if (dataPoints.length >= 3 && xLabels.length >= 2) {
                        // Map star horizontal positions to X-axis labels
                        const minCol = Math.min(...dataPoints.map(d => d.col));
                        const maxCol = Math.max(...dataPoints.map(d => d.col));
                        const colRange = maxCol - minCol || 1;

                        // For each X-label, find the closest data point
                        const chartData = [];
                        for (let i = 0; i < xLabels.length; i++) {
                            const targetCol = minCol + (i / (xLabels.length - 1)) * colRange;
                            // Find the closest data point to this column
                            let closest = dataPoints[0];
                            let closestDist = Math.abs(dataPoints[0].col - targetCol);
                            for (const dp of dataPoints) {
                                const dist = Math.abs(dp.col - targetCol);
                                if (dist < closestDist) {
                                    closest = dp;
                                    closestDist = dist;
                                }
                            }
                            chartData.push(closest.y);
                        }

                        const maxVal = Math.max(...chartData);
                        const yMax = Math.ceil(maxVal / 10) * 10 + 10;
                        let mermaidCode = 'xychart-beta\n';
                        if (title) mermaidCode += `    title "${title}"\n`;
                        mermaidCode += `    x-axis [${xLabels.map(l => `"${l}"`).join(', ')}]\n`;
                        mermaidCode += `    y-axis "Percentage" 0 --> ${yMax}\n`;
                        mermaidCode += `    line [${chartData.join(', ')}]\n`;

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

                    // --- Text Chunking Logic ---
                    // Only chunk for truly large documents. Gemini 2.5 Flash can handle large inputs,
                    // so we use a generous limit to minimize chunks and preserve document context.
                    const CHUNK_SIZE_LIMIT = 15000; // ~15K chars per chunk (approx 3000-4000 words)
                    const chunks = [];

                    if (cleanedText.length <= CHUNK_SIZE_LIMIT) {
                        // Small enough to process in one go — no chunking needed
                        chunks.push(cleanedText);
                    } else {
                        // Split by double newlines (paragraphs) to avoid breaking sentences
                        const paragraphs = cleanedText.split(/\n\n+/);
                        let currentChunk = "";

                        for (const para of paragraphs) {
                            // If adding this paragraph would exceed the limit, finalize the current chunk
                            if (currentChunk.length + para.length > CHUNK_SIZE_LIMIT && currentChunk.length > 0) {
                                chunks.push(currentChunk.trim());
                                currentChunk = "";
                            }
                            // Add double newline back if we are assembling chunks
                            currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + para;
                        }
                        if (currentChunk.trim().length > 0) {
                            chunks.push(currentChunk.trim());
                        }
                    }

                    if (chunks.length === 0) {
                        chunks.push(cleanedText);
                    }

                    console.log(`[Chunking] Document split into ${chunks.length} chunk(s). Total chars: ${cleanedText.length}`);

                    // Process each chunk sequentially
                    for (let i = 0; i < chunks.length; i++) {
                        if (loadingTitle && loadingProgress && chunks.length > 1) {
                            loadingTitle.textContent = `Formatting Part ${i + 1} of ${chunks.length}`;
                            loadingProgress.textContent = `Analyzing chunk ${i + 1}... Please wait.`;
                        }

                        // Add context prefix for multi-chunk documents so Gemini preserves structure
                        let chunkText = chunks[i];
                        if (chunks.length > 1) {
                            const contextNote = `[CONTEXT: This is part ${i + 1} of ${chunks.length} of a larger document. Classify each text block's structure (h1, h2, sub-subheading, p, ul, ol, code) accurately based on its content. Maintain consistent heading hierarchy throughout.]\n\n`;
                            chunkText = contextNote + chunkText;
                        }

                        // Allow browser to repaint progress UI
                        if (chunks.length > 1) {
                            await new Promise(r => setTimeout(r, 50));
                        }

                        // Wait for formatting of this chunk
                        const chunkElements = await aiFormatter.formatText(chunkText);

                        // Concatenate the structured JSON objects
                        if (Array.isArray(chunkElements)) {
                            elements = elements.concat(chunkElements);
                        }
                    }

                } catch (aiError) {
                    console.warn("AI formatting failed, falling back (if applicable)", aiError);

                    const aiErrorMsg = aiError.message || String(aiError);
                    // If the error is a rate limit or API key issue, abort immediately
                    // so the user sees the real error instead of bad heuristic output.
                    if (aiErrorMsg.includes('429') || aiErrorMsg.includes('RESOURCE_EXHAUSTED') || aiErrorMsg.includes('quota') || aiErrorMsg.includes('API key')) {
                        throw aiError; // Let the outer catch block show the error UI to the user
                    }

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

                // --- Post-processing: Detect inline arrow flowcharts in paragraph elements ---
                // The AI often collapses multi-line flowchart text into a single paragraph like:
                // "Low Income ↓ Lack of Education ↓ Unemployment ↓ ..."
                // This pass catches those and converts them to Mermaid diagrams.
                const postProcessedElements = [];
                for (const el of elements) {
                    if ((el.type === 'p' || el.type === 'li') && el.content) {
                        // Check for inline arrow patterns: at least 2 arrows separating 3+ nodes
                        const inlineArrowSplitRegex = /\s*[↓→]\s*|\s+(?:->|=>)\s+/;
                        const parts = el.content.split(inlineArrowSplitRegex);

                        if (parts.length >= 3 && parts.every(p => p.trim().length > 0 && p.trim().length < 80)) {
                            // Count actual arrows in the original text
                            const arrowCount = (el.content.match(/[↓→]|(?:->)|(?:=>)/g) || []).length;

                            if (arrowCount >= 2) {
                                const nodes = parts.map(p => p.trim());
                                // Determine direction based on arrow type
                                const hasDown = /↓/.test(el.content);
                                const direction = hasDown ? 'TD' : 'LR';
                                let mermaidCode = `graph ${direction}\n`;

                                for (let i = 0; i < nodes.length; i++) {
                                    const safeLabel = nodes[i].replace(/"/g, "'");
                                    mermaidCode += `    N${i}["${safeLabel}"]\n`;
                                }
                                for (let i = 0; i < nodes.length - 1; i++) {
                                    mermaidCode += `    N${i} --> N${i + 1}\n`;
                                }

                                postProcessedElements.push({
                                    type: 'mermaid',
                                    content: mermaidCode.trim()
                                });
                                continue; // Skip pushing the original paragraph
                            }
                        }
                        // --- Post-processing: Detect bar chart text in paragraphs ---
                        // The AI might collapse bar chart lines into: "50 | ████████████████████████ 40 | ████████████████████ 30 | ██████████████ ..."
                        // Or just preserve █ characters with numbers
                        if (el.content && /[█▓▒░■▆▇▃▄▅▐▌]/.test(el.content)) {
                            // Try to extract "number | bars" patterns
                            const barMatches = [...el.content.matchAll(/(\d+)\s*\|\s*([█▓▒░■▆▇▃▄▅▐▌]+)/g)];
                            if (barMatches.length >= 2) {
                                const yValues = barMatches.map(m => parseInt(m[1], 10));
                                const barLengths = barMatches.map(m => m[2].length);

                                // Try to find X-axis labels (years like 1993 2005 2011)
                                const yearMatches = el.content.match(/\b(\d{4})\b/g);
                                let xLabels = [];
                                if (yearMatches && yearMatches.length >= 2) {
                                    // Filter out years that are Y-axis values
                                    xLabels = yearMatches.filter(y => !yValues.includes(parseInt(y, 10)));
                                }
                                if (xLabels.length === 0) {
                                    xLabels = barMatches.map((_, i) => `Item ${i + 1}`);
                                }

                                const maxYValue = Math.max(...yValues);
                                const maxBarLen = Math.max(...barLengths);
                                const dataValues = barLengths.map(len =>
                                    maxBarLen > 0 ? Math.round((len / maxBarLen) * maxYValue) : 0
                                );

                                // Reverse (top-down: highest value first in text)
                                const reversedValues = [...dataValues].reverse();
                                const finalLabels = xLabels.slice(0, reversedValues.length);
                                while (finalLabels.length < reversedValues.length) {
                                    finalLabels.push(`Item ${finalLabels.length + 1}`);
                                }

                                const yMax = Math.ceil(maxYValue / 10) * 10 + 10;
                                let mermaidCode = 'xychart-beta\n';
                                mermaidCode += `    x-axis [${finalLabels.map(l => `"${l}"`).join(', ')}]\n`;
                                mermaidCode += `    y-axis "Value" 0 --> ${yMax}\n`;
                                mermaidCode += `    bar [${reversedValues.join(', ')}]\n`;

                                postProcessedElements.push({
                                    type: 'mermaid',
                                    content: mermaidCode.trim()
                                });
                                continue;
                            }
                        }
                        // --- Post-processing: Detect collapsed line/scatter graph in paragraphs ---
                        // AI might collapse it to: "45% | 40% | 35% | 30% | 25% | 20% | 15% | 10% | 1993 2005 2011 2022"
                        if (el.content && /\d+%\s*\|/.test(el.content)) {
                            // Extract percentage values
                            const pctMatches = [...el.content.matchAll(/(\d+)%/g)];
                            // Extract year labels (4-digit numbers not followed by %)
                            const yearMatches = [...el.content.matchAll(/\b(\d{4})\b(?!%)/g)];

                            if (pctMatches.length >= 3 && yearMatches.length >= 2) {
                                const yValues = pctMatches.map(m => parseInt(m[1], 10));
                                const xLabels = yearMatches.map(m => m[1]);

                                // Map: subsample the y-values evenly to match x-labels
                                const chartData = [];
                                for (let i = 0; i < xLabels.length; i++) {
                                    const idx = Math.round(i * (yValues.length - 1) / (xLabels.length - 1));
                                    chartData.push(yValues[idx]);
                                }

                                const maxVal = Math.max(...chartData);
                                const yMax = Math.ceil(maxVal / 10) * 10 + 10;
                                let mermaidCode = 'xychart-beta\n';
                                mermaidCode += `    x-axis [${xLabels.map(l => `"${l}"`).join(', ')}]\n`;
                                mermaidCode += `    y-axis "Percentage" 0 --> ${yMax}\n`;
                                mermaidCode += `    line [${chartData.join(', ')}]\n`;

                                postProcessedElements.push({
                                    type: 'mermaid',
                                    content: mermaidCode.trim()
                                });
                                continue;
                            }
                        }
                        // --- Post-processing: Detect tree/hierarchy diagrams in paragraphs ---
                        // AI might collapse a tree diagram into something like:
                        // "Poverty | __|__|__ | | | Unemployment Lack of Education Population Growth | | | Low Income Skill Gap Resource Pressure"
                        if (el.content && /[|│]/.test(el.content) && /[_─\-]{2,}/.test(el.content)) {
                            // This looks like a collapsed tree diagram
                            // Split by | and extract text segments
                            const segments = el.content.split(/\s*[|│]\s*/).map(s => s.trim()).filter(s => s.length > 0);
                            // Filter out connector-only segments (just _, -, ─)
                            const textSegments = segments.filter(s => !/^[_─\-\s]+$/.test(s));

                            if (textSegments.length >= 3) {
                                // First segment is the root, rest are children
                                let mermaidCode = 'graph TD\n';
                                for (let i = 0; i < textSegments.length; i++) {
                                    const safeLabel = textSegments[i].replace(/"/g, "'");
                                    mermaidCode += `    N${i}["${safeLabel}"]\n`;
                                }
                                // Connect: root to all others
                                for (let i = 1; i < textSegments.length; i++) {
                                    mermaidCode += `    N0 --> N${i}\n`;
                                }

                                postProcessedElements.push({
                                    type: 'mermaid',
                                    content: mermaidCode.trim()
                                });
                                continue;
                            }
                        }
                    }
                    postProcessedElements.push(el);
                }
                elements = postProcessedElements;

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

            // Enable export buttons since formatting was successful
            const exportBtns = [
                document.getElementById('export-pdf'),
                document.getElementById('export-word'),
                document.getElementById('mobile-export-pdf'),
                document.getElementById('mobile-export-word')
            ];

            exportBtns.forEach(btn => {
                if (btn) {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                }
            });

            // Enable Edit Customization Button
            const editBtn = document.getElementById('toggle-customization-btn');
            if (editBtn) {
                editBtn.disabled = false;
                editBtn.style.opacity = '1';
                editBtn.style.cursor = 'pointer';
            }

            // Disable Format Now button & Text Input so they can't reformat without refresh
            if (formatBtn) {
                formatBtn.disabled = true;
                formatBtn.style.opacity = '0.5';
                formatBtn.style.cursor = 'not-allowed';
                formatBtn.innerHTML = '✅ Formatted';
            }
            if (rawInput) {
                rawInput.disabled = true;
            }

        } catch (error) {
            console.error("Formatting Error Details:", error);
            const errorMsg = error.message || String(error);
            const previewContainer = document.getElementById('formatted-preview');

            if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
                statusText.textContent = "⚠️ API quota exceeded. Please wait a few minutes.";
                if (previewContainer) {
                    previewContainer.innerHTML = `
                        <div style="padding: 24px; text-align: center; color: #d32f2f; background-color: #ffebee; border: 1px solid #ffcdd2; border-radius: 8px; margin: 20px;">
                            <h3 style="margin-top: 0;">⚠️ API Limit Reached</h3>
                            <p>You have exceeded the free limit for the AI Formatter.</p>
                            <p><strong>Option 1:</strong> Wait 1-2 minutes for your quota to reset and try clicking 'Format Now' again.</p>
                            <hr style="border:0; border-top:1px solid #ffcdd2; margin:16px 0;">
                            <p><strong>Option 2:</strong> Use your own free Gemini API key to skip the wait.</p>
                            <button onclick="window.openSettingsMenu()" class="btn secondary btn-small" style="margin-top: 8px; background-color: white;">⚙️ Enter Custom API Key</button>
                        </div>
                    `;
                }
            } else if (errorMsg.includes('API key') || errorMsg.includes('No API key')) {
                statusText.textContent = "⚠️ No API key configured. Set your Gemini API key.";
                if (previewContainer) {
                    previewContainer.innerHTML = '<div style="padding: 20px; color: #d32f2f;">Error: Gemini API key is missing.</div>';
                }
            } else {
                statusText.textContent = "Error Formatting — check console for details";
                if (previewContainer) {
                    previewContainer.innerHTML = `<div style="padding: 20px; color: #d32f2f;">An unexpected formatting error occurred.<br><small>${errorMsg}</small></div>`;
                }
            }

            // Re-enable Format Button so user can try again
            if (formatBtn) {
                formatBtn.disabled = false;
                formatBtn.style.opacity = '1';
                formatBtn.style.cursor = 'pointer';
                formatBtn.innerHTML = '✨ Format Now';
            }
            if (rawInput) {
                rawInput.disabled = false;
            }
        } finally {
            // Re-enable ribbon controls so user can make live adjustments (e.g. alignment)
            const ribbonControls = document.querySelectorAll('.formatting-ribbon select, .formatting-ribbon input');
            ribbonControls.forEach(control => {
                control.disabled = false;
                control.style.opacity = '1';
                control.style.cursor = 'default';

                if (control.type === 'checkbox' && control.parentElement) {
                    control.parentElement.style.opacity = '1';
                    control.parentElement.style.cursor = 'default';
                }
            });

            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
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
    const handleExportPdf = async () => {
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
    };

    // Fetch mobile buttons since they were missing declarations in the global scope
    const mobileExportPdfBtn = document.getElementById('mobile-export-pdf');
    const mobileExportWordBtn = document.getElementById('mobile-export-word');

    if (exportPdfBtn) exportPdfBtn.addEventListener('click', handleExportPdf);
    if (mobileExportPdfBtn) mobileExportPdfBtn.addEventListener('click', handleExportPdf);

    // 3. Export Word (.doc)
    const handleExportWord = async () => {
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

            // Very smart fix: Detect if the user is on an iOS or Mac device
            const isAppleDevice = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

            let finalBlob, fileName;

            if (isAppleDevice) {
                // Apple devices natively support zipped .docx containers better than old HTML .doc
                finalBlob = htmlDocx.asBlob(wordHtml);
                fileName = 'formatted_document.docx';
            } else {
                // Windows and Android MS Word apps struggle with HTML-Docs disguised as .docx (blank pages)
                // So we serve them the native MS Word HTML blob as a .doc file
                finalBlob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
                fileName = 'formatted_document.doc';
            }

            const url = URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            statusText.textContent = "Word Exported ✨";
        } catch (globalErr) {
            console.error("Critical Word Export Error:", globalErr);
            statusText.textContent = "Export Failed: " + (globalErr.message || String(globalErr));
        }
    };

    if (exportWordBtn) exportWordBtn.addEventListener('click', handleExportWord);
    if (mobileExportWordBtn) mobileExportWordBtn.addEventListener('click', handleExportWord);

    // --- Live Alignment Update from Ribbon ---
    const globalAlignmentSelect = document.getElementById('global-alignment');
    if (globalAlignmentSelect) {
        globalAlignmentSelect.addEventListener('change', (e) => {
            const previewContainer = document.getElementById('formatted-preview');
            // Only update if there is content (not the placeholder)
            if (previewContainer && !previewContainer.querySelector('.placeholder-text')) {
                // Determine what to align based on RuleEngine defaults to avoid messing up Mermaid diagrams
                const targetElements = previewContainer.querySelectorAll('h1, h2, h3, p, ul, ol, div:not(.mermaid), pre');
                targetElements.forEach(el => {
                    el.style.textAlign = e.target.value;
                });
            }
        });
    }

});
