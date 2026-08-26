/**
 * outputGenerator.js
 * Responsible for rendering the StyledElements array into final HTML.
 */

class OutputGenerator {

    /**
     * Generates a final HTML string from processed and styled elements.
     * Now includes Smart Alerts for Missing/Bonus Sections when a structured template is used.
     * @param {Array<Object>} styledElements 
     * @returns {string} Clean HTML string
     */
    generateHTML(styledElements) {
        if (!styledElements || styledElements.length === 0) return '';

        // --- SMART ALERTS: Compute Missing & Bonus Sections ---
        const alertsHtml = this._generateSmartAlerts(styledElements);
        const htmlParts = [];
        let i = 0;

        while (i < styledElements.length) {
            const element = styledElements[i];
            const tag = element.type;
            const inlineStyle = element.style || element.styleString || '';
            const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

            // ── NEW: heading type with depth ──
            if (tag === 'heading') {
                const depth = parseInt(element.depth, 10) || 1;
                const hTag = depth === 1 ? 'h1' : depth === 2 ? 'h2' : 'h3';
                let content = this._cleanMarkdown(this._escapeHTML(element.content || ''));
                content = content.replace(/<\/?b>/g, '').replace(/<\/?i>/g, '');
                htmlParts.push(`<${hTag}${styleAttr}>${content}</${hTag}>`);
                i++;
                continue;
            }

            // ── NEW: table type ──
            if (tag === 'table') {
                const caption = element.caption ? `<caption style="caption-side:top;text-align:left;font-style:italic;font-size:0.9em;margin-bottom:6px;color:#555;">${this._escapeHTML(element.caption)}</caption>` : '';
                const headers = Array.isArray(element.headers) ? element.headers : [];
                const rows = Array.isArray(element.rows) ? element.rows : [];
                const theadHtml = headers.length > 0
                    ? `<thead><tr>${headers.map(h => `<th style="border:1px solid #ccc;padding:8px 12px;background:#f0f4f8;font-weight:bold;text-align:left;">${this._escapeHTML(String(h))}</th>`).join('')}</tr></thead>`
                    : '';
                const tbodyHtml = rows.length > 0
                    ? `<tbody>${rows.map(row => `<tr>${(Array.isArray(row) ? row : []).map((cell, ci) => `<td style="border:1px solid #ccc;padding:8px 12px;${ci === 0 ? 'font-weight:500;' : ''}">${this._escapeHTML(String(cell))}</td>`).join('')}</tr>`).join('')}</tbody>`
                    : '';
                htmlParts.push(`<table class="formatted-table" style="border-collapse:collapse;width:100%;margin:14px 0;">${caption}${theadHtml}${tbodyHtml}</table>`);
                i++;
                continue;
            }

            // ── NEW: equation type ──
            if (tag === 'equation') {
                const eqContent = element.content || '';
                // Render with KaTeX if available, otherwise fallback to code block
                if (window.katex) {
                    try {
                        const rendered = window.katex.renderToString(eqContent, { throwOnError: false, displayMode: true });
                        htmlParts.push(`<div class="equation-block" style="text-align:center;margin:16px 0;padding:12px;background:#f9f9fc;border-left:3px solid #7c6af7;border-radius:4px;overflow-x:auto;">${rendered}</div>`);
                    } catch(e) {
                        htmlParts.push(`<pre class="equation-block" style="text-align:center;margin:16px 0;padding:12px;background:#f9f9fc;border-left:3px solid #7c6af7;border-radius:4px;font-family:monospace;">${this._escapeHTML(eqContent)}</pre>`);
                    }
                } else {
                    htmlParts.push(`<pre class="equation-block" style="text-align:center;margin:16px 0;padding:12px;background:#f9f9fc;border-left:3px solid #7c6af7;border-radius:4px;font-family:monospace;">${this._escapeHTML(eqContent)}</pre>`);
                }
                i++;
                continue;
            }

            // ── NEW: blockquote type ──
            if (tag === 'blockquote') {
                const bqContent = this._cleanMarkdown(this._escapeHTML(element.content || ''));
                const attribution = element.attribution ? `<footer style="margin-top:8px;font-size:0.9em;color:#666;">— ${this._escapeHTML(element.attribution)}</footer>` : '';
                htmlParts.push(`<blockquote style="border-left:4px solid #7c6af7;margin:16px 0;padding:12px 20px;background:#f9f9fc;border-radius:0 4px 4px 0;font-style:italic;color:#444;">${bqContent}${attribution}</blockquote>`);
                i++;
                continue;
            }

            // ── NEW: references type ──
            if (tag === 'references') {
                const refItems = Array.isArray(element.items) ? element.items : [];
                const refHtml = refItems.map(ref => {
                    const id = this._escapeHTML(String(ref.id || ''));
                    const text = this._cleanMarkdown(this._escapeHTML(String(ref.text || '')));
                    return `<li style="margin-bottom:6px;"><span style="font-weight:bold;">[${id}]</span> ${text}</li>`;
                }).join('');
                htmlParts.push(`<div class="references-block"><ol style="list-style:none;padding-left:0;margin:8px 0;">${refHtml}</ol></div>`);
                i++;
                continue;
            }

            // ── NEW: warning type ──
            if (tag === 'warning') {
                const warnContent = this._escapeHTML(element.content || '');
                htmlParts.push(`<div class="doc-warning" style="background:#fff3cd;border:1px solid #ffc107;border-left:4px solid #ff9800;border-radius:4px;padding:12px 16px;margin:14px 0;color:#856404;">⚠️ ${warnContent}</div>`);
                i++;
                continue;
            }

            // ── NEW: missing type ──
            if (tag === 'missing') {
                const sectionName = this._escapeHTML(element.section || 'Unknown Section');
                const sectionId = this._escapeHTML(element.id || '');
                const reason = this._escapeHTML(element.reason || 'The AI could not find information for this required section in your text.');
                const cardId = 'missing-card-' + Math.random().toString(36).substr(2, 9);
                
                htmlParts.push(`
                    <div id="${cardId}" class="missing-section-card no-print" data-section="${sectionName}" data-section-id="${sectionId}">
                        <div class="missing-header">
                            <h4>⚠️ Missing Section: ${sectionName}</h4>
                        </div>
                        <p class="missing-reason">${reason}</p>
                        <textarea class="missing-section-hint" placeholder="Type a hint or short text here for the AI to generate this section..."></textarea>
                        <div class="missing-actions">
                            <button class="btn-retry-section" onclick="window.retryMissingSection('${cardId}', '${sectionId}', '${sectionName}', this)">Generate Section</button>
                            <button class="btn-skip-section" onclick="document.getElementById('${cardId}').remove()">Skip</button>
                        </div>
                    </div>
                `);
                i++;
                continue;
            }

            // ── NEW: info type ──
            if (tag === 'info') {
                const infoContent = this._escapeHTML(element.content || '');
                htmlParts.push(`<div class="doc-info" style="background:#e8f4fd;border:1px solid #90caf9;border-left:4px solid #2196f3;border-radius:4px;padding:12px 16px;margin:14px 0;color:#0d47a1;">ℹ️ ${infoContent}</div>`);
                i++;
                continue;
            }

            // Handle lists differently because they contain sub-items
            if (tag === 'ul' || tag === 'ol') {
                let listItems = [];
                if (Array.isArray(element.items)) {
                    listItems = element.items;
                } else if (typeof element.content === 'string') {
                    listItems = element.content.split('\n');
                }

                const listItemsHTML = listItems
                    .map(item => {
                        let text = '';
                        if (typeof item === 'string') {
                            text = item;
                        } else if (item !== null && typeof item === 'object') {
                            text = item.text || item.content || item.value || JSON.stringify(item);
                        } else {
                            text = String(item || '');
                        }
                        let cleanItem = text.trim().replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
                        return `<li${styleAttr}>${this._cleanMarkdown(this._escapeHTML(cleanItem))}</li>`;
                    })
                    .join('\n');

                htmlParts.push(`<${tag}${styleAttr}>\n${listItemsHTML}\n</${tag}>`);
                i++;
                continue;
            }

            // Handle Mermaid diagram blocks
            if (tag === 'mermaid') {
                const lightboxStyle = `page-break-inside: avoid; background-color: #fcfcfc; border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; margin: 18pt 0 12pt 0; box-shadow: 0 2px 5px rgba(0,0,0,0.03); text-align: center;`;
                htmlParts.push(`<div class="mermaid-container" style="${lightboxStyle}"><pre class="mermaid">${element.content || ''}</pre></div>`);
                i++;
                continue;
            }

            // Handle raw HTML blocks (e.g., converted markdown tables)
            if (tag === 'html') {
                htmlParts.push(element.content || '');
                i++;
                continue;
            }

            // Handle injected Multimodal Images
            if (tag === 'image') {
                const imgIndex = parseInt(element.content, 10);
                if (!isNaN(imgIndex) && window.appUploadedImages && window.appUploadedImages[imgIndex]) {
                    const imgData = window.appUploadedImages[imgIndex].dataUrl;
                    const autoCaption = window.appImageCaptionEnabled ? `<p style="text-align: center; color: #666; font-size: 10pt; margin-top: 8px;"><i>Figure ${imgIndex + 1}</i></p>` : '';
                    htmlParts.push(`
                        <div class="ai-image-wrapper" contenteditable="false" style="page-break-inside: avoid; text-align: center; margin: 30px 0;">
                            <img src="${imgData}" style="max-height: 400px; width: auto; max-width: 60%; border-radius: 4px; border: 1px solid #ccc; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: inline-block;" />
                            ${autoCaption}
                        </div>
                    `);
                }
                i++;
                continue;
            }

            // Normal elements (Headings, Paragraphs)
            let content;
            if (tag === 'code') {
                // Do NOT clean markdown or strip spaces/newlines for code blocks!
                content = this._escapeHTML(element.content || '');
            } else {
                content = this._cleanMarkdown(this._escapeHTML(element.content || ''));
                
                if (tag === 'p') {
                    content = content.replace(/-\n/g, '').replace(/\n/g, ' ');
                }

                // Clean markdown from headings too (backward-compat for old types)
                if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'sub-subheading') {
                    content = content.replace(/<\/?b>/g, '').replace(/<\/?i>/g, '');
                }
            }

            // Custom tag rendering for sub-subheadings and code blocks
            let thisHtml;
            if (tag === 'code') {
                thisHtml = `
                    <div class="code-block-wrapper">
                        <div class="code-block-header no-export">
                            <span>Code Snippet</span>
                            <button class="copy-code-btn" onclick="copyCodeToClipboard(this)">📋 Copy</button>
                        </div>
                        <pre><code${styleAttr}>${content}</code></pre>
                    </div>
                `;
            } else if (tag === 'sub-subheading') {
                thisHtml = `<div${styleAttr}>${content}</div>`;
            } else {
                thisHtml = `<${tag}${styleAttr}>${content}</${tag}>`;
            }

            // --- KEEP-WITH-NEXT: Group heading/label with its following diagram ---
            // If this is a heading (h1-h6) or a short paragraph (label), and the NEXT element is a mermaid diagram or table,
            // wrap both inside a container with `page-break-inside: avoid` so they stay on the same page.
            const isHeadingOrLabel = 
                (tag.match(/^h[1-6]$/) !== null) || 
                (tag === 'heading') ||
                (tag === 'sub-subheading') || 
                (tag === 'p' && content && content.length < 150);
            
            const nextEl = i + 1 < styledElements.length ? styledElements[i + 1] : null;
            const nextIsDiagram = nextEl && (nextEl.type === 'mermaid' || nextEl.type === 'html');

            if (isHeadingOrLabel && nextIsDiagram) {
                // Build the next element's HTML
                let nextHtml = '';
                if (nextEl.type === 'mermaid') {
                    const lightboxStyle = `page-break-inside: avoid; background-color: #fcfcfc; border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; margin: 18pt 0 12pt 0; box-shadow: 0 2px 5px rgba(0,0,0,0.03); text-align: center;`;
                    nextHtml = `<div class="mermaid-container" style="${lightboxStyle}"><pre class="mermaid">${nextEl.content || ''}</pre></div>`;
                } else {
                    nextHtml = nextEl.content || '';
                }

                // Wrap heading + diagram in a keep-together group
                htmlParts.push(`<div class="keep-together" style="page-break-inside: avoid;">\n${thisHtml}\n${nextHtml}\n</div>`);
                i += 2; // Skip the next element since we already consumed it
                continue;
            }

            htmlParts.push(thisHtml);
            i++;
        }

