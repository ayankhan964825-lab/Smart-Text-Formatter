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

        return styledElements.map(element => {
            const tag = element.type;
            const styleAttr = element.styleString ? ` style="${element.styleString}"` : '';

            // Handle lists differently because they contain sub-items
            if (tag === 'ul' || tag === 'ol') {
                const listItemsHTML = element.items
                    .map(item => `<li${styleAttr}>${this._cleanMarkdown(this._escapeHTML(item))}</li>`)
                    .join('\n');

                return `<${tag}${styleAttr}>\n${listItemsHTML}\n</${tag}>`;
            }

            // Handle Mermaid diagram blocks
            if (tag === 'mermaid') {
                // Return raw mermaid code inside a pre>code for Mermaid.js to render later
                return `<div class="mermaid-container"><pre class="mermaid">${element.content || ''}</pre></div>`;
            }

            // Normal elements (Headings, Paragraphs)
            // Escape HTML first, then clean markdown artifacts, then handle OCR breaks
            let content = this._cleanMarkdown(this._escapeHTML(element.content || ''));
            if (tag === 'p') {
                content = content.replace(/-\n/g, '').replace(/\n/g, ' ');
            }

            // Clean markdown from headings too (remove bold/italic tags since headings are already styled)
            if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'sub-subheading') {
                content = content.replace(/<\/?b>/g, '').replace(/<\/?i>/g, '');
            }

            // Custom tag rendering for sub-subheadings
            if (tag === 'sub-subheading') {
                return `<div${styleAttr}>${content}</div>`;
            }

            return `<${tag}${styleAttr}>${content}</${tag}>`;
        }).join('\n\n');
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
