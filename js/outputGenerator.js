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

        return styledElements.map((element, index, arr) => {
            const tag = element.type;
            const styleAttr = element.styleString ? ` style="${element.styleString}"` : '';

            // Handle lists differently because they contain sub-items
            if (tag === 'ul' || tag === 'ol') {
                let listItems = [];
                if (Array.isArray(element.items)) {
                    listItems = element.items;
                } else if (typeof element.content === 'string') {
                    // Fallback: If AI disobeys and returns a string, split it by newlines
                    listItems = element.content.split('\n');
                }

                const listItemsHTML = listItems
                    .map(item => {
                        // Strip leading list tokens (- * • 1. etc.) just in case they were left in
                        let cleanItem = item.trim().replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
                        return `<li${styleAttr}>${this._cleanMarkdown(this._escapeHTML(cleanItem))}</li>`;
                    })
                    .join('\n');

                return `<${tag}${styleAttr}>\n${listItemsHTML}\n</${tag}>`;
            }

            // Handle Mermaid diagram blocks
            if (tag === 'mermaid') {
                // Return raw mermaid code inside a pre>code for Mermaid.js to render later
                // Added page-break-inside avoid, plus "light box" aesthetic styling (background, border, padding)
                // 'margin: 18pt 0 12pt 0' ensures exactly 18pt gap from top subheading and 12pt gap before caption text.
                const lightboxStyle = `page-break-inside: avoid; background-color: #fcfcfc; border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; margin: 18pt 0 12pt 0; box-shadow: 0 2px 5px rgba(0,0,0,0.03); text-align: center;`;
                return `<div class="mermaid-container" style="${lightboxStyle}"><pre class="mermaid">${element.content || ''}</pre></div>`;
            }

            // Handle raw HTML blocks (e.g., converted markdown tables)
            if (tag === 'html') {
                return element.content || '';
            }

            // Normal elements (Headings, Paragraphs)
            // Escape HTML first, then clean markdown artifacts, then handle OCR breaks
            let content = this._cleanMarkdown(this._escapeHTML(element.content || ''));
            if (tag === 'p') {
                content = content.replace(/-\n/g, '').replace(/\n/g, ' ');

                // --- Widow/Orphan Filter for Diagram Labels ---
                // If this is a very short "p" block (like "Bar Chart: Density") and the NEXT block is a diagram,
                // drop it! The diagram already has the text/title, and these cause awkward page breaks in Word.
                if (index < arr.length - 1 && arr[index + 1].type === 'mermaid') {
                    if (content.length < 50 && (/^(diagram|chart|flowchart|table|figure)/i.test(content) || content.split(' ').length <= 8)) {
                        return ''; // Skip rendering this block
                    }
                }
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
        }).filter(html => html !== '').join('\n\n');
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