        return alertsHtml + htmlParts.filter(html => html !== '').join('\n\n');
    }

    /**
     * Converts markdown-style formatting to HTML and removes unwanted artifacts.
     * Runs AFTER _escapeHTML so the raw text is safe, then we inject formatting tags.
     * @param {string} str - HTML-escaped string
     * @returns {string} Cleaned string with markdown converted to HTML
     */
    _cleanMarkdown(str) {
        return str
            // Convert **bold** to <b>bold</b> (must come before single *)
            .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
            // Convert *italic* to <i>italic</i>
            .replace(/\*(.+?)\*/g, '<i>$1</i>')
            // Remove leftover standalone ** or * markers
            .replace(/\*{2,}/g, '')
            .replace(/(?<!\w)\*(?!\w)/g, '')
            // Remove markdown heading markers (# ## ###) that leaked into content
            .replace(/^#{1,6}\s+/gm, '')
            // Remove reference markers like [1], [2], etc.
            .replace(/\s*\[\d+\]/g, '')
            // Remove markdown link syntax artifacts [text](url) -> text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove common conversational AI filler intro/outros that ChatGPT/Gemini outputs
            .replace(/^(Here is|Here's|Below is|Sure, here is)(.+?)(diagram|chart|flowchart|table|code|format)[.:]\s*/i, '')
            .replace(/^(Certainly!|Sure!|Of course!)\s*/i, '')
            // Clean up multiple spaces
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    /**
     * Prevent XSS inside the preview by escaping basic HTML characters 
     * before rendering.
     * @param {string} str 
     * @returns {string} Escaped string
     */
    _escapeHTML(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Generates Smart Alert banners for Missing and Bonus sections.
     * Only active when a structured template (non-General) is selected.
     * All alerts have class 'no-export no-print' so they don't appear in PDF/Word.
     */
    _generateSmartAlerts(styledElements) {
        // Skip alerts for General template or if templateEngine is not available
        if (!window.templateEngine) return '';
        const template = window.templateEngine.getSelectedTemplate();
        if (!template || template.id === 'general' || !template.skeleton || template.skeleton.length === 0) return '';

        const skeleton = template.skeleton;
        const skeletonIds = skeleton.map(s => s.id);

        // Collect template_ids returned by the AI from the flattened blocks
        const returnedIds = new Set();
        let bonusSections = [];
        
        for (const el of styledElements) {
            if (el._template_id) {
                if (el._template_id === 'title' || (el.type === 'heading' && el.depth === 1)) {
                    returnedIds.add('title');
                    continue; // Document title is recorded, not a bonus section
                }
                if (el._template_id === 'none') {
                    if (el.content && !bonusSections.includes(el.content)) {
                        bonusSections.push(el.content);
                    }
                } else {
                    returnedIds.add(el._template_id);
                }
            }
        }

        // Also check window._lastDocumentSections (raw structured data) for more accuracy
        if (window._lastDocumentSections && Array.isArray(window._lastDocumentSections)) {
            for (let i = 0; i < window._lastDocumentSections.length; i++) {
                const section = window._lastDocumentSections[i];
                if (section.is_title || section.template_id === 'title' || (i === 0 && (!section.blocks || section.blocks.length === 0))) {
                    if (section.heading_title || section.title || (section.blocks && section.blocks.length > 0)) {
                        returnedIds.add('title');
                    }
                    continue; // Title section handled
                }
                if (section.template_id && section.template_id !== 'none') {
                    returnedIds.add(section.template_id);
                } else if (section.template_id === 'none' || !section.template_id) {
                    if (section.heading_title && !bonusSections.includes(section.heading_title)) {
                        bonusSections.push(section.heading_title);
                    }
                }
            }
        }

        // Check if global documentTitle exists
        if (window._documentTitle && window._documentTitle.trim() && window._documentTitle !== 'Untitled Document') {
            returnedIds.add('title');
        }

        // --- GENERALIZED FUZZY & ALIAS MATCHER ---
        // If the AI marked a section as "none" but its heading title semantically matches a skeleton section,
        // map it automatically so we never produce false "missing" or false "bonus" alerts.
        for (const s of skeleton) {
            if (returnedIds.has(s.id)) continue;
            
            const matchedBonusIdx = bonusSections.findIndex(title => {
                if (!title) return false;
                const clean = title.toLowerCase().replace(/^\d+(\.\d+)*\.\s*/, '').trim();
                const label = s.label.toLowerCase();
                if (clean === label || clean.includes(label) || label.includes(clean)) return true;
                if (Array.isArray(s.aliases)) {
                    for (const alias of s.aliases) {
                        const cleanAlias = alias.toLowerCase();
                        if (clean === cleanAlias || clean.includes(cleanAlias) || cleanAlias.includes(clean)) return true;
                    }
                }
                return false;
            });

            if (matchedBonusIdx !== -1) {
                returnedIds.add(s.id);
                bonusSections.splice(matchedBonusIdx, 1);
            }
        }

        // Compute missing sections in two categories
        const missingRequired = skeleton.filter(s => s.required && !returnedIds.has(s.id));
        const missingOptional = skeleton.filter(s => !s.required && !returnedIds.has(s.id));

        let alertsHtml = '';

        // --- RED: Missing Required Sections Alert ---
        if (missingRequired.length > 0) {
            const missingCards = missingRequired.map(s => {
                const cardId = 'smart-missing-' + s.id;
                return `
                <div id="${cardId}" class="smart-alert-card smart-alert-missing no-export no-print" data-section-id="${s.id}" data-section-name="${s.label}">
                    <div class="smart-alert-icon">⚠️</div>
                    <div class="smart-alert-body">
                        <strong>Missing Required Section: ${s.label}</strong>
                        <p class="smart-alert-desc">This mandatory section is missing from your text.</p>
                        <div class="smart-alert-actions">
                            <button class="btn-paste-format" onclick="window._smartAlertPasteFormat('${cardId}', '${s.id}', '${s.label}')">📝 Paste & Format</button>
                            <button class="btn-auto-generate" onclick="window._smartAlertAutoGenerate('${cardId}', '${s.id}', '${s.label}')">✨ Auto-Generate</button>
                            <button class="btn-skip-alert" onclick="document.getElementById('${cardId}').remove()">✕ Skip</button>
                        </div>
                        <textarea class="smart-alert-textarea" id="textarea-${cardId}" placeholder="Paste your raw text for '${s.label}' here..." style="display:none;"></textarea>
                    </div>
                </div>`;
            }).join('');

            alertsHtml += `<div class="smart-alerts-container no-export no-print">${missingCards}</div>`;
        }

        // --- PURPLE: Optional Sections Suggestion ---
        if (missingOptional.length > 0) {
            const optionalCards = missingOptional.map(s => {
                const cardId = 'smart-optional-' + s.id;
                return `
                <div id="${cardId}" class="smart-alert-card smart-alert-optional no-export no-print" data-section-id="${s.id}" data-section-name="${s.label}">
                    <div class="smart-alert-icon">💡</div>
                    <div class="smart-alert-body">
                        <strong>Optional Section: ${s.label}</strong>
                        <p class="smart-alert-desc">This recommended section can be added to complete your document.</p>
                        <div class="smart-alert-actions">
                            <button class="btn-auto-generate btn-optional-generate" onclick="window._smartAlertAutoGenerate('${cardId}', '${s.id}', '${s.label}')">✨ Add & Generate</button>
                            <button class="btn-paste-format" onclick="window._smartAlertPasteFormat('${cardId}', '${s.id}', '${s.label}')">📝 Paste</button>
                            <button class="btn-skip-alert" onclick="document.getElementById('${cardId}').remove()">✕ Dismiss</button>
                        </div>
                        <textarea class="smart-alert-textarea" id="textarea-${cardId}" placeholder="Paste your raw text for '${s.label}' here..." style="display:none;"></textarea>
                    </div>
                </div>`;
            }).join('');

            alertsHtml += `<div class="smart-alerts-container no-export no-print">${optionalCards}</div>`;
        }

        // --- GREEN: Bonus Sections Alert ---
        if (bonusSections.length > 0) {
            const bonusNames = bonusSections.map(name => `<strong>${this._escapeHTML(name)}</strong>`).join(', ');
            alertsHtml += `
            <div class="smart-alert-card smart-alert-bonus no-export no-print">
                <div class="smart-alert-icon">✨</div>
                <div class="smart-alert-body">
                    <strong>Custom Sections Detected</strong>
                    <p class="smart-alert-desc">I found custom sections in your text outside standard template structure: ${bonusNames}. They've been seamlessly formatted into your document.</p>
                </div>
            </div>`;
        }

        return alertsHtml;
    }
}

// Export for usage in app.js
window.OutputGenerator = OutputGenerator;
