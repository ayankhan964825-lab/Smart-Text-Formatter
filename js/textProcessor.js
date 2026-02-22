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

        // Split by one or more blank lines (to separate paragraphs/headings)
        // \n\s*\n matches a newline, optional whitespace, and another newline
        const rawBlocks = normalizedText.split(/\n\s*\n/);

        // Trim each block and remove empty ones
        const cleanBlocks = rawBlocks
            .map(block => block.trim())
            .filter(block => block.length > 0);

        return cleanBlocks;
    }
}

// Export for usage in app.js
window.TextProcessor = TextProcessor;
