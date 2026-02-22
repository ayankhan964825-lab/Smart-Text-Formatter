/**
 * structureDetector.js
 * Responsible for taking raw text blocks (tokens) and identifying
 * their semantic meaning (Heading, Paragraph, List, etc.)
 */

class StructureDetector {

    /**
     * Classifies an array of raw text blocks into structured ElementObjects
     * @param {Array<string>} textBlocks 
     * @returns {Array<Object>} Array of objects like { type: 'h1', content: '...' }
     */
    classifyBlocks(textBlocks) {
        if (!textBlocks || textBlocks.length === 0) return [];

        return textBlocks.map(block => this._detectType(block));
    }

    /**
     * Internal method to detect the specific type of a single text block
     * @param {string} block 
     * @returns {Object} { type: string, content: string }
     */
    _detectType(block) {
        // 1. Detect Numerical Sub-Subheadings (e.g. "### 2.1", "2.1", "3.2.1") and treat them as Body size
        // We match an optional sequence of '#' hashes followed by space, then the numerical pattern.
        const numSubheadingMatch = block.match(/^(?:#{1,6}\s+)?(\d+\.\d+(?:\.\d+)*)\s+(.*)$/m);
        if (numSubheadingMatch && numSubheadingMatch.index === 0) {
            // It's a numerical nested heading, but user wants sub-subheading styling for this
            // We prepend the numbers back so they aren't lost from the content
            const numbers = numSubheadingMatch[1];
            const textContent = numSubheadingMatch[2];
            return {
                type: 'sub-subheading', // Custom semantic type
                content: `${numbers} ${textContent}`.replace(/\n/g, ' ')
            };
        }

        // 2. Detect Headings (Markdown style: #, ##, ###)
        const headingMatch = block.match(/^(#{1,6})\s+(.*)$/m);
        if (headingMatch && headingMatch.index === 0) {
            // It's a heading
            const level = headingMatch[1].length; // number of hashes
            const content = headingMatch[2].trim();
            // Handle multi-line headings by replacing \n with <br> or spaces
            return {
                type: `h${level}`,
                content: content.replace(/\n/g, ' ')
            };
        }

        // 2. Detect Unordered Lists (starts with -, *, +)
        // Check if *every* non-empty line in the block starts with a list marker
        const lines = block.split('\n');
        const isUnorderedList = lines.every(line => {
            const trimmed = line.trim();
            return trimmed === '' || /^[-*+]\s+/.test(trimmed);
        });

        if (isUnorderedList && lines.length > 0) {
            // Process list items
            const listItems = lines
                .filter(line => line.trim() !== '')
                .map(line => line.replace(/^[-*+]\s+/, '').trim());

            return {
                type: 'ul',
                items: listItems
            };
        }

        // 3. Detect Ordered Lists (starts with 1., 2., etc.)
        const isOrderedList = lines.every(line => {
            const trimmed = line.trim();
            return trimmed === '' || /^\d+\.\s+/.test(trimmed);
        });

        if (isOrderedList && lines.length > 0) {
            const listItems = lines
                .filter(line => line.trim() !== '')
                .map(line => line.replace(/^\d+\.\s+/, '').trim());

            return {
                type: 'ol',
                items: listItems
            };
        }

        // 4. Default to Paragraph
        // If it's multi-line, we just keep it as a single paragraph with <br> tags later
        return {
            type: 'p',
            content: block
        };
    }
}

// Export for usage in app.js
window.StructureDetector = StructureDetector;
