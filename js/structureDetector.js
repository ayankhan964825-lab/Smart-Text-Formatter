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

        const classifiedElements = [];
        let globalIndex = 0;

        for (let i = 0; i < textBlocks.length; i++) {
            const block = textBlocks[i];

            // If the block is a single line, no need to split
            if (!block.includes('\n')) {
                classifiedElements.push(this._detectType(block, globalIndex++));
                continue;
            }

            // --- Glued Text Detection ---
            // A Google Lens copy might paste a heading directly under a paragraph without a blank line.
            // We read the block line by line.
            const lines = block.split('\n');
            let currentParagraphBuffer = [];

            for (let j = 0; j < lines.length; j++) {
                const line = lines[j].trim();
                let isGluedHeading = false;

                // Only consider it a glued heading if it's not the very first line of the block
                // (if it's the first line, _detectType handles it natively)
                if (j > 0 && line.length > 0 && line.length < 250) {
                    // Check our known heading patterns
                    const isNumSubheading = /^(?:#{1,6}\s+)?(\d+\.\d+(?:\.\d+)*)\.?\s+(.*)$/.test(line);
                    const isRomanHeading = /^(IX|IV|V?I{0,3})\.\s+(.*)$/i.test(line);
                    const isAlphabetHeading = /^([A-Z])\.\s+(.*)$/.test(line);
                    const isKeywordHeading = /^(Abstract|Introduction|Conclusion[s]?|Reference[s]?|Acknowledgment[s]?|Methodology|Keywords|Overview)\s*$/i.test(line);
                    const isMarkdownHeading = /^(#{1,6})\s+(.*)$/.test(line);

                    // Special case for main numbers (e.g., "4. "): Ensure it's not just a list item.
                    let isMainNumberedHeading = false;
                    const mainMatch = line.match(/^(\d+)\.\s+(.*)$/);
                    if (mainMatch) {
                        isMainNumberedHeading = true;
                        // Peek at the next line to see if it's the sequence (e.g. "5. ")
                        // If it is, this is an ordered list, not a glued heading.
                        if (j + 1 < lines.length) {
                            const nextLineMatch = lines[j + 1].trim().match(/^(\d+)\.\s+/);
                            if (nextLineMatch && parseInt(nextLineMatch[1], 10) === parseInt(mainMatch[1], 10) + 1) {
                                isMainNumberedHeading = false;
                            }
                        }
                    }

                    if (isNumSubheading || isRomanHeading || isAlphabetHeading || isKeywordHeading || isMarkdownHeading || isMainNumberedHeading) {
                        isGluedHeading = true;
                    }
                }

                if (isGluedHeading) {
                    // Flush existing paragraph buffer
                    if (currentParagraphBuffer.length > 0) {
                        classifiedElements.push(this._detectType(currentParagraphBuffer.join('\n'), globalIndex++));
                        currentParagraphBuffer = [];
                    }
                    // Push the heading directly
                    classifiedElements.push(this._detectType(line, globalIndex++));
                } else {
                    currentParagraphBuffer.push(line);
                }
            }

            // Flush remaining buffer at the end of the block
            if (currentParagraphBuffer.length > 0) {
                classifiedElements.push(this._detectType(currentParagraphBuffer.join('\n'), globalIndex++));
            }
        }

        return classifiedElements;
    }

    /**
     * Internal method to detect the specific type of a single text block
     * @param {string} block
     * @param {number} index 
     * @returns {Object} { type: string, content: string }
     */
    _detectType(block, index) {
        // 0. Detect Top-Level Title (H1) for Plain Text
        // If it's the very first block, has no line breaks, and doesn't end in a period, treat as title
        if (index === 0 && !block.includes('\n') && !block.endsWith('.')) {
            // Ensure we don't accidentally override an explicitly marked markdown heading
            const isMarkdownHeading = /^#{1,6}\s+/.test(block);
            if (!isMarkdownHeading) {
                return {
                    type: 'h1',
                    content: block.trim()
                };
            }
        }

        // 1. Detect Numerical Sub-Subheadings (e.g. "### 2.1", "2.1", "3.2.1") and treat them as Body size
        // We match an optional sequence of '#' hashes followed by space, then the numerical pattern.
        const numSubheadingMatch = block.match(/^(?:#{1,6}\s+)?(\d+\.\d+(?:\.\d+)*)\.?\s+(.*)$/m);
        if (numSubheadingMatch && numSubheadingMatch.index === 0 && !block.includes('\n') && block.length < 250) {
            // It's a single-line numerical nested heading (e.g., "2.1. Something")
            const numbers = numSubheadingMatch[1];
            const textContent = numSubheadingMatch[2];
            return {
                type: 'sub-subheading', // Custom semantic type
                content: `${numbers} ${textContent}`.trim()
            };
        }

        // 1.5 Detect Main Level Numbered Headings (e.g. "1. Introduction")
        // Match a number followed by a dot and a space at the start, ensuring it's a single line.
        const mainNumberedHeadingMatch = block.match(/^(\d+)\.\s+(.*)$/m);
        if (mainNumberedHeadingMatch && mainNumberedHeadingMatch.index === 0 && !block.includes('\n') && block.length < 250) {
            const numbers = mainNumberedHeadingMatch[1] + '.';
            const textContent = mainNumberedHeadingMatch[2];
            return {
                type: 'h2', // Main section headers map to H2
                content: `${numbers} ${textContent}`.trim()
            };
        }

        // 1.6 Detect Roman Numeral Headings (e.g. "I. Introduction", "IV. Methodology")
        const romanHeadingMatch = block.match(/^(IX|IV|V?I{0,3})\.\s+(.*)$/i);
        if (romanHeadingMatch && romanHeadingMatch.index === 0 && !block.includes('\n') && block.length < 250) {
            const numeral = romanHeadingMatch[1].toUpperCase() + '.';
            const textContent = romanHeadingMatch[2];
            return {
                type: 'h2',
                content: `${numeral} ${textContent}`.trim()
            };
        }

        // 1.7 Detect Alphabetical Sub-subheadings (e.g. "A. Architecture", "B. Energy")
        const alphabetHeadingMatch = block.match(/^([A-Z])\.\s+(.*)$/m);
        // Ensure it's not just a single word or random capital (length > 3)
        if (alphabetHeadingMatch && alphabetHeadingMatch.index === 0 && !block.includes('\n') && block.length < 150) {
            const letter = alphabetHeadingMatch[1] + '.';
            const textContent = alphabetHeadingMatch[2];
            return {
                type: 'sub-subheading',
                content: `${letter} ${textContent}`.trim()
            };
        }

        // 1.8 Detect Academic/Common Keywords Standalone Headings
        // (e.g., "Abstract", "References" sitting on their own line)
        const keywordMatch = block.match(/^(Abstract|Introduction|Conclusion[s]?|Reference[s]?|Acknowledgment[s]?|Methodology|Keywords|Overview)\s*$/i);
        if (keywordMatch && keywordMatch.index === 0 && !block.includes('\n')) {
            // Preserve their exact spelling/casing to prevent data destruction
            return {
                type: 'h2',
                content: block.trim()
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
