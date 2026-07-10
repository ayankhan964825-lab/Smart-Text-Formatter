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
    
    // Auto-Save State
    let currentDocumentId = Date.now().toString();
    let autoSaveTimer = null;
    let isInitialLoad = true;

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

    // --- Toast Notification Logic ---
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast-message');
        if (!toast) return;

        // Reset classes
        toast.className = 'toast-message';
        toast.innerHTML = message;
        
        // Reset custom styles in case it was a warning previously
        toast.style.color = '';
        toast.style.border = '';
        toast.style.fontWeight = '';
        
        if (type === 'error' || type === true) {
            toast.style.background = 'rgba(229, 62, 62, 0.95)'; // Red
        } else if (type === 'warning') {
            toast.style.background = '#fffbeb'; // Bright Yellow/Orange
            toast.style.color = '#d97706';
            toast.style.border = '2px solid #fde68a';
            toast.style.fontWeight = 'bold';
        } else {
            toast.style.background = 'rgba(56, 161, 105, 0.95)'; // Green
        }

        toast.classList.add('show');

        // Hide after 3 seconds (6 for warning)
        const duration = type === 'warning' ? 6000 : 3000;
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // --- API Key Connection Flow ---
    const connectApiKeyBtn = document.getElementById('connect-api-key-btn');
    if (connectApiKeyBtn) {
        connectApiKeyBtn.addEventListener('click', async () => {
            const val = customApiKeyInput.value.trim();
            
            // Allow clearing key by passing empty input
            if (!val) {
                localStorage.removeItem('gemini_api_key');
                if (window.aiFormatter) {
                    window.aiFormatter.localApiKey = '';
                }
                apiKeyStatus.textContent = '🗑️ Custom API Key removed. Using default secure server.';
                apiKeyStatus.style.color = '#718096'; // Gray
                apiKeyStatus.style.display = 'block';
                setTimeout(closeMenu, 1500);
                return;
            }

            connectApiKeyBtn.textContent = 'Connecting...';
            connectApiKeyBtn.disabled = true;
            apiKeyStatus.textContent = 'Verifying API Key...';
            apiKeyStatus.style.color = '#3182ce'; // Blue
            apiKeyStatus.style.display = 'block';

            try {
                // Lightweight ping payload to verify key
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${val}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "ping" }] }],
                        generationConfig: { maxOutputTokens: 5 }
                    })
                });

                if (response.ok) {
                    // Valid Key: Save it
                    localStorage.setItem('gemini_api_key', val);
                    if (window.aiFormatter) {
                        window.aiFormatter.localApiKey = val;
                    }
                    apiKeyStatus.innerHTML = '🎉 API Key Valid & Saved!';
                    apiKeyStatus.style.color = '#38a169'; // Green

                    // Wait 2 seconds, then close menu and show toast
                    setTimeout(() => {
                        closeMenu();
                        showToast('✅ API Connected! Using your secure key.');
                    }, 2000);

                } else {
                    const err = await response.text();
                    console.error("API Connect Error:", response.status, err);
                    apiKeyStatus.innerHTML = `❌ <b>Invalid API Key</b> (HTTP ${response.status}). Please check your key.`;
                    apiKeyStatus.style.color = '#e53e3e'; // Red
                }
            } catch (networkError) {
                apiKeyStatus.innerHTML = `❌ <b>Network Error</b>: Could not reach Google.`;
                apiKeyStatus.style.color = '#e53e3e'; // Red
            } finally {
                connectApiKeyBtn.textContent = 'Connect';
                connectApiKeyBtn.disabled = false;
            }
        });
    }

    // --- API Key Visibility Toggle ---
    const toggleApiVisibilityBtn = document.getElementById('toggle-api-visibility');
    if (toggleApiVisibilityBtn && customApiKeyInput) {
        toggleApiVisibilityBtn.addEventListener('click', () => {
            const isPassword = customApiKeyInput.type === 'password';
            customApiKeyInput.type = isPassword ? 'text' : 'password';
            
            // Update icon visually
            const svgPath = toggleApiVisibilityBtn.querySelector('path');
            if (isPassword) {
                // Change to eye-off icon
                svgPath.setAttribute('d', 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22');
            } else {
                // Change back to eye icon
                svgPath.setAttribute('d', 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z');
            }
        });
    }

    // Expose openMenu globally so the quota error button can launch it
    window.openSettingsMenu = openMenu;

    // --- Rich Text Editing Toolbar & Customization Toggle ---
    window.isCustomizationActive = false;
    const customizeBtn = document.getElementById('toggle-customization-btn');
    const fullScreenBtn = document.getElementById('toggle-fullscreen-btn');
    const exitFullScreenBtn = document.getElementById('exit-fullscreen-btn');
    const fsControls = document.getElementById('fullscreen-controls');
    const miniToolbar = document.getElementById('mini-rtf-toolbar');
    const previewContainerEl = document.getElementById('formatted-preview');

    const toggleFullScreenMode = () => {
        const outputPanel = document.querySelector('.output-panel');
        outputPanel.classList.toggle('fullscreen-mode');
        document.body.classList.toggle('fullscreen-active');
        
        if (outputPanel.classList.contains('fullscreen-mode')) {
            if (fullScreenBtn) fullScreenBtn.innerHTML = '⮌ Exit Full Screen';
            if (fsControls) fsControls.style.display = 'flex';
            if (exitFullScreenBtn) exitFullScreenBtn.innerHTML = '✖';
        } else {
            if (fullScreenBtn) fullScreenBtn.innerHTML = '⛶ Full Screen';
            // KEEP it flex so the floating controls are always available
            if (fsControls) fsControls.style.display = 'flex';
            if (exitFullScreenBtn) exitFullScreenBtn.innerHTML = '⛶';
        }
    };

    if (fullScreenBtn) {
        fullScreenBtn.addEventListener('click', toggleFullScreenMode);
    }
    
    if (exitFullScreenBtn) {
        exitFullScreenBtn.addEventListener('click', toggleFullScreenMode);
    }

    // Selection caching to prevent loss of focus when clicking toolbar inputs (like font size)
    let savedSelectionRange = null;
    document.addEventListener('selectionchange', () => {
        if (!window.isCustomizationActive) return;
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && previewContainerEl.contains(sel.anchorNode)) {
            savedSelectionRange = sel.getRangeAt(0).cloneRange();
            
            // Auto-detect font size and update the input
            const node = sel.anchorNode;
            const element = node.nodeType === 3 ? node.parentNode : node;
            if (element && element.nodeType === 1) {
                const computed = window.getComputedStyle(element);
                const fontSizePx = parseFloat(computed.fontSize);
                if (!isNaN(fontSizePx)) {
                    // Convert px to pt (pt ≈ px * 0.75)
                    let fontSizePt = Math.round(fontSizePx * 0.75);
                    const rtfNumberInput = document.querySelector('.rtf-number[data-command="fontSizePt"]');
                    if (rtfNumberInput && rtfNumberInput !== document.activeElement) {
                        rtfNumberInput.value = fontSizePt;
                    }
                }
            }
        }
    });

    const restoreSelection = () => {
        if (savedSelectionRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelectionRange);
        }
    };

    const fsEditBtn = document.getElementById('fs-edit-btn');

    const toggleCustomizationMode = () => {
        window.isCustomizationActive = !window.isCustomizationActive;

        if (window.isCustomizationActive) {
            if (customizeBtn) {
                customizeBtn.innerHTML = '✅ Editing';
                customizeBtn.classList.add('primary');
                customizeBtn.classList.remove('secondary');
            }
            if (fsEditBtn) {
                fsEditBtn.innerHTML = '✅ Editing';
                fsEditBtn.classList.add('primary');
                fsEditBtn.classList.remove('secondary');
            }
            miniToolbar.style.display = 'flex';
            previewContainerEl.setAttribute('contenteditable', 'true');
            previewContainerEl.focus();
        } else {
            if (customizeBtn) {
                customizeBtn.innerHTML = '✏️ Edit';
                customizeBtn.classList.add('secondary');
                customizeBtn.classList.remove('primary');
            }
            if (fsEditBtn) {
                fsEditBtn.innerHTML = '✏️ Edit';
                fsEditBtn.classList.add('secondary');
                fsEditBtn.classList.remove('primary');
            }
            miniToolbar.style.display = 'none';
            previewContainerEl.setAttribute('contenteditable', 'false');
        }
    };

    if (customizeBtn) {
        customizeBtn.addEventListener('click', toggleCustomizationMode);
    }
    if (fsEditBtn) {
        fsEditBtn.addEventListener('click', toggleCustomizationMode);
    }

    const rtfBtns = document.querySelectorAll('.rtf-btn');
    rtfBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            restoreSelection(); // Restore text selection before applying command
            const command = btn.getAttribute('data-command');
            document.execCommand(command, false, null);
            document.getElementById('formatted-preview').focus();
        });
    });

    // Manual Image Insert
    const manualImageBtn = document.getElementById('manual-image-btn');
    const manualImageInsert = document.getElementById('manual-image-insert');
    if (manualImageBtn && manualImageInsert) {
        manualImageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            restoreSelection();
            manualImageInsert.click();
        });
        
        manualImageInsert.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                restoreSelection();
                const imgHTML = `<div class="ai-image-wrapper" contenteditable="false"><img src="${ev.target.result}" /></div><p><br/></p>`;
                document.execCommand('insertHTML', false, imgHTML);
                document.getElementById('formatted-preview').focus();
            };
            reader.readAsDataURL(file);
        });
    }

    const rtfSelects = document.querySelectorAll('.rtf-select');
    rtfSelects.forEach(select => {
        select.addEventListener('change', () => {
            if (select.id === 'page-break-select') return; // Handled separately
            restoreSelection();
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
            restoreSelection();
            const command = input.getAttribute('data-command');
            document.execCommand(command, false, input.value);
            document.getElementById('formatted-preview').focus();
        });
    });

    const rtfNumbers = document.querySelectorAll('.rtf-number');
    rtfNumbers.forEach(input => {
        input.addEventListener('change', () => {
            restoreSelection();
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

    // --- Custom RTF Page Break Logic ---
    const pageBreakSelect = document.getElementById('page-break-select');
    if (pageBreakSelect) {
        pageBreakSelect.addEventListener('change', (e) => {
            restoreSelection();
            const val = e.target.value;
            const previewContainer = document.getElementById('formatted-preview');
            
            if (val === 'current') {
                const sel = window.getSelection();
                if (sel.rangeCount > 0 && previewContainer.contains(sel.anchorNode)) {
                    let node = sel.anchorNode;
                    while (node && node !== previewContainer) {
                        if (node.nodeType === 1) {
                            const tagName = node.tagName.toUpperCase();
                            const display = window.getComputedStyle(node).display;
                            if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE', 'PRE'].includes(tagName) || display === 'block') {
                                node.classList.toggle('page-break-before');
                                break;
                            }
                        }
                        node = node.parentNode;
                    }
                }
            } else if (val === 'all-h2') {
                previewContainer.querySelectorAll('h2').forEach(node => node.classList.add('page-break-before'));
            } else if (val === 'clear-all') {
                previewContainer.querySelectorAll('.page-break-before').forEach(node => node.classList.remove('page-break-before'));
            }
            
            // Reset dropdown visual state
            e.target.selectedIndex = 0;
            previewContainer.focus();
        });
    }

    // --- Overwrite/Append Modal Logic ---
    const appendModal = document.getElementById('append-modal');
    const modalOverwriteBtn = document.getElementById('modal-overwrite-btn');
    const modalAppendBtn = document.getElementById('modal-append-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    let pendingFormattedHtml = "";

    window.appUploadedImages = [];
    const imageUploadInput = document.getElementById('image-upload-input');
    const imagePreviewStrip = document.getElementById('image-preview-strip');

    // --- Image Step Modal Logic ---
    const imageStepModal = document.getElementById('image-step-modal');
    const modalAddImagesBtn = document.getElementById('modal-add-images-btn');
    const modalFormatWithImagesBtn = document.getElementById('modal-format-with-images-btn');
    const modalSkipImagesBtn = document.getElementById('modal-skip-images-btn');
    const captionOptions = document.getElementById('caption-options');
    const modalImagePreview = document.getElementById('modal-image-preview');

    // When user clicks "Choose Images" inside the modal
    if (modalAddImagesBtn && imageUploadInput) {
        modalAddImagesBtn.addEventListener('click', () => {
            imageUploadInput.click();
        });

        imageUploadInput.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            modalAddImagesBtn.innerHTML = '⏳ Processing...';
            modalAddImagesBtn.disabled = true;
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;
                
                const base64DataUrl = await compressImage(file, 1024, 0.7);
                const imageId = window.appUploadedImages.length;
                
                window.appUploadedImages.push({
                    id: imageId,
                    mimeType: file.type,
                    dataUrl: base64DataUrl,
                    base64: base64DataUrl.split(',')[1]
                });
            }
            
            modalAddImagesBtn.innerHTML = '🖼️ Add More Images';
            modalAddImagesBtn.disabled = false;
            imageUploadInput.value = '';
            
            // Update the modal UI to show thumbnails and caption/format options
            renderModalImagePreview();
            if (window.appUploadedImages.length > 0) {
                captionOptions.style.display = 'block';
                modalFormatWithImagesBtn.style.display = 'block';
            }
        });
    }

    // Render thumbnails inside the modal
    function renderModalImagePreview() {
        if (!modalImagePreview) return;
        modalImagePreview.innerHTML = '';
        window.appUploadedImages.forEach((img, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-thumb-wrapper';
            
            const thumb = document.createElement('img');
            thumb.className = 'image-thumb';
            thumb.src = img.dataUrl;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'image-thumb-remove';
            removeBtn.innerHTML = '✖';
            removeBtn.onclick = () => {
                window.appUploadedImages.splice(index, 1);
                window.appUploadedImages.forEach((m, idx) => m.id = idx);
                renderModalImagePreview();
                // Hide caption/format options if no images remain
                if (window.appUploadedImages.length === 0) {
                    captionOptions.style.display = 'none';
                    modalFormatWithImagesBtn.style.display = 'none';
                    modalAddImagesBtn.innerHTML = '🖼️ Choose Images';
                }
            };
            
            wrapper.appendChild(thumb);
            wrapper.appendChild(removeBtn);
            modalImagePreview.appendChild(wrapper);
        });
        // Also sync to the main strip (for later use)
        renderImagePreview();
    }

    // "Format with Images" button in modal
    if (modalFormatWithImagesBtn) {
        modalFormatWithImagesBtn.addEventListener('click', () => {
            // Store caption preference
            const captionChoice = document.querySelector('input[name="caption-choice"]:checked')?.value || 'with';
            window.appImageCaptionEnabled = (captionChoice === 'with');
            imageStepModal.style.display = 'none';
            proceedWithFormatting();
        });
    }

    // "Skip" button in modal
    if (modalSkipImagesBtn) {
        modalSkipImagesBtn.addEventListener('click', () => {
            window.appUploadedImages = []; // Clear any images
            window.appImageCaptionEnabled = false;
            imageStepModal.style.display = 'none';
            proceedWithFormatting();
        });
    }

    
    function renderImagePreview() {
        if (!imagePreviewStrip) return;
        imagePreviewStrip.innerHTML = '';
        window.appUploadedImages.forEach((img, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-thumb-wrapper';
            
            const thumb = document.createElement('img');
            thumb.className = 'image-thumb';
            thumb.src = img.dataUrl;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'image-thumb-remove';
            removeBtn.innerHTML = '✖';
            removeBtn.onclick = () => {
                window.appUploadedImages.splice(index, 1);
                // Re-index remaining images
                window.appUploadedImages.forEach((m, idx) => m.id = idx);
                renderImagePreview();
            };
            
            wrapper.appendChild(thumb);
            wrapper.appendChild(removeBtn);
            imagePreviewStrip.appendChild(wrapper);
        });
    }

    function compressImage(file, maxWidth, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality));
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    }

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

    modalOverwriteBtn.addEventListener('click', async () => {
        const previewContainer = document.getElementById('formatted-preview');
        previewContainer.innerHTML = pendingFormattedHtml;
        appendModal.style.display = 'none';
        
        statusText.textContent = "Finalizing Rendering...";
        await finalizeRendering(previewContainer);
        statusText.textContent = "Formatted Successfully ✨";
    });

    modalAppendBtn.addEventListener('click', async () => {
        insertHtmlAtCursor(pendingFormattedHtml);
        appendModal.style.display = 'none';
        
        statusText.textContent = "Finalizing Rendering...";
        const previewContainer = document.getElementById('formatted-preview');
        await finalizeRendering(previewContainer);
        statusText.textContent = "Appended Successfully ✨";
    });

    modalCancelBtn.addEventListener('click', () => {
        appendModal.style.display = 'none';
        statusText.textContent = "Format Cancelled";
    });

    function populateModalCustomization(defaults) {
        if (!defaults) return;
        
        const setFont = (modalId, fontValue) => {
            const el = document.getElementById(modalId);
            if (!el || !fontValue) return;
            const cleanFont = fontValue.replace(/['"]/g, '');
            for (let i = 0; i < el.options.length; i++) {
                if (cleanFont.includes(el.options[i].value.replace(/['"]/g, ''))) {
                    el.value = el.options[i].value;
                    break;
                }
            }
        };

        const setSize = (modalId, sizeValue) => {
            const el = document.getElementById(modalId);
            if (el && sizeValue) el.value = sizeValue.replace(/[^0-9]/g, '');
        };

        // Populate Fonts
        setFont('modal-h1-font', defaults.h1?.fontFamily);
        setFont('modal-h2-font', defaults.h2?.fontFamily);
        setFont('modal-h3-font', defaults.h3?.fontFamily);
        setFont('modal-body-font', defaults.body?.fontFamily);

        // Populate Sizes
        setSize('modal-h1-size', defaults.h1?.fontSize);
        setSize('modal-h2-size', defaults.h2?.fontSize);
        setSize('modal-h3-size', defaults.h3?.fontSize);
        setSize('modal-body-size', defaults.body?.fontSize);

        // Populate Alignment
        if (defaults.alignment) {
            const alignEl = document.getElementById('modal-alignment');
            if (alignEl) alignEl.value = defaults.alignment;
        }

        // Wire up icon alignment buttons to sync with hidden select
        const alignBtns = document.querySelectorAll('.tmpl-align-btn');
        const alignSelect = document.getElementById('modal-alignment');
        if (alignBtns.length && alignSelect) {
            // Set active state from default
            alignBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.align === alignSelect.value);
                btn.onclick = () => {
                    alignSelect.value = btn.dataset.align;
                    alignBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                };
            });
        }
    }

    // ══════════════════════════════════════════════════
    // Editable Skeleton Editor (shown inside template modal)
    // ══════════════════════════════════════════════════
    function renderSkeletonEditor(template) {
        let panel = document.getElementById('skeleton-preview-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'skeleton-preview-panel';
            const gridEl = document.getElementById('template-grid');
            gridEl.parentNode.insertBefore(panel, gridEl.nextSibling);
        }

        // Work on a live reference to the template's skeleton so edits persist
        const skeleton = template.skeleton;

        let dragSrcIdx = null; // tracks which chip is being dragged

        function rebuildChips() {
            const chipsContainer = document.getElementById('skeleton-chips');
            if (!chipsContainer) return;
            chipsContainer.innerHTML = '';

            if (!skeleton || skeleton.length === 0) {
                chipsContainer.innerHTML = `<span style="color:#94a3b8;font-size:12px;font-style:italic;">No sections yet. Add one below.</span>`;
                return;
            }

            skeleton.forEach((s, idx) => {
                // ── Row wrapper (the draggable unit) ──
                const row = document.createElement('div');
                row.draggable = true;
                row.dataset.idx = idx;
                row.style.cssText = `
                    display:flex; align-items:center; gap:7px;
                    padding:6px 8px; margin-bottom:4px;
                    background:${s.required ? 'linear-gradient(135deg,#ede9fe,#e8e3fd)' : '#f8fafc'};
                    border:1px solid ${s.required ? '#c4b5fd' : '#e2e8f0'};
                    border-radius:10px; transition:box-shadow 0.15s, opacity 0.15s;
                    cursor:grab; user-select:none;
                `;

                // Drag events
                row.addEventListener('dragstart', (e) => {
                    dragSrcIdx = idx;
                    e.dataTransfer.effectAllowed = 'move';
                    setTimeout(() => row.style.opacity = '0.4', 0);
                });
                row.addEventListener('dragend', () => {
                    row.style.opacity = '1';
                    // Remove all drop highlights
                    chipsContainer.querySelectorAll('[data-idx]').forEach(r => {
                        r.style.borderTop = '';
                        r.style.borderBottom = '';
                    });
                });
                row.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    // Visual indicator: show border on drop target
                    chipsContainer.querySelectorAll('[data-idx]').forEach(r => {
                        r.style.borderTop = '';
                        r.style.borderBottom = '';
                    });
                    const targetIdx = parseInt(row.dataset.idx);
                    if (dragSrcIdx !== targetIdx) {
                        if (dragSrcIdx > targetIdx) {
                            row.style.borderTop = '2px solid #7c3aed';
                        } else {
                            row.style.borderBottom = '2px solid #7c3aed';
                        }
                    }
                });
                row.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const targetIdx = parseInt(row.dataset.idx);
                    if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
                    // Move item in array
                    const [moved] = skeleton.splice(dragSrcIdx, 1);
                    skeleton.splice(targetIdx, 0, moved);
                    dragSrcIdx = null;
                    rebuildChips();
                    syncSkeletonToEngine(template);
                });

                // ── Drag handle ──
                const dragHandle = document.createElement('span');
                dragHandle.textContent = '⠿';
                dragHandle.title = 'Drag to reorder';
                dragHandle.style.cssText = `color:#a78bfa;font-size:14px;cursor:grab;flex-shrink:0;line-height:1;`;

                // ── Number badge ──
                const num = document.createElement('span');
                num.style.cssText = `background:#7c3aed;color:#fff;border-radius:50%;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;`;
                num.textContent = idx + 1;

                // ── Label (click to edit) ──
                const label = document.createElement('span');
                label.style.cssText = `font-weight:600;color:#3b0764;flex:1;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text;`;
                label.textContent = s.label;
                label.title = s.aliases && s.aliases.length ? `Aliases: ${s.aliases.join(', ')}` : 'Click to edit';
                label.addEventListener('click', (e) => {
                    e.stopPropagation();
                    row.draggable = false; // disable drag while editing
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = s.label;
                    input.style.cssText = `flex:1;font-size:12px;font-weight:600;border:none;border-bottom:2px solid #7c3aed;outline:none;background:transparent;color:#3b0764;padding:0;min-width:60px;`;
                    row.replaceChild(input, label);
                    input.focus();
                    input.select();
                    const done = () => {
                        const newVal = input.value.trim();
                        if (newVal) {
                            s.label = newVal;
                            s.id = newVal.toLowerCase().replace(/\s+/g, '_');
                        }
                        row.draggable = true;
                        rebuildChips();
                        syncSkeletonToEngine(template);
                    };
                    input.addEventListener('blur', done);
                    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') { row.draggable = true; rebuildChips(); } });
                });

                // ── Up / Down arrows ──
                const upBtn = document.createElement('button');
                upBtn.textContent = '↑';
                upBtn.title = 'Move up';
                upBtn.style.cssText = `background:none;border:none;cursor:${idx === 0 ? 'default' : 'pointer'};font-size:12px;padding:0;color:${idx === 0 ? '#d1d5db' : '#7c3aed'};line-height:1;flex-shrink:0;`;
                upBtn.disabled = idx === 0;
                upBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (idx === 0) return;
                    [skeleton[idx - 1], skeleton[idx]] = [skeleton[idx], skeleton[idx - 1]];
                    rebuildChips();
                    syncSkeletonToEngine(template);
                });

                const downBtn = document.createElement('button');
                downBtn.textContent = '↓';
                downBtn.title = 'Move down';
                downBtn.style.cssText = `background:none;border:none;cursor:${idx === skeleton.length - 1 ? 'default' : 'pointer'};font-size:12px;padding:0;color:${idx === skeleton.length - 1 ? '#d1d5db' : '#7c3aed'};line-height:1;flex-shrink:0;`;
                downBtn.disabled = idx === skeleton.length - 1;
                downBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (idx === skeleton.length - 1) return;
                    [skeleton[idx], skeleton[idx + 1]] = [skeleton[idx + 1], skeleton[idx]];
                    rebuildChips();
                    syncSkeletonToEngine(template);
                });

                // ── Required toggle ──
                const reqBtn = document.createElement('button');
                reqBtn.style.cssText = `background:none;border:none;cursor:pointer;font-size:11px;padding:0;line-height:1;flex-shrink:0;`;
                reqBtn.textContent = s.required ? '🟢' : '⚪';
                reqBtn.title = s.required ? 'Required — click for Optional' : 'Optional — click for Required';
                reqBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    s.required = !s.required;
                    rebuildChips();
                    syncSkeletonToEngine(template);
                });

                // ── Delete button ──
                const delBtn = document.createElement('button');
                delBtn.style.cssText = `background:none;border:none;cursor:pointer;font-size:12px;padding:0;line-height:1;color:#ef4444;opacity:0;transition:opacity 0.15s;flex-shrink:0;`;
                delBtn.textContent = '✕';
                delBtn.title = 'Remove section';
                row.addEventListener('mouseenter', () => delBtn.style.opacity = '1');
                row.addEventListener('mouseleave', () => delBtn.style.opacity = '0');
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    skeleton.splice(idx, 1);
                    rebuildChips();
                    syncSkeletonToEngine(template);
                });

                row.appendChild(dragHandle);
                row.appendChild(num);
                row.appendChild(label);
                row.appendChild(upBtn);
                row.appendChild(downBtn);
                row.appendChild(reqBtn);
                row.appendChild(delBtn);
                chipsContainer.appendChild(row);
            });

        }

        function syncSkeletonToEngine(tmpl) {
            // Update the live template skeleton so AI uses it
            if (window.templateEngine && window.templateEngine.templates[tmpl.id]) {
                window.templateEngine.templates[tmpl.id].skeleton = skeleton;
            }
        }

        if (!skeleton || skeleton.length === 0) {
            panel.innerHTML = `
                <div id="skeleton-editor-box" style="background:linear-gradient(135deg,#faf5ff,#f5f3ff);border:1px solid #ddd6fe;border-radius:12px;padding:12px 14px;margin:10px 0;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <span style="font-size:12px;font-weight:700;color:#6d28d9;letter-spacing:0.3px;">🏗️ SKELETON</span>
                        <span style="font-size:11px;color:#94a3b8;">AI formats freely — no structure</span>
                    </div>
                    <p style="font-size:11px;color:#94a3b8;margin:0;">General template has no predefined sections. Add sections below to guide the AI.</p>
                    <div id="skeleton-add-row" style="display:flex;gap:6px;margin-top:10px;align-items:center;">
                        <input id="skeleton-new-label" type="text" placeholder="Section name..." style="flex:1;font-size:12px;padding:6px 10px;border:1px solid #ddd6fe;border-radius:8px;outline:none;background:#fff;color:#3b0764;">
                        <select id="skeleton-new-req" style="font-size:11px;padding:6px 8px;border:1px solid #ddd6fe;border-radius:8px;background:#fff;color:#6d28d9;cursor:pointer;">
                            <option value="true">🟢 Required</option>
                            <option value="false">⚪ Optional</option>
                        </select>
                        <button id="skeleton-add-btn" style="background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;">+ Add</button>
                    </div>
                </div>`;
        } else {
            panel.innerHTML = `
                <div id="skeleton-editor-box" style="background:linear-gradient(135deg,#faf5ff,#f5f3ff);border:1px solid #ddd6fe;border-radius:12px;padding:12px 14px;margin:10px 0;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-size:12px;font-weight:700;color:#6d28d9;letter-spacing:0.3px;">🏗️ SKELETON — ${template.name}</span>
                        <span style="font-size:10px;color:#a78bfa;cursor:default;" title="⠿ Drag to reorder · ↑↓ Move · Click label to edit · 🟢/⚪ toggle · ✕ delete">⠿ Drag to reorder</span>
                    </div>
                    <div id="skeleton-chips" style="display:flex;flex-direction:column;gap:0;margin-bottom:8px;min-height:28px;"></div>
                    <div id="skeleton-add-row" style="display:flex;gap:6px;margin-top:6px;align-items:center;padding-top:8px;border-top:1px solid #ede9fe;">
                        <input id="skeleton-new-label" type="text" placeholder="Add section..." style="flex:1;font-size:12px;padding:5px 10px;border:1px solid #ddd6fe;border-radius:8px;outline:none;background:#fff;color:#3b0764;">
                        <select id="skeleton-new-req" style="font-size:11px;padding:5px 8px;border:1px solid #ddd6fe;border-radius:8px;background:#fff;color:#6d28d9;cursor:pointer;">
                            <option value="true">🟢 Required</option>
                            <option value="false">⚪ Optional</option>
                        </select>
                        <button id="skeleton-add-btn" style="background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">+ Add</button>
                    </div>
                </div>`;

            rebuildChips();
        }

        // Wire up "Add" button
        const addBtn = document.getElementById('skeleton-add-btn');
        const newLabelInput = document.getElementById('skeleton-new-label');
        const newReqSelect = document.getElementById('skeleton-new-req');

        if (addBtn && newLabelInput) {
            const doAdd = () => {
                const labelVal = newLabelInput.value.trim();
                if (!labelVal) { newLabelInput.focus(); return; }
                skeleton.push({
                    id: labelVal.toLowerCase().replace(/\s+/g, '_'),
                    label: labelVal,
                    required: newReqSelect.value === 'true',
                    aliases: []
                });
                newLabelInput.value = '';
                newLabelInput.focus();

                // Re-render fully to show chips if was empty before
                renderSkeletonEditor(template);
                syncSkeletonToEngine(template);
            };
            addBtn.addEventListener('click', doAdd);
            newLabelInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAdd(); });
        }
    }

    // Render templates inside the modal
    function renderTemplateGrid() {

        const grid = document.getElementById('template-grid');
        const customPanel = document.getElementById('template-customization');
        if (!grid || !window.templateEngine) return;
        
        const templates = window.templateEngine.getAllTemplates();
        grid.innerHTML = '';
        
        templates.forEach(t => {
            const isSelected = window.templateEngine.selectedTemplateId === t.id;
            const card = document.createElement('div');
            card.className = `template-card ${isSelected ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="template-icon">${t.icon}</div>
                <div class="template-name">${t.name}</div>
                <div class="template-desc">${t.description}</div>
            `;
            
            card.addEventListener('click', () => {
                window.templateEngine.selectTemplate(t.id);
                document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                document.getElementById('template-continue-btn').disabled = false;

                // ── Render Editable Skeleton Panel ──
                renderSkeletonEditor(t);

                // Show Customization Panel
                if (customPanel) {
                    customPanel.style.display = 'block';
                    populateModalCustomization(window.templateEngine.getRibbonDefaults());
                }
            });
            grid.appendChild(card);
        });

        // If a non-general template was already selected (e.g. re-opening modal), show customization
        const hasSelection = document.querySelector('.template-card.selected');
        if (customPanel && hasSelection && window.templateEngine.selectedTemplateId !== 'general') {
            customPanel.style.display = 'block';
            populateModalCustomization(window.templateEngine.getRibbonDefaults());
        }
    }

    function applyTemplateToRibbon() {
        // Read directly from modal instead of defaults
        
        // Font assignments map (modalId -> ribbonId)
        const fontMap = {
            'modal-h1-font': 'heading1-font',
            'modal-h2-font': 'heading2-font',
            'modal-h3-font': 'sub-subheading-font',
            'modal-body-font': 'body-font'
        };
        for (const [modalId, elementId] of Object.entries(fontMap)) {
            const ribbonEl = document.getElementById(elementId);
            const modalEl = document.getElementById(modalId);
            if (ribbonEl && modalEl && modalEl.value) {
                // Remove quotes to match options easily
                const fontVal = modalEl.value.replace(/['"]/g, '');
                for (let i = 0; i < ribbonEl.options.length; i++) {
                    if (fontVal.includes(ribbonEl.options[i].value)) {
                        ribbonEl.value = ribbonEl.options[i].value;
                        break;
                    }
                }
            }
        }
        
        // Size assignments map
        const sizeMap = {
            'modal-h1-size': 'heading1-size',
            'modal-h2-size': 'heading2-size',
            'modal-h3-size': 'sub-subheading-size',
            'modal-body-size': 'body-size'
        };
        for (const [modalId, elementId] of Object.entries(sizeMap)) {
            const ribbonEl = document.getElementById(elementId);
            const modalEl = document.getElementById(modalId);
            if (ribbonEl && modalEl && modalEl.value) {
                ribbonEl.value = modalEl.value;
            }
        }
        
        // Alignment
        const modalAlign = document.getElementById('modal-alignment');
        const ribbonAlign = document.getElementById('global-alignment');
        if (modalAlign && ribbonAlign && modalAlign.value) {
            ribbonAlign.value = modalAlign.value;
        }
    }

    // Reference PDF Upload Handling (works with new dropzone UI)
    const refInput = document.getElementById('reference-pdf-input');
    const refFileName = document.getElementById('reference-file-name');
    const refRemoveBtn = document.getElementById('reference-remove-btn');
    const refDropzone = document.querySelector('.tmpl-ref-dropzone');
    const refFileBar = document.getElementById('reference-file-bar');

    async function handleReferencePDF(file) {
        if (!file) return;

        if (!file.type.includes('pdf')) {
            showToast('Please upload a PDF file.', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast('PDF too large. Maximum 10MB allowed.', 'error');
            return;
        }

        // Show loading state on dropzone
        if (refDropzone) {
            refDropzone.style.opacity = '0.6';
            refDropzone.style.pointerEvents = 'none';
        }

        try {
            await window.referenceHandler.processPDF(file);

            // Show file bar, hide dropzone
            if (refFileName) refFileName.textContent = file.name;
            if (refRemoveBtn) refRemoveBtn.style.display = 'flex';
            if (refFileBar) refFileBar.style.display = 'flex';
            if (refDropzone) refDropzone.style.display = 'none';

            showToast('✅ Reference PDF uploaded successfully!');
        } catch (err) {
            console.error('Reference PDF error:', err);
            showToast('Failed to process PDF.', 'error');
        } finally {
            if (refDropzone) {
                refDropzone.style.opacity = '1';
                refDropzone.style.pointerEvents = 'auto';
            }
        }
    }

    // File input change handler
    if (refInput) {
        refInput.addEventListener('change', (e) => {
            handleReferencePDF(e.target.files[0]);
        });
    }

    // Drag & drop support on dropzone
    if (refDropzone) {
        refDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            refDropzone.classList.add('dragover');
        });
        refDropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            refDropzone.classList.remove('dragover');
        });
        refDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            refDropzone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) handleReferencePDF(file);
        });
    }

    // Remove button handler
    if (refRemoveBtn) {
        refRemoveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.referenceHandler.clear();
            if (refFileName) refFileName.textContent = 'No file selected';
            if (refRemoveBtn) refRemoveBtn.style.display = 'none';
            if (refFileBar) refFileBar.style.display = 'none';
            if (refDropzone) refDropzone.style.display = 'flex';
            if (refInput) refInput.value = '';
        });
    }

    // Template Modal Buttons
    document.getElementById('template-continue-btn')?.addEventListener('click', () => {
        document.getElementById('template-modal').style.display = 'none';
        applyTemplateToRibbon();
        
        // Show Image Step Modal
        const imageStepModal = document.getElementById('image-step-modal');
        if (imageStepModal) imageStepModal.style.display = 'flex';
    });

    document.getElementById('template-skip-btn')?.addEventListener('click', () => {
        if(window.templateEngine) window.templateEngine.selectTemplate('general');
        document.getElementById('template-modal').style.display = 'none';
        
        const imageStepModal = document.getElementById('image-step-modal');
        if (imageStepModal) imageStepModal.style.display = 'flex';
    });

    // Handle Format Button Click — Show TEMPLATE modal first
    formatBtn.addEventListener('click', async () => {
        const rawText = rawInput.value.trim();
        if (!rawText) {
            statusText.textContent = 'Please enter some text to format.';
            return;
        }

        // Reset image state for this new format session
        window.appUploadedImages = [];
        window.appImageCaptionEnabled = false;
        
        // Reset image modal UI
        if (modalImagePreview) modalImagePreview.innerHTML = '';
        if (captionOptions) captionOptions.style.display = 'none';
        if (modalFormatWithImagesBtn) modalFormatWithImagesBtn.style.display = 'none';
        if (modalAddImagesBtn) modalAddImagesBtn.innerHTML = '🖼️ Choose Images';
        
        // Show Template Modal FIRST
        const templateModal = document.getElementById('template-modal');
        if (templateModal) {
            renderTemplateGrid();
            // Pre-select general
            if(window.templateEngine) window.templateEngine.selectTemplate('general');
            templateModal.style.display = 'flex';
        } else {
            // Fallback if modal missing
            const imageStepModal = document.getElementById('image-step-modal');
            if (imageStepModal) imageStepModal.style.display = 'flex';
        }
    });

    // The actual formatting logic (called after Image Step Modal decision)
    async function proceedWithFormatting() {
        statusText.textContent = "Analyzing structure with AI...";
        hasFormattedOnce = true;

        // Disable formatting ribbon controls
        const ribbonControls = document.querySelectorAll('.formatting-ribbon select, .formatting-ribbon input');
        ribbonControls.forEach(control => {
            control.disabled = true;
            control.style.opacity = '0.6';
            control.style.cursor = 'not-allowed';

            if (control.type === 'checkbox' && control.parentElement) {
                control.parentElement.style.opacity = '0.6';
                control.parentElement.style.cursor = 'not-allowed';
            }
        });

        await processTextUpdate(false); // Allow append modal for manual formats
    }



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

            // Apply Dynamic Theme Based on API Key (RCB vs CSK)
            const activeCustomKey = window.GEMINI_API_KEY_LOCAL || localStorage.getItem('gemini_api_key');
            loadingOverlay.classList.remove('theme-rcb', 'theme-csk');
            loadingOverlay.classList.add(activeCustomKey ? 'theme-rcb' : 'theme-csk');

            loadingOverlay.style.display = 'flex';
            
            // Force browser to paint the loading UI before executing heavy synchronous parsing
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        try {
            let elements = [];

            // --- Extract Mermaid blocks before AI/heuristic processing ---
            // This prevents the AI from modifying or corrupting mermaid syntax.
            // Catch BOTH markdown-fenced ```mermaid AND bare flowchart/graph/etc declarations.
            const extractedMermaid = [];
            
            // First pass: Markdown fenced blocks
            let cleanedText = textToProcess.replace(/```mermaid\s*\n([\s\S]*?)```/gi, (match, code) => {
                const index = extractedMermaid.length;
                extractedMermaid.push(code.trim());
                return `\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`;
            });

            // Second pass: Bare/Raw Mermaid blocks (un-fenced text that starts with a mermaid keyword)
            const bareMermaidRegex = /^(graph|flowchart|sequenceDiagram|gantt|classDiagram|stateDiagram|pie|journey)[\s\S]+?(?=\n\n|\n$|$)/gim;
            cleanedText = cleanedText.replace(bareMermaidRegex, (match) => {
                // To avoid false positives on normal text that happens to start with "Graph",
                // we only extract it if it contains an arrow "-->" or brackets "[]" typical of mermaid
                if (match.includes('-->') || match.includes('--') || match.includes('[') || match.includes(':')) {
                    const index = extractedMermaid.length;
                    extractedMermaid.push(match.trim());
                    return `\n\n%%MERMAID_PLACEHOLDER_${index}%%\n\n`;
                }
                return match; // False positive, leave it alone
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

                    // --- Bulletproof Text Chunking Logic ---
                    const CHUNK_SIZE_LIMIT = 15000; // ~15K chars per chunk (approx 3000-4000 words)
                    const MAX_RETRIES = 3; // Max retry attempts per chunk
                    const RETRY_DELAY_MS = 2000; // Wait 2 seconds between retries

                    // === Helper: Split a giant paragraph using Fallback Hierarchy ===
                    // Priority: . → ? ! → ; : → , → space → force
                    function splitGiantParagraph(text, limit) {
                        const result = [];
                        let remaining = text;

                        while (remaining.length > limit) {
                            let splitPos = -1;
                            const searchZone = remaining.substring(0, limit);

                            // Priority 1: Full stop followed by space or end
                            splitPos = searchZone.lastIndexOf('. ');
                            if (splitPos === -1) splitPos = searchZone.lastIndexOf('.\n');

                            // Priority 2: Question mark or exclamation
                            if (splitPos === -1) splitPos = searchZone.lastIndexOf('? ');
                            if (splitPos === -1) splitPos = searchZone.lastIndexOf('! ');

                            // Priority 3: Semicolon or colon
                            if (splitPos === -1) splitPos = searchZone.lastIndexOf('; ');
                            if (splitPos === -1) splitPos = searchZone.lastIndexOf(': ');

                            // Priority 4: Comma
                            if (splitPos === -1) splitPos = searchZone.lastIndexOf(', ');

                            // Priority 5: Any space (word boundary)
                            if (splitPos === -1) splitPos = searchZone.lastIndexOf(' ');

                            // Priority 6 (Last Resort): Force split at limit
                            if (splitPos === -1) splitPos = limit;

                            // Include the punctuation character in the first part
                            const cutAt = splitPos + 1;
                            result.push(remaining.substring(0, cutAt).trim());
                            remaining = remaining.substring(cutAt).trim();
                        }

                        if (remaining.trim().length > 0) {
                            result.push(remaining.trim());
                        }
                        return result;
                    }

                    // === Helper: Heuristic fallback for a single chunk ===
                    function heuristicFallbackForChunk(chunkText) {
                        try {
                            const processor = new window.TextProcessor(chunkText);
                            const textBlocks = processor.tokenize();
                            const detector = new window.StructureDetector();
                            return detector.classifyBlocks(textBlocks, []);
                        } catch (e) {
                            // Ultimate fallback: wrap in paragraphs
                            return chunkText.split(/\n\s*\n/).filter(b => b.trim()).map(block => ({
                                type: 'p',
                                content: block.trim()
                            }));
                        }
                    }

                    // === Step 1: Build chunks with giant paragraph splitting ===
                    const chunks = [];

                    if (cleanedText.length <= CHUNK_SIZE_LIMIT) {
                        // Small enough to process in one go — no chunking needed
                        chunks.push(cleanedText);
                    } else {
                        // Split by double newlines (paragraphs) to avoid breaking sentences
                        const paragraphs = cleanedText.split(/\n\n+/);
                        let currentChunk = "";

                        for (const para of paragraphs) {
                            // If this single paragraph exceeds the limit, split it smartly
                            if (para.length > CHUNK_SIZE_LIMIT) {
                                // First, finalize whatever we have in currentChunk
                                if (currentChunk.trim().length > 0) {
                                    chunks.push(currentChunk.trim());
                                    currentChunk = "";
                                }
                                // Split the giant paragraph using fallback hierarchy
                                const subParts = splitGiantParagraph(para, CHUNK_SIZE_LIMIT);
                                console.log(`[Chunking] Giant paragraph (${para.length} chars) split into ${subParts.length} sub-parts via fallback hierarchy.`);
                                for (const subPart of subParts) {
                                    chunks.push(subPart);
                                }
                                continue;
                            }

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

                    // === Step 2: Process each chunk with per-chunk retry ===
                    // Get progress bar elements
                    const chunkProgressContainer = document.getElementById('chunk-progress-container');
                    const chunkProgressBar = document.getElementById('chunk-progress-bar');
                    const chunkProgressPercent = document.getElementById('chunk-progress-percent');
                    const chunkProgressLabel = document.getElementById('chunk-progress-label');

                    // Show progress bar only for multi-chunk documents
                    if (chunks.length > 1 && chunkProgressContainer) {
                        chunkProgressContainer.style.display = 'block';
                        chunkProgressBar.style.width = '0%';
                        chunkProgressPercent.textContent = '0%';
                        chunkProgressLabel.textContent = `Part 0 of ${chunks.length}`;
                    }
                    
                    const failedParts = []; // Track which parts failed to show in toast

                    for (let i = 0; i < chunks.length; i++) {
                        // --- Update progress bar & text ---
                        const percent = Math.round(((i) / chunks.length) * 100);
                        if (loadingTitle && chunks.length > 1) {
                            loadingTitle.textContent = `Processing Large Document...`;
                        }
                        if (loadingProgress && chunks.length > 1) {
                            loadingProgress.textContent = `Formatting Part ${i + 1} of ${chunks.length} — Analyzing context...`;
                        }
                        if (chunkProgressBar && chunks.length > 1) {
                            chunkProgressBar.style.width = `${percent}%`;
                            chunkProgressPercent.textContent = `${percent}%`;
                            chunkProgressLabel.textContent = `Part ${i + 1} of ${chunks.length}`;
                        }

                        // Add context prefix for multi-chunk documents so Gemini preserves structure
                        let chunkText = chunks[i];
                        if (chunks.length > 1) {
                            const contextNote = `[CONTEXT: This is part ${i + 1} of ${chunks.length} of a larger document. Classify each text block using one of: heading (with depth 1/2/3), p, ul, ol, code, table, equation, blockquote, references, image. Maintain consistent heading hierarchy throughout.]\n\n`;
                            chunkText = contextNote + chunkText;
                        }

                        // Allow browser to repaint progress UI
                        if (chunks.length > 1) {
                            await new Promise(r => setTimeout(r, 50));
                        }

                        // --- Per-Chunk Retry Logic ---
                        let chunkSuccess = false;
                        let retries = 0;

                        while (!chunkSuccess && retries < MAX_RETRIES) {
                            try {
                                // Update progress with retry info
                                if (retries > 0 && loadingProgress && chunks.length > 1) {
                                    loadingProgress.textContent = `Formatting Part ${i + 1} of ${chunks.length} — Retry ${retries}/${MAX_RETRIES}...`;
                                    if (chunkProgressLabel) chunkProgressLabel.textContent = `Part ${i + 1} of ${chunks.length} (Retry ${retries})`;
                                    await new Promise(r => setTimeout(r, 50));
                                }

                                // Wait for formatting of this chunk
                                const chunkElements = await aiFormatter.formatText(chunkText, window.appUploadedImages);

                                // Concatenate the structured JSON objects
                                if (Array.isArray(chunkElements)) {
                                    elements = elements.concat(chunkElements);
                                }
                                chunkSuccess = true; // ✅ Move to next chunk

                            } catch (chunkError) {
                                retries++;
                                const errMsg = chunkError.message || String(chunkError);
                                console.warn(`[Chunk ${i + 1}/${chunks.length}] Attempt ${retries} failed: ${errMsg}`);

                                if (retries < MAX_RETRIES) {
                                    // Wait before retry — backend will auto-rotate to next API key
                                    console.log(`[Chunk ${i + 1}] Waiting ${RETRY_DELAY_MS}ms before retry...`);
                                    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
                                }
                            }
                        }

                        // If all retries exhausted for this chunk, use heuristic for ONLY this chunk
                        if (!chunkSuccess) {
                            console.warn(`[Chunk ${i + 1}/${chunks.length}] All ${MAX_RETRIES} retries exhausted. Using local heuristic for this chunk only.`);
                            failedParts.push(i + 1); // Record the failed part number

                            const fallbackElements = heuristicFallbackForChunk(chunks[i]);
                            if (Array.isArray(fallbackElements)) {
                                elements = elements.concat(fallbackElements);
                            }
                            // Continue to next chunk — DO NOT break the loop!
                        }

                        // --- Update progress after chunk completion ---
                        const completedPercent = Math.round(((i + 1) / chunks.length) * 100);
                        if (chunkProgressBar && chunks.length > 1) {
                            chunkProgressBar.style.width = `${completedPercent}%`;
                            chunkProgressPercent.textContent = `${completedPercent}%`;
                        }
                        if (loadingTitle && chunks.length > 1) {
                            loadingTitle.textContent = `Processing Large Document...`;
                        }
                    }

                    // Hide progress bar after completion
                    if (chunkProgressContainer) {
                        chunkProgressContainer.style.display = 'none';
                    }
                    
                    // Show a toast notification if any parts failed
                    if (failedParts.length > 0) {
                        const partsStr = failedParts.join(", ");
                        setTimeout(() => {
                            showToast(`⚠️ Note: Part(s) ${partsStr} formatted locally due to server limits.`, 'warning');
                        }, 500); // Delay slightly so it shows up after loading overlay hides
                    }

                } catch (aiError) {
                    console.warn("AI formatting critically failed (initialization error)", aiError);

                    // Fallback to local heuristic engine for entire document
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

                    headings.forEach((heading, index) => {
                        const id = 'heading-' + index;
                        heading.setAttribute('id', id);

                        const isBold = heading.tagName === 'H1' || heading.tagName === 'H2';
                        const fontStyle = isBold ? 'font-weight: 700;' : 'font-weight: 400; padding-left: 20px;';

                        tocHtml += `<tr>
                            <td style="${fontStyle}"><a href="#${id}" class="toc-link">${heading.textContent}</a></td>
                            <td style="text-align: right; font-weight: 700;" class="toc-page-num" data-target-id="${id}">-</td>
                        </tr>`;
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
                // Now run post-rendering strictly on the injected DOM
                await finalizeRendering(previewContainer);
            } else {
                // Text exists! The user might have manual edits they don't want to lose. Show the modal.
                pendingFormattedHtml = finalHtml;
                const appendModal = document.getElementById('append-modal');
                appendModal.style.display = 'flex';
                statusText.textContent = "Waiting for Append/Overwrite decision...";
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

            // ── Populate AI Reasoning Panel ──
            const thoughtsPanel = document.getElementById('ai-thoughts-panel');
            const thoughtsContent = document.getElementById('ai-thoughts-content');
            if (thoughtsPanel && thoughtsContent && window._lastAiThoughts) {
                const raw = window._lastAiThoughts;
                // Parse step-by-step reasoning into styled cards
                const stepRegex = /Step\s*(\d)[:\s—\-]*(.*?)(?=Step\s*\d|$)/gis;
                let stepsHtml = '';
                let match;
                while ((match = stepRegex.exec(raw)) !== null) {
                    const stepLabels = ['STYLE', 'MAPPING', 'IMAGES', 'ASSEMBLY'];
                    const stepNum = parseInt(match[1]);
                    const label = stepLabels[stepNum - 1] || `STEP ${stepNum}`;
                    const text = match[2].trim();
                    stepsHtml += `<div class="ai-thought-step">
                        <span class="ai-thought-step-num">Step ${stepNum}: ${label}</span>
                        <span class="ai-thought-step-text">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                    </div>`;
                }
                // If regex didn't match steps, show raw text
                if (!stepsHtml) {
                    stepsHtml = `<div style="white-space:pre-wrap;font-size:12px;color:#78350f;">${raw.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
                }
                thoughtsContent.innerHTML = stepsHtml;
                thoughtsPanel.style.display = 'block';
            } else if (thoughtsPanel) {
                thoughtsPanel.style.display = 'none';
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
            
            if (typeof debouncedAutoSave === 'function') {
                debouncedAutoSave();
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
            // As per user request: only re-enable the alignment control for live previews.
            // Other controls remain disabled to encourage page refresh for a new session.
            const alignmentSelect = document.getElementById('global-alignment');
            if (alignmentSelect) {
                alignmentSelect.disabled = false;
                alignmentSelect.style.opacity = '1';
                alignmentSelect.style.cursor = 'default';
            }

            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    }

    // --- Export Functionality ---
    const exportPdfBtn = document.getElementById('export-pdf');
    const exportWordBtn = document.getElementById('export-word');

    // Helper: Build export-ready HTML with page number footer styles
    function buildExportHtml(contentHtml) {
        // Shiv Prakash Research Paper Format Rules:
        // Body: Times New Roman, 12pt (16px), line-height 1.6, justify
        // H1: 14pt (18.66px), bold, centered, uppercase
        // H2: 12pt (16px), bold, uppercase, left
        // H3-H6: 12pt, bold, left
        // Margins: 1 inch = 25.4mm (Actual implementation in Shiv project)
        return `
            <style>
                .pdf-export-wrapper {
                    font-family: 'Times New Roman', serif;
                    color: #000;
                    font-size: 16px !important;       /* 12pt */
                    line-height: 1.6 !important;      /* 1.6x line spacing */
                    text-align: justify !important;
                    word-wrap: break-word !important;
                }
                .pdf-export-wrapper h1 {
                    font-size: 18.66px !important;    /* 14pt */
                    font-weight: bold !important;
                    text-align: center !important;
                    text-transform: uppercase !important;
                    margin-top: 24px !important;
                    margin-bottom: 16px !important;
                    line-height: 1.3 !important;
                }
                .pdf-export-wrapper h2 {
                    font-size: 16px !important;       /* 12pt */
                    font-weight: bold !important;
                    text-align: left !important;
                    text-transform: uppercase !important;
                    margin-top: 20px !important;
                    margin-bottom: 12px !important;
                    line-height: 1.3 !important;
                }
                .pdf-export-wrapper h3, .pdf-export-wrapper h4, 
                .pdf-export-wrapper h5, .pdf-export-wrapper h6 {
                    font-size: 16px !important;       /* 12pt */
                    font-weight: bold !important;
                    text-align: left !important;
                    margin-top: 16px !important;
                    margin-bottom: 10px !important;
                    line-height: 1.3 !important;
                }
                .pdf-export-wrapper p, .pdf-export-wrapper ul, .pdf-export-wrapper ol, .pdf-export-wrapper table {
                    margin-top: 0 !important;
                    margin-bottom: 12px !important;   /* 9pt */
                }
                .pdf-export-wrapper li {
                    margin-bottom: 4px !important;
                }
            </style>
            <div class="pdf-export-wrapper">
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

            // --- Smart Image Rescaling (Solution C) ---
            // A4 at 96 DPI: ~600px printable width, ~800px printable height.
            // Instead of a hard cap, we use an adaptive approach:
            // If the diagram only overflows by ≤15%, shrink it to fit rather than pushing to a new page.
            const MAX_PRINT_WIDTH = 600;
            const IDEAL_PRINT_HEIGHT = 500;  // Ideal max height (fits comfortably on a page)
            const ABSOLUTE_MAX_HEIGHT = 700; // Hard ceiling (allow stretch up to ~87% of page)

            // Calculate base scale to fit width
            const scaleX = MAX_PRINT_WIDTH / logicalWidth;
            let scaleY = 1;

            if (logicalHeight * Math.min(1, scaleX) > IDEAL_PRINT_HEIGHT) {
                // Diagram is taller than ideal. Check if it's within the 15% stretch zone.
                const scaledHeight = logicalHeight * Math.min(1, scaleX);
                if (scaledHeight <= ABSOLUTE_MAX_HEIGHT) {
                    // Within 15% overflow — gently shrink to fit on the current page
                    scaleY = IDEAL_PRINT_HEIGHT / logicalHeight;
                    console.log(`[Smart Rescale] Diagram (${Math.round(scaledHeight)}px) within stretch zone. Shrinking to ${IDEAL_PRINT_HEIGHT}px.`);
                } else {
                    // Too tall even with stretch — cap at absolute max
                    scaleY = ABSOLUTE_MAX_HEIGHT / logicalHeight;
                    console.log(`[Smart Rescale] Diagram (${Math.round(scaledHeight)}px) exceeds stretch zone. Capping at ${ABSOLUTE_MAX_HEIGHT}px.`);
                }
            }

            const printScale = Math.min(1, scaleX, scaleY);
            const printWidth = Math.round(logicalWidth * printScale);
            const printHeight = Math.round(logicalHeight * printScale);

            imgElement.setAttribute('width', printWidth);
            imgElement.setAttribute('height', printHeight);

            // CSS styles for PDF rendering / web preview
            imgElement.style.width = '100%';
            imgElement.style.maxWidth = `${printWidth}px`;
            imgElement.style.height = 'auto'; // Maintain aspect ratio
            imgElement.style.display = 'inline-block';
            imgElement.alt = 'Rendered Diagram';

            // Wrap in a centered, page-break-safe container
            const wrapperDiv = document.createElement('div');
            wrapperDiv.style.textAlign = 'center';
            wrapperDiv.style.margin = '0';
            wrapperDiv.style.pageBreakInside = 'avoid'; // Prevent diagram from splitting across pages
            wrapperDiv.appendChild(imgElement);

            svg.parentNode.replaceChild(wrapperDiv, svg);
        }
    }

    // 2. Export PDF (Using browser Print Layout - per Shiv Prakash format)
    // 2. Export PDF (Using Python Backend for 100% Identical Output)
    const handleExportPdf = async (e) => {
        if (e) e.preventDefault();
        
        const exportOverlay = document.getElementById('export-loading-overlay');
        
        try {
            const previewContainer = document.getElementById('formatted-preview');
            if (previewContainer.querySelector('.placeholder-text')) {
                alert("No content to export. Please format some text first.");
                return;
            }

            if (exportOverlay) exportOverlay.style.display = 'flex';
            statusText.textContent = "Preparing Document for PDF Conversion...";

            // Deep clone the preview container
            const clonedPreview = previewContainer.cloneNode(true);

            // Clean up UI artifacts
            const noExportEls = clonedPreview.querySelectorAll('.no-export');
            noExportEls.forEach(el => el.remove());
            clonedPreview.querySelectorAll('.page-number-badge, .page-break-label').forEach(el => el.remove());
            clonedPreview.querySelectorAll('.a4-page').forEach(page => {
                while (page.firstChild) page.parentNode.insertBefore(page.firstChild, page);
                page.remove();
            });

            // Convert SVGs
            await convertSvgsToImages(clonedPreview);

            statusText.textContent = "Generating Source DOCX...";
            // Generate the exact same .docx file used for Word export
            const docxBlob = await DocxExporter.generate(clonedPreview);

            statusText.textContent = "Converting to PDF via Backend...";
            const formData = new FormData();
            formData.append("file", docxBlob, "document.docx");

            // Live Render Backend URL
            const BACKEND_URL = "https://smart-text-formatter.onrender.com/api/convert-docx-to-pdf";

            // Call Python Backend
            const response = await fetch(BACKEND_URL, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            const pdfBlob = await response.blob();
            
            // Download the PDF
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'formatted_document.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            statusText.textContent = "PDF Exported Successfully ✨";
        } catch (error) {
            console.error("Critical PDF Export Error:", error);
            statusText.textContent = "Export Failed: " + (error.message || String(error));
            // Fallback to print layout if backend is down
            alert("Backend conversion failed. Falling back to Browser Print Layout.");
            window.print();
            statusText.textContent = "Fell back to Print Layout ✨";
        } finally {
            if (exportOverlay) exportOverlay.style.display = 'none';
        }
    };

    // Fetch mobile buttons since they were missing declarations in the global scope
    const mobileExportPdfBtn = document.getElementById('mobile-export-pdf');
    const mobileExportWordBtn = document.getElementById('mobile-export-word');

    if (exportPdfBtn) exportPdfBtn.addEventListener('click', handleExportPdf);
    if (mobileExportPdfBtn) mobileExportPdfBtn.addEventListener('click', handleExportPdf);

    // 3. Export Word (.doc)
    const handleExportWord = async (e) => {
        if (e) e.preventDefault();
        try {
            const previewContainer = document.getElementById('formatted-preview');
            if (previewContainer.querySelector('.placeholder-text')) {
                alert("No content to export. Please format some text first.");
                return;
            }

            statusText.textContent = "Generating Word Document...";

            // Deep clone the preview container
            const clonedPreview = previewContainer.cloneNode(true);

            // Remove any elements marked with 'no-export' (like heuristic warnings)
            const noExportEls = clonedPreview.querySelectorAll('.no-export');
            noExportEls.forEach(el => el.remove());

            // Remove pagination artifacts (page badges, break labels) from export
            clonedPreview.querySelectorAll('.page-number-badge, .page-break-label').forEach(el => el.remove());
            // Unwrap .a4-page divs so export sees flat content
            clonedPreview.querySelectorAll('.a4-page').forEach(page => {
                while (page.firstChild) {
                    page.parentNode.insertBefore(page.firstChild, page);
                }
                page.remove();
            });

            // Convert Mermaid containers on the cloned DOM
            await convertSvgsToImages(clonedPreview);

            // Detect platform: Mobile/Mac get true .docx, Desktop Windows gets HTML .doc
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isMac = /Mac/.test(navigator.userAgent) && !/Windows/.test(navigator.userAgent);

            let finalBlob, fileName;

            if (isMobile || isMac) {
                // ★ TRUE DOCX PATH — Uses DocxExporter + JSZip to generate a real OpenXML .docx
                // This creates a valid ZIP-based DOCX that Google Docs, WPS Office, and MS Word Mobile all accept.
                statusText.textContent = "Building DOCX file...";
                finalBlob = await DocxExporter.generate(clonedPreview);
                fileName = 'formatted_document.docx';
            } else {
                // ★ WINDOWS DESKTOP PATH — Uses MS Word HTML format as .doc
                // Desktop MS Word natively understands this format with full @page, mso-* CSS support.
                const tocEl = clonedPreview.querySelector('.toc-container');
                let tocHtml = '', contentHtml = '';
                if (tocEl) {
                    tocHtml = tocEl.outerHTML;
                    const contentAfterToc = clonedPreview.querySelector('.content-after-toc');
                    contentHtml = contentAfterToc ? contentAfterToc.innerHTML : clonedPreview.innerHTML.replace(tocEl.outerHTML, '');
                } else {
                    contentHtml = clonedPreview.innerHTML;
                }

                const msWordDocHtml = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head>
                        <meta charset='utf-8'>
                        <title>Exported Document</title>
                        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
                        <style>
                            @page { mso-page-orientation: portrait; size: A4; margin: 2.54cm; mso-header-margin: 1.27cm; mso-footer-margin: 1.27cm; }
                            @page TocSection { mso-footer: none; }
                            div.TocSection { page: TocSection; }
                            @page ContentSection { mso-footer: f1; mso-page-numbers-start: 1; }
                            div.ContentSection { page: ContentSection; }
                            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; text-align: justify; }
                            h1 { font-size: 14pt; text-align: center; text-transform: uppercase; page-break-after: avoid; margin-top: 18pt; margin-bottom: 12pt; }
                            h2 { font-size: 12pt; text-align: left; text-transform: uppercase; page-break-after: avoid; margin-top: 18pt; margin-bottom: 8pt; }
                            h3,h4,h5,h6 { font-size: 12pt; text-align: left; page-break-after: avoid; margin-top: 14pt; margin-bottom: 8pt; }
                            p,ul,ol,table { margin-top: 0; margin-bottom: 12pt; }
                            .keep-together, .mermaid-container, img { page-break-inside: avoid; }
                            .toc-table { width: 100%; border-collapse: collapse; }
                            .toc-table th, .toc-table td { border: 1px solid #000; padding: 6px 10px; }
                        </style>
                    </head>
                    <body>
                        ${tocHtml ? `<div class="TocSection">${tocHtml}<br clear=all style='mso-special-character:line-break;page-break-before:always'></div>` : ''}
                        <div class="ContentSection">${contentHtml}</div>
                        <div style="mso-element: footer;" id="f1">
                            <p style="text-align: center; font-size: 10pt; color: #666;">
                                <!--[if supportFields]><span style="mso-element:field-begin"></span>PAGE<span style="mso-element:field-end"></span><![endif]-->
                            </p>
                        </div>
                    </body>
                    </html>
                `;
                finalBlob = new Blob(['\ufeff', msWordDocHtml], { type: 'application/msword' });
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

    // 4. Add Page Numbers to PDF (using pdf-lib) — Feature from Shiv Prakash Research Paper
    const addPageNumbersBtn = document.getElementById('add-page-numbers-btn');
    const mobileAddPageNumbersBtn = document.getElementById('mobile-add-page-numbers');
    const pdfUploadInput = document.getElementById('pdf-upload-input');

    const triggerPdfUpload = () => {
        if (pdfUploadInput) pdfUploadInput.click();
    };

    if (addPageNumbersBtn) addPageNumbersBtn.addEventListener('click', triggerPdfUpload);
    if (mobileAddPageNumbersBtn) mobileAddPageNumbersBtn.addEventListener('click', triggerPdfUpload);

    if (pdfUploadInput) {
        pdfUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Prompt user for page numbering config
            const startPageStr = prompt("Start numbering from which page? (e.g., 2 to skip cover page)", "2");
            if (startPageStr === null) { pdfUploadInput.value = ''; return; }
            const startPage = parseInt(startPageStr) || 2;

            const startNumStr = prompt("What should the first page number be?", "1");
            if (startNumStr === null) { pdfUploadInput.value = ''; return; }
            const startNum = parseInt(startNumStr) || 1;

            statusText.textContent = "Adding page numbers...";

            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                const pages = pdfDoc.getPages();
                const font = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);

                const totalNumberedPages = pages.length - (startPage - 1);

                for (let i = startPage - 1; i < pages.length; i++) {
                    const page = pages[i];
                    const { width, height } = page.getSize();
                    const pageNum = startNum + (i - (startPage - 1));
                    const text = `${pageNum}`;
                    const textWidth = font.widthOfTextAtSize(text, 11);

                    page.drawText(text, {
                        x: (width - textWidth) / 2,
                        y: 30, // 30pt from bottom
                        size: 11,
                        font: font,
                        color: PDFLib.rgb(0.3, 0.3, 0.3),
                    });
                }

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name.replace('.pdf', '_numbered.pdf');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                statusText.textContent = "Page numbers added ✨";
                showToast(`✅ Added page numbers (${startNum}–${startNum + totalNumberedPages - 1}) starting from page ${startPage}`);
            } catch (err) {
                console.error("Page number injection error:", err);
                statusText.textContent = "Failed: " + (err.message || String(err));
                showToast("❌ Failed to add page numbers: " + err.message, true);
            }

            // Reset file input so same file can be re-selected
            pdfUploadInput.value = '';
        });
    }

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

    // --- Post-Render Lifecycle Methods ---
    async function finalizeRendering(container) {
        // Set up TOC link smooth-scroll behavior
        container.querySelectorAll('.toc-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetId = link.getAttribute('href')?.substring(1);
                if (targetId) {
                    const targetEl = container.querySelector('#' + targetId);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });

        // Render Mermaid diagrams if any exist in the output - Now with Auto-Healing!
        try {
            const mermaidEls = container.querySelectorAll('.mermaid');
            if (mermaidEls.length > 0) {
                // Keep references to loading overlay so we can show "Healing" status
                const loadingOverlay = document.getElementById('loading-overlay');
                const loadingTitle = document.getElementById('loading-title');
                const loadingProgress = document.getElementById('loading-progress');

                // Render each diagram individually to isolate errors
                for (const el of mermaidEls) {
                    let finalSvg = null;
                    let lastError = null;
                    let currentCode = el.textContent;
                    
                    // Retry loop for Mermaid Auto-Healing (max 1 retry)
                    for (let attempt = 1; attempt <= 2; attempt++) {
                        try {
                            const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
                            const { svg } = await mermaid.render(id, currentCode);
                            finalSvg = svg;
                            break; // Success! No need to heal.
                        } catch (singleErr) {
                            lastError = singleErr;
                            console.warn(`Mermaid render failed (Attempt ${attempt}/2):`, singleErr);
                            
                            // Auto-Healing Phase: Try to fix it on the first failure via Gemini AI
                            if (attempt === 1) {
                                if (loadingOverlay) loadingOverlay.style.display = 'flex';
                                let originalTitle = "";
                                let originalProgress = "";

                                if (loadingTitle && loadingProgress) {
                                    originalTitle = loadingTitle.textContent;
                                    originalProgress = loadingProgress.textContent;
                                    loadingTitle.textContent = "Auto-Healing Diagram...";
                                    loadingProgress.textContent = "Mermaid threw a syntax error. Instructing Gemini to fix it...";
                                }

                                try {
                                    const healer = new window.AIFormatter();
                                    currentCode = await healer.fixMermaid(currentCode, lastError.message || String(lastError));
                                    console.log("Received healed Mermaid code:", currentCode);
                                } catch (healErr) {
                                    console.error("Mermaid Auto-Heal strictly failed.", healErr);
                                    break;
                                } finally {
                                    if (loadingTitle && loadingProgress) {
                                        loadingTitle.textContent = originalTitle;
                                        loadingProgress.textContent = originalProgress;
                                    }
                                    if (loadingOverlay) loadingOverlay.style.display = 'none';
                                }
                            }
                        }
                    }

                    if (finalSvg) {
                        el.innerHTML = finalSvg;
                    } else {
                        el.innerHTML = `<pre style="background:#fff3cd; padding:12px; border:1px solid #ffc107; border-radius:6px; white-space:pre-wrap; font-family:monospace; font-size:0.85rem; color:#856404;">⚠️ Diagram could not be rendered, even after auto-healing.\n\nError: ${lastError?.message || "Syntax Error"}\n\n${currentCode}</pre>`;
                    }
                }
            }
        } catch (mermaidErr) {
            console.warn("Mermaid rendering error:", mermaidErr);
        }

        // Calculate accurate TOC page numbers now that all content/diagram heights are settled
        await calculateAccurateTOC(container);

        // Run A4 Pagination Engine — split content into discrete A4 pages
        if (typeof window.paginatePreview === 'function') {
            setTimeout(() => window.paginatePreview(), 120);
        }
    }

    async function calculateAccurateTOC(container) {
        const tocCells = container.querySelectorAll('.toc-page-num');
        if (tocCells.length === 0) return;

        console.log("Dynamically calculating TOC offsets for exported document...");

        // Create an invisible measurement wrapper matching PDF bounds
        const measureWrapper = document.createElement('div');
        measureWrapper.style.position = 'absolute';
        measureWrapper.style.top = '-9999px';
        measureWrapper.style.left = '-9999px';
        measureWrapper.style.visibility = 'hidden';
        measureWrapper.style.width = '210mm'; // A4 width
        measureWrapper.style.padding = '25.4mm'; // 1-inch export margins
        measureWrapper.style.boxSizing = 'border-box';
        measureWrapper.style.fontFamily = "'Times New Roman', serif";
        measureWrapper.style.fontSize = "11pt";
        measureWrapper.style.lineHeight = "1.5";
        
        // Clone into standard wrapper
        measureWrapper.innerHTML = container.innerHTML;
        document.body.appendChild(measureWrapper);

        // Available content height per page: A4 = 297mm - 25.4mm top - 25.4mm bottom = 246.2mm
        const pageMeasurement = document.createElement('div');
        pageMeasurement.style.height = '246.2mm'; 
        measureWrapper.appendChild(pageMeasurement);

        // Let the browser paint to settle layout metrics
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const pixelsPerPage = pageMeasurement.offsetHeight || 930; // Use 930px approx as fallback for 246.2mm
        const wrapperRect = measureWrapper.getBoundingClientRect();
        const contentContainer = measureWrapper.querySelector('.content-after-toc');

        if (contentContainer) {
            // Measure offset from start of actual content (ignoring the TOC height itself)
            const contentStartTop = contentContainer.getBoundingClientRect().top;

            measureWrapper.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                const targetId = heading.getAttribute('id');
                if (targetId && heading.closest('.content-after-toc')) {
                    const headingRect = heading.getBoundingClientRect();
                    // Offset relative to where the content actually starts
                    const offset = headingRect.top - contentStartTop;
                    
                    if (offset >= 0) {
                        const pageNum = Math.floor(offset / pixelsPerPage) + 1;
                        
                        // Update the real visible DOM cell
                        const realCell = container.querySelector(`.toc-page-num[data-target-id="${targetId}"]`);
                        if (realCell) {
                            realCell.textContent = pageNum;
                        }
                    }
                }
            });
        }

        document.body.removeChild(measureWrapper);
    }
    
    // --- Global Utility Functions ---
    window.copyCodeToClipboard = function(btn) {
        const wrapper = btn.closest('.code-block-wrapper');
        if (!wrapper) return;
        const codeEl = wrapper.querySelector('code');
        if (!codeEl) return;
        
        const textToCopy = codeEl.innerText || codeEl.textContent;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copied!';
            btn.style.color = '#46de7eff';
            btn.style.borderColor = '#4ade80';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.color = '#e2e8f0';
                btn.style.borderColor = '#718096';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code: ', err);
            btn.innerHTML = '❌ Error';
        });
    };


    // ==========================================================================
    // Auto-Save & Document Library Logic
    // ==========================================================================

    const documentTitleInput = document.getElementById("document-title");
    const saveStatus = document.getElementById("save-status");
    const newDocBtn = document.getElementById("new-doc-btn");
    const documentList = document.getElementById("document-list");
    const formattedPreview = document.getElementById("formatted-preview");

    rawInput.addEventListener("input", debouncedAutoSave);
    formattedPreview.addEventListener("input", debouncedAutoSave);
    if(documentTitleInput) documentTitleInput.addEventListener("input", debouncedAutoSave);

    if (newDocBtn) {
        newDocBtn.addEventListener("click", () => {
            createNewDocument();
            closeMenuBtn && closeMenuBtn.click();
        });
    }

    function debouncedAutoSave() {
        if (isInitialLoad) return;
        if (saveStatus) {
            saveStatus.textContent = "Saving...";
            saveStatus.classList.add("visible");
        }
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(performSave, 1500);
    }

    async function performSave() {
        if (!window.appDB) return;
        const rawText = rawInput.value;
        const formattedHtml = formattedPreview.innerHTML;
        let title = documentTitleInput ? documentTitleInput.value.trim() : "";
        
        if ((!title || title === "Untitled Document") && rawText.trim().length > 0) {
            const firstLine = rawText.trim().split("\n")[0];
            if (firstLine.length > 0) {
                title = firstLine.substring(0, 30);
                if (firstLine.length > 30) title += "...";
                if(documentTitleInput) documentTitleInput.value = title;
            } else {
                title = "Untitled Document";
            }
        } else if (!title) {
            title = "Untitled Document";
            if(documentTitleInput) documentTitleInput.value = title;
        }

        const doc = {
            id: currentDocumentId,
            title: title,
            rawText: rawText,
            formattedHtml: formattedHtml,
            images: window.appUploadedImages || [],
            captionEnabled: window.appImageCaptionEnabled || false,
            templateId: window.templateEngine?.selectedTemplateId || 'general',
            updatedAt: Date.now()
        };

        try {
            await window.appDB.saveDocument(doc);
            if (saveStatus) {
                saveStatus.textContent = "Saved to device";
                setTimeout(() => {
                    if (saveStatus.textContent === "Saved to device") {
                        saveStatus.classList.remove("visible");
                    }
                }, 3000);
            }
            renderDocumentList();
        } catch (e) {
            console.error("Save failed:", e);
            if (saveStatus) {
                saveStatus.textContent = "Save failed";
                saveStatus.style.color = "#e53e3e";
            }
        }
    }

    function createNewDocument() {
        currentDocumentId = Date.now().toString();
        rawInput.value = "";
        formattedPreview.innerHTML = "";
        if(documentTitleInput) documentTitleInput.value = "Untitled Document";
        window.appUploadedImages = [];
        window.appImageCaptionEnabled = false;
        if(window.templateEngine) window.templateEngine.selectTemplate('general');
        if(window.referenceHandler) window.referenceHandler.clear();
        hasFormattedOnce = false;
        
        const ribbonControls = document.querySelectorAll(".formatting-ribbon select, .formatting-ribbon input");
        ribbonControls.forEach(control => {
            control.disabled = false;
            control.style.opacity = "1";
            control.style.cursor = "default";
            if (control.type === "checkbox" && control.parentElement) {
                control.parentElement.style.opacity = "1";
                control.parentElement.style.cursor = "pointer";
            }
        });
        
        if (saveStatus) saveStatus.classList.remove("visible");
    }

    async function renderDocumentList() {
        if (!window.appDB || !documentList) return;
        try {
            const docs = await window.appDB.getAllDocuments();
            documentList.innerHTML = "";
            if (docs.length === 0) {
                documentList.innerHTML = `<p style="font-size:12px; color:var(--text-muted); text-align:center; padding: 20px 0;">No saved documents.</p>`;
                return;
            }
            docs.forEach(doc => {
                const dateStr = new Date(doc.updatedAt).toLocaleString();
                const item = document.createElement("div");
                item.className = "doc-item";
                if (doc.id === currentDocumentId) {
                    item.style.borderColor = "var(--primary-color)";
                    item.style.background = "#ebf8ff";
                }
                const info = document.createElement("div");
                info.className = "doc-info";
                info.innerHTML = `
                    <div class="doc-title">${doc.title || "Untitled Document"}</div>
                    <div class="doc-date">${dateStr}</div>
                    <div class="doc-snippet">${doc.snippet}</div>
                `;
                info.onclick = () => loadDocument(doc.id);
                
                const delBtn = document.createElement("button");
                delBtn.className = "doc-delete-btn";
                delBtn.title = "Delete Document";
                delBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                `;
                delBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                        await window.appDB.deleteDocument(doc.id);
                        if (doc.id === currentDocumentId) createNewDocument();
                        else renderDocumentList();
                    }
                };
                item.appendChild(info);
                item.appendChild(delBtn);
                documentList.appendChild(item);
            });
        } catch (e) {
            console.error("Error loading document list:", e);
        }
    }

    async function loadDocument(id) {
        if (!window.appDB) return;
        try {
            const doc = await window.appDB.getDocument(id);
            if (doc) {
                isInitialLoad = true;
                currentDocumentId = doc.id;
                rawInput.value = doc.rawText || "";
                formattedPreview.innerHTML = doc.formattedHtml || "";
                if(documentTitleInput) documentTitleInput.value = doc.title || "Untitled Document";
                window.appUploadedImages = doc.images || [];
                window.appImageCaptionEnabled = doc.captionEnabled || false;
                if(doc.templateId && window.templateEngine) {
                    window.templateEngine.selectTemplate(doc.templateId);
                } else if(window.templateEngine) {
                    window.templateEngine.selectTemplate('general');
                }
                hasFormattedOnce = !!(doc.formattedHtml && doc.formattedHtml.length > 0);
                isInitialLoad = false;
                
                if (saveStatus) {
                    saveStatus.textContent = "Loaded";
                    saveStatus.classList.add("visible");
                    setTimeout(() => saveStatus.classList.remove("visible"), 2000);
                }
                renderDocumentList();
                closeMenuBtn && closeMenuBtn.click();
            }
        } catch (e) {
            console.error("Error loading document:", e);
            showToast("Error loading document.", "error");
        }
    }

    setTimeout(async () => {
        if (window.appDB) {
            await renderDocumentList();
            // Start with a fresh document on refresh
            createNewDocument();
            isInitialLoad = false;
        }
    }, 500);

    // ==========================================================================
    // A4 Pagination Engine — Idea 1 + Idea 2 Combined
    // Splits formatted content into real discrete A4 pages in the preview.
    // ==========================================================================

    // Height of one A4 page content area in pixels (297mm - 2 × 25.4mm padding = 246.2mm)
    // We measure this at runtime from a real .a4-page element for accuracy.
    let _a4ContentHeightPx = null;

    function getA4ContentHeightPx() {
        if (_a4ContentHeightPx) return _a4ContentHeightPx;
        // Create a temporary page to measure actual browser rendering of 297mm - 2*25.4mm
        const probe = document.createElement('div');
        probe.className = 'a4-page';
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.top = '-9999px';
        document.body.appendChild(probe);
        const totalH = probe.offsetHeight;           // full page height in px
        const style = window.getComputedStyle(probe);
        const padTop = parseFloat(style.paddingTop) || 0;
        const padBot = parseFloat(style.paddingBottom) || 0;
        document.body.removeChild(probe);
        _a4ContentHeightPx = totalH - padTop - padBot;
        return _a4ContentHeightPx;
    }

    /**
     * paginatePreview()
     * Reads all block children of #formatted-preview, packs them into
     * .a4-page divs (one per printed page), and re-inserts the pages
     * back into the preview container. Adds a page-number badge per page.
     *
     * Idea 2 (Overflow Detector): After filling each page, the function
     * checks if the last added element caused overflow and rolls it back
     * to the next page if so.
     */
    function paginatePreview() {
        const container = document.getElementById('formatted-preview');
        if (!container) return;

        // --- SAVE CARET POSITION ---
        const sel = window.getSelection();
        let savedCaret = false;
        if (sel.rangeCount > 0 && container.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            const marker = document.createElement('span');
            marker.id = 'sf-caret-marker';
            marker.style.position = 'absolute';
            marker.style.opacity = '0';
            
            const r = range.cloneRange();
            r.collapse(false);
            r.insertNode(marker);
            savedCaret = true;
        }

        // Collect all real block children (skip .a4-page wrappers from a previous pass)
        const allChildren = [];
        container.querySelectorAll('.a4-page').forEach(page => {
            page.childNodes.forEach(child => {
                if (child.nodeType === 1 && child.classList.contains('page-number-badge')) return;
                allChildren.push(child.cloneNode(true));
            });
        });

        // If nothing has been paginated yet, pull direct children
        if (allChildren.length === 0) {
            container.childNodes.forEach(child => {
                if (child.nodeType === 1 || (child.nodeType === 3 && child.textContent.trim())) {
                    allChildren.push(child.cloneNode(true));
                }
            });
        }

        if (allChildren.length === 0) return; // Nothing to paginate

        const maxH = getA4ContentHeightPx();
        container.innerHTML = ''; // Clear

        let pageNum = 1;
        let currentPage = createNewA4Page(pageNum);
        container.appendChild(currentPage);

        for (let i = 0; i < allChildren.length; i++) {
            const child = allChildren[i];
            currentPage.appendChild(child);

            // IDEA 2 — Bulletproof Geometric Overflow Detector using getBoundingClientRect
            let measureEl = child;
            if (child.nodeType !== 1) { // If it's a text node or comment
                if (child.nodeType === 3 && !child.textContent.trim()) {
                    continue; // Skip empty text nodes from triggering overflow
                }
                const wrapper = document.createElement('span');
                currentPage.replaceChild(wrapper, child);
                wrapper.appendChild(child);
                measureEl = wrapper;
            }

            const pageStyle = window.getComputedStyle(currentPage);
            const padTop = parseFloat(pageStyle.paddingTop) || 96; // Fallback to 25.4mm
            const safeBottomLimit = padTop + maxH;

            // Get absolute screen coordinates
            const pageRect = currentPage.getBoundingClientRect();
            const childRect = measureEl.getBoundingClientRect();
            
            // Calculate child's bottom relative to the page's top
            const childRelativeBottom = (childRect.bottom - pageRect.top);
            
            const overflow = childRelativeBottom - safeBottomLimit;
            
            // Check if there are other content elements on this page.
            const isFirstContentElement = currentPage.childNodes.length <= 2;

            if (overflow > 2 && !isFirstContentElement) { // 2px tolerance
                // Roll it back — move the element to a new page
                currentPage.removeChild(child);

                // --- KEEP WITH NEXT (Orphan Heading Prevention) ---
                const elementsToMove = [child];
                let prev = currentPage.lastElementChild;
                let attempts = 0;
                // If the last element on the page is a heading, pull it to the next page too!
                // But NEVER pull it if it's the ONLY content element left on the page (prevent empty pages)
                while (prev && prev.tagName && prev.tagName.match(/^H[1-6]$/i) && attempts < 3 && currentPage.childNodes.length > 2) {
                    currentPage.removeChild(prev);
                    elementsToMove.unshift(prev);
                    prev = currentPage.lastElementChild;
                    attempts++;
                }

                // Add page separator + new page
                const label = document.createElement('div');
                label.className = 'page-break-label';
                label.textContent = `— Page ${pageNum + 1} —`;
                container.appendChild(label);

                pageNum++;
                currentPage = createNewA4Page(pageNum);
                container.appendChild(currentPage);
                
                // Append all moved elements to the new page
                elementsToMove.forEach(el => currentPage.appendChild(el));
            }
        }

        // Attach input listeners to each page for Idea 1 (debounced re-pagination on edit)
        attachPageEditListeners(container);

        // --- RESTORE CARET POSITION ---
        if (savedCaret) {
            const marker = document.getElementById('sf-caret-marker');
            if (marker) {
                const newSel = window.getSelection();
                const newRange = document.createRange();
                newRange.setStartBefore(marker);
                newRange.collapse(true);
                newSel.removeAllRanges();
                newSel.addRange(newRange);
                marker.parentNode.removeChild(marker);
                
                // Ensure the cursor is visible
                if (marker.scrollIntoViewIfNeeded) {
                    marker.scrollIntoViewIfNeeded();
                }
            }
        }
    }

    function createNewA4Page(num) {
        const page = document.createElement('div');
        page.className = 'a4-page';
        if (window.isCustomizationActive) {
            page.setAttribute('contenteditable', 'true');
        }
        // Page number badge
        const badge = document.createElement('span');
        badge.className = 'page-number-badge';
        badge.textContent = `Page ${num}`;
        page.appendChild(badge);
        return page;
    }

    // IDEA 1 — Re-Paginate on Every Input (debounced 400ms)
    let _repaginateTimer = null;
    function debouncedRepaginate() {
        clearTimeout(_repaginateTimer);
        _repaginateTimer = setTimeout(() => {
            // Collect current content from all pages before re-paginating
            const container = document.getElementById('formatted-preview');
            if (!container) return;
            paginatePreview();
        }, 400);
    }

    function attachPageEditListeners(container) {
        container.querySelectorAll('.a4-page').forEach(page => {
            // Remove old listener before re-attaching (prevent duplicates)
            page.removeEventListener('input', debouncedRepaginate);
            page.addEventListener('input', debouncedRepaginate);
        });
    }

    // Hook paginatePreview into the existing customization toggle
    // When "Edit" is enabled, pages become editable; when "Done", re-paginate
    if (customizeBtn) {
        const _origCustomizeBtnHandler = customizeBtn.onclick;
        customizeBtn.addEventListener('click', () => {
            const isActive = window.isCustomizationActive;
            const container = document.getElementById('formatted-preview');
            if (!container) return;
            const pages = container.querySelectorAll('.a4-page');

            if (isActive) {
                // Just turned ON editing — make pages editable
                pages.forEach(p => p.setAttribute('contenteditable', 'true'));
                // Re-attach listeners
                attachPageEditListeners(container);
            } else {
                // Just turned OFF editing — make pages read-only and re-paginate
                pages.forEach(p => {
                    p.setAttribute('contenteditable', 'false');
                });
                paginatePreview(); // Refresh pagination after edits
            }
        });
    }

    // Expose globally so finalizeRendering can call it after AI formatting
    window.paginatePreview = paginatePreview;

});
