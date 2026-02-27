/**
 * textProcessor.js
 * Responsible for reading raw text, tokenizing into lines/blocks, 
 * and normalizing whitespaces and encodings.
 */

class TextProcessor {
    constructor(rawText) {
        this.rawText = rawText || '';
    }

    /**
     * Normalizes the raw text by replacing carriage returns and 
     * trimming excess whitespace from the edges of the document.
     * @returns {string} Normalized text.
     */
    normalize() {
        if (!this.rawText) return '';
        // Unify line endings to \n and trim leading/trailing whitespace
        return this.rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    }

    /**
     * Tokenizes the normalized text into logical blocks (e.g. paragraphs/lines)
     * Separates blocks based on double newlines (blank lines)
     * @returns {Array<string>} Array of raw string blocks
     */
    tokenize() {
        const normalizedText = this.normalize();
        if (!normalizedText) return [];

        // --- Extract Mermaid code blocks before tokenizing ---
        // Replace ```mermaid ... ``` with a special placeholder token
        const mermaidBlocks = [];
        const textWithoutMermaid = normalizedText.replace(/```mermaid\s*\n([\s\S]*?)```/g, (match, code) => {
            const index = mermaidBlocks.length;
            mermaidBlocks.push(code.trim());
            return `%%MERMAID_BLOCK_${index}%%`;
        });

        // Split by one or more blank lines (to separate paragraphs/headings initially)
        const rawBlocks = textWithoutMermaid.split(/\n\s*\n/);

        // Trim each block and remove empty ones
        const cleanBlocks = rawBlocks
            .map(block => block.trim())
            .filter(block => block.length > 0);

        if (cleanBlocks.length <= 1) return cleanBlocks;

        // --- Intelligent Block Merging ---
        // OCR text often injects \n\n in the middle of a sentence.
        // If a block doesn't finish with terminal punctuation, it likely belongs to the next block.
        const mergedBlocks = [];
        let currentBlock = cleanBlocks[0];

        for (let i = 1; i < cleanBlocks.length; i++) {
            const nextBlock = cleanBlocks[i];

            // Never merge mermaid placeholders
            const currentIsMermaid = /^%%MERMAID_BLOCK_\d+%%$/.test(currentBlock.trim());
            const nextIsMermaid = /^%%MERMAID_BLOCK_\d+%%$/.test(nextBlock.trim());

            if (currentIsMermaid || nextIsMermaid) {
                mergedBlocks.push(currentBlock);
                currentBlock = nextBlock;
                continue;
            }

            // Look for terminal punctuation at the end of the current block
            const endsWithPunctuation = /[.?!:;"]$/.test(currentBlock.trim());
            // Check if the next block looks like a structural starting point (Heading, List, etc.)
            const nextIsHeadingOrList = /^(#{1,6}\s+|[-*+]\s+|\d+\.\s+|[IVX]+\.\s+|[A-Z]\.\s+|Abstract|Introduction|Conclusion)/i.test(nextBlock);

            if (!endsWithPunctuation && !nextIsHeadingOrList) {
                // Merge them!
                // If it ends with a hyphen, merge directly without a space to fix word breaks.
                if (currentBlock.endsWith('-')) {
                    currentBlock = currentBlock.slice(0, -1) + nextBlock;
                } else {
                    currentBlock = currentBlock + ' ' + nextBlock;
                }
            } else {
                // Sentence is finished or next block is structural, push current block and step forward
                mergedBlocks.push(currentBlock);
                currentBlock = nextBlock;
            }
        }

        // Push the final block
        mergedBlocks.push(currentBlock);

        // Store extracted mermaid blocks for StructureDetector to use
        this._mermaidBlocks = mermaidBlocks;

        return mergedBlocks;
    }
}

// Export for usage in app.js
window.TextProcessor = TextProcessor;
