/**
 * outputGenerator.js
 * Responsible for rendering the StyledElements array into final HTML.
 */

class OutputGenerator {

    /**
     * Generates a final HTML string from processed and styled elements
     * @param {Array<Object>} styledElements 
     * @returns {string} Clean HTML string
     */
    generateHTML(styledElements) {
        if (!styledElements || styledElements.length === 0) return '';

        const htmlParts = [];
        let i = 0;

        while (i < styledElements.length) {
            const element = styledElements[i];
            const tag = element.type;
            const styleAttr = element.styleString ? ` style="${element.styleString}"` : '';

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
                        let cleanItem = item.trim().replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
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

            // Normal elements (Headings, Paragraphs)
            let content = this._cleanMarkdown(this._escapeHTML(element.content || ''));

            if (tag === 'p') {
                content = content.replace(/-\n/g, '').replace(/\n/g, ' ');
            }

            // Clean markdown from headings too
            if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'sub-subheading') {
                content = content.replace(/<\/?b>/g, '').replace(/<\/?i>/g, '');
            }

            // Custom tag rendering for sub-subheadings
            let thisHtml;
            if (tag === 'sub-subheading') {
                thisHtml = `<div${styleAttr}>${content}</div>`;
            } else {
                thisHtml = `<${tag}${styleAttr}>${content}</${tag}>`;
            }

            // --- KEEP-WITH-NEXT: Group heading/label with its following diagram ---
            // If this is a heading (h1-h6) or a short paragraph (label), and the NEXT element is a mermaid diagram or table,
            // wrap both inside a container with `page-break-inside: avoid` so they stay on the same page.
            const isHeadingOrLabel = 
                (tag.match(/^h[1-6]$/) !== null) || 
                (tag === 'sub-subheading') || 
                (tag === 'p' && content.length < 150);
            
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

        return htmlParts.filter(html => html !== '').join('\n\n');
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
}

// Export for usage in app.js
window.OutputGenerator = OutputGenerator;
