# APIs & Interfaces Document
**Project:** Smart Text Formatting Algorithm

Since Phase 1 is fully client-side and relies on no backend, this document primarily outlines the **Internal JavaScript Module APIs** connecting the application logic, and the planned **Future Public API Endpoint** (Phase 3).

## 1. Internal Module Interfaces (Phase 1)
These are the core internal functions interacting with each other within the client's browser.

### A. TextProcessor API (`textProcessor.js`)
- `tokenize(rawText: string): Array<string>`
  Splits raw text into an array of lines or paragraphs.
- `normalize(text: string): string`
  Removes extra spaces, trims whitespace, standardizes encodings, and pre-processes special characters.

### B. StructureDetector API (`structureDetector.js`)
- `classifyLines(lines: Array<string>): Array<ElementObject>`
  Takes processed lines and identifies the semantic structure.
  *Returns:* `[{ type: 'h1', content: 'Title text' }, { type: 'p', content: 'Paragraph content...' }]`

### C. RuleEngine API (`ruleEngine.js`)
- `applyRules(elements: Array<ElementObject>, rulesConfig: Object): Array<StyledElement>`
  Merges user-defined rules from LocalStorage with the default ruleset and applies them to the semantic structure.
- `saveRules(rulesConfig: Object): void` / `loadRules(): Object`
  Persists and retrieves formatting preferences securely from user's LocalStorage.

### D. OutputGenerator API (`outputGenerator.js`)
- `generateHTML(styledElements: Array<StyledElement>): string`
  Converts the structured element objects into clean, renderable, and semantic HTML strings.
- `exportToPDF(htmlString: string): void`
  Handles exporting the DOM to a PDF file.
- `exportToWord(htmlString: string): void`
  Handles exporting the DOM to a Word (`.docx`) file.

---

## 2. Future Public API (Phase 3 / Programmatic Access)
Once backend implementation occurs (or serverless functions are added in Phase 3), this API will allow formatting via HTTP REST requests.

- **Endpoint:** `POST /api/v1/format`
- **Description:** Formats raw text based on passed rules or defaults.
- **Request Headers:** `Content-Type: application/json`
- **Request Body Shape (JSON):**
  ```json
  {
    "text": "Raw text input goes here...",
    "rules": {
      "h1": { "fontSize": "24px", "color": "#ff0000" },
      "p": { "lineHeight": "1.5" }
    }
  }
  ```
- **Response Shape (JSON):**
  ```json
  {
    "status": "success",
    "html": "<h1 style=\"font-size: 24px; color: #ff0000;\">Raw...</h1><p>...</p>",
    "metrics": {
      "words": 5,
      "time_ms": 12 
    }
  }
  ```
