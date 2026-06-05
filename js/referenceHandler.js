/**
 * referenceHandler.js
 * Handles Reference PDF upload and conversion to Base64.
 * The Base64 string is then passed as an inlineData part to Gemini 2.5 API.
 */

class ReferenceHandler {
    constructor() {
        this.referencePdfBase64 = null;  // Stores the raw base64 string
        this.mimeType = "application/pdf";
        this.fileName = null;
        this.fileSize = 0;
    }

    /**
     * Parse a PDF file and extract its base64 representation.
     * @param {File} file - The uploaded PDF file
     * @returns {Promise<void>}
     */
    async processPDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                // e.target.result is a Data URL like: "data:application/pdf;base64,JVBER..."
                const dataUrl = e.target.result;
                const base64String = dataUrl.split(',')[1];
                
                this.referencePdfBase64 = base64String;
                this.fileName = file.name;
                this.fileSize = file.size;
                resolve();
            };

            reader.onerror = (err) => {
                reject(err);
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Generate the AI prompt injection for reference PDF context.
     * @returns {string} Prompt text to inject into system instruction
     */
    getPromptContext() {
        if (!this.referencePdfBase64) return "";

        let prompt = `\n\n--- REFERENCE DOCUMENT CONTEXT ---\n`;
        prompt += `I have attached a REFERENCE PDF ("${this.fileName}") in the request parts.\n`;
        prompt += `Carefully analyze its visual structure, layout patterns, heading hierarchy, and front pages (if any).\n`;
        prompt += `IMPORTANT INSTRUCTION: You MUST format the user's raw text to visually and structurally match the layout of this reference PDF as closely as possible.\n`;
        prompt += `Use the reference ONLY as a structural template. Do NOT copy the content of the reference PDF into the output.\n`;
        prompt += `--- END REFERENCE DOCUMENT CONTEXT ---\n`;

        return prompt;
    }

    /** Check if a reference has been uploaded */
    hasReference() {
        return this.referencePdfBase64 !== null;
    }

    /** Get the raw base64 data to attach to the API request */
    getInlineData() {
        if (!this.referencePdfBase64) return null;
        return {
            mimeType: this.mimeType,
            data: this.referencePdfBase64
        };
    }

    /** Clear the uploaded reference */
    clear() {
        this.referencePdfBase64 = null;
        this.fileName = null;
        this.fileSize = 0;
    }
}

// Global instance
window.referenceHandler = new ReferenceHandler();
