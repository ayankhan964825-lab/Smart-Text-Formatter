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
                    .map(item => `<li${styleAttr}>${this._escapeHTML(item)}</li>`)
                    .join('\n');

                return `<${tag}${styleAttr}>\n${listItemsHTML}\n</${tag}>`;
            }

            // Normal elements (Headings, Paragraphs)
            // Replace newlines with <br> for multi-line paragraphs
            let content = this._escapeHTML(element.content || '');
            if (tag === 'p') {
                content = content.replace(/\n/g, '<br>');
            }

            // Custom tag rendering for sub-subheadings
            if (tag === 'sub-subheading') {
                return `<div${styleAttr}>${content}</div>`;
            }

            return `<${tag}${styleAttr}>${content}</${tag}>`;
        }).join('\n\n');
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
