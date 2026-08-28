**TECHNICAL REQUIREMENTS DOCUMENT**
**TextMorph — FormatFlow**
Technical Architecture and Implementation Specification | Version 2.0
https://smarttextformatter.vercel.app

| Field | Details |
|---|---|
| Document Type | Technical Requirements Document (TRD) |
| Corresponding PRD | TextMorph PRD v2.0 |
| Tech Stack | HTML5, CSS3, Vanilla JavaScript ES6+, Gemini API, Changelou Pretext |
| Deployment | Vercel Static Hosting |
| Architecture | Single Page Application — fully client-side, zero backend |
| Date | April 2026 |

---

**T1. System Architecture Overview**

TextMorph v2.0 is a purely client-side Single Page Application. All processing — including AI API calls, text chunking, template management, image handling, and document export — happens entirely in the user's browser. No user content is transmitted to or stored on any server other than the Gemini API endpoint for text analysis.

**T1.1 Technology Stack**

| Layer | Technology | Responsibility |
|---|---|---|
| Presentation | HTML5 and CSS3 | Step-by-step UI, format preview panel, output panel, toolbars |
| Application Logic | Vanilla JavaScript ES6+ | All module orchestration, event handling, state management |
| AI Processing | Gemini API gemini-pro | Text analysis, structure detection, missing section generation |
| Image Handling | Changelou Pretext from GitHub | Layout-safe image insertion with CSS style isolation per block |
| Document Export | jsPDF, html2canvas, docx.js | PDF and Word export with correctly embedded images |
| Persistence | Browser LocalStorage | Template preferences, auto-saved progress, custom rulesets |
| Hosting | Vercel | Static file hosting with CDN delivery and zero-config deployment |

**T1.2 Module Architecture**

| Module | File | Responsibility |
|---|---|---|
| App Controller | app.js | App initialization, step navigation, global state, module wiring |
| Template Engine | templateEngine.js | Load, save, and apply document type templates with user customization |
| Text Processor | textProcessor.js | Input cleaning, tokenization, and chunk boundary detection |
| Chunk Manager | chunkManager.js | Split and reassemble large documents; manage API queue; emit progress events |
| AI Connector | aiConnector.js | Gemini API calls, prompt construction, retry logic, rate limit handling |
| Structure Mapper | structureMapper.js | Map AI output to template sections with confidence scoring |
| AI Writer | aiWriter.js | Generate missing sections with AI; apply AI Generated badges |
| Image Manager | imageManager.js | Handle file uploads, Changelou Pretext integration, caption system |
| Output Renderer | outputRenderer.js | Build live HTML preview from formatted section data |
| Export Engine | exportEngine.js | PDF via jsPDF and html2canvas; Word via docx.js with image embedding |
| Storage Manager | storageManager.js | LocalStorage CRUD operations, auto-save timer, overflow handling |
| UI Controller | uiController.js | Step stepper, panels, toolbars, modals, dark mode, responsive layout |

---

**T2. Template Engine — Technical Specification**

**T2.1 Template Data Schema**

Each document type template is defined as a JavaScript configuration object with the following structure:

```javascript
const template = {
  id: 'research_paper',
  name: 'Research Paper',
  defaultFont: 'Times New Roman',
  defaultFontSize: 12,
  lineSpacing: 2.0,
  alignment: 'justify',
  sections: [
    { id: 'abstract', label: 'Abstract', required: true, aiGenerate: true },
    { id: 'introduction', label: 'Introduction', required: true, aiGenerate: false },
    { id: 'methodology', label: 'Methodology', required: true, aiGenerate: false },
    { id: 'results', label: 'Results', required: true, aiGenerate: false },
    { id: 'conclusion', label: 'Conclusion', required: true, aiGenerate: true },
    { id: 'references', label: 'References', required: false, aiGenerate: false },
  ],
  customizable: true
};
```

**T2.2 Template Loading Flow**

1. User selects document type in Step 1 — `templateEngine.load(typeId)` is called
2. Template JSON is fetched from the local templates directory or from LocalStorage if a custom version exists
3. Template sections are rendered in the Step 2 UI as editable, draggable cards
4. All user edits are saved to LocalStorage under the key: `template_custom_{typeId}`
5. On Format Now click: current template state is serialized and passed to AI Connector as the formatting schema

---

**T3. Gemini API Integration — Technical Specification**

**T3.1 API Configuration**

| Parameter | Value |
|---|---|
| Endpoint | https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent |
| Model | gemini-pro (free tier compatible) |
| Max tokens per request | 8,192 tokens (Gemini Pro hard limit) |
| Max input words per request | Approximately 3,000 words or 15,000 characters for safe margin |
| Retry strategy | Exponential backoff: 2 seconds, 4 seconds, 8 seconds — maximum 3 retries |
| Rate limit handling | Queue with 1-second minimum gap between sequential requests |
| Temperature | 0.3 — low creativity; factual and structured output preferred |
| API key storage | User-provided key stored in sessionStorage only; cleared automatically on tab close |

**T3.2 Format Call Prompt Structure**

```
You are formatting a {documentType} document.
Template sections: {sectionList}
Format rules: font={font}, size={size}pt, spacing={spacing}, align={align}
Previous chunk context (for continuity — do NOT reformat this): {prevContext}
--- CONTENT TO FORMAT ---
{chunkText}
--- END CONTENT ---
Return ONLY valid JSON:
{ "sections": [{"id": "...", "label": "...", "html": "..."}], "formatted_html": "..." }
```

**T3.3 AI Writing Assistant Prompt Structure**

```
The following {documentType} document is missing the '{sectionName}' section.
Based on the existing content summary below, generate a concise, professional {sectionName} section.
Do NOT rewrite or alter any existing content. Generate ONLY the missing section text.
Existing content summary: {contentSummary}
Return ONLY the generated section as clean HTML — no preamble, no explanation.
```

---

**T4. Chunking Engine — Technical Specification**

**T4.1 Chunking Algorithm**

```javascript
function chunkText(text, maxWords = 2500, overlapWords = 200) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = [];
  let count = 0;
  for (const para of paragraphs) {
    const words = para.split(/\s+/).length;
    if (count + words > maxWords && current.length > 0) {
      chunks.push(current.join('\n\n'));
      // Keep last N words as context overlap for next chunk
      current = [getLastNWords(current.join(' '), overlapWords)];
      count = overlapWords;
    }
    current.push(para);
    count += words;
  }
  if (current.length) chunks.push(current.join('\n\n'));
  return chunks;
}
```

**T4.2 Chunk Processing State Machine**

| State | Trigger | Next State | UI Display |
|---|---|---|---|
| IDLE | User clicks Format Now | CHUNKING if over 3k words; else PROCESSING | Show loading spinner |
| CHUNKING | Text splitting complete | PROCESSING_CHUNK_N | Show: Preparing chunks... |
| PROCESSING_CHUNK_N | Previous chunk complete | PROCESSING_CHUNK_N+1 or MERGING | Show: Formatting chunk N of Total |
| RETRYING | API error on chunk N | PROCESSING_CHUNK_N with retry counter | Show: Retrying attempt X of 3 |
| FAILED_CHUNK | 3 retries exhausted | PARTIAL_OUTPUT | Show error and partial output option |
| MERGING | All chunks processed | CONSISTENCY_PASS | Show: Merging sections... |
| CONSISTENCY_PASS | Merge complete | COMPLETE | Show: Finalizing document... |
| COMPLETE | Consistency pass done | IDLE | Show output panel; hide all progress UI |

---

**T5. Changelou Pretext — Image Integration Specification**

**T5.1 The Problem Changelou Pretext Solves**

When an image block element is inserted into a contenteditable div or injected via innerHTML, it creates a new CSS block formatting context. All text nodes that follow the image lose their inherited styles because the browser recalculates cascaded values from the nearest block ancestor. This results in font, size, color, and alignment properties resetting on all text below the image insertion point.

Changelou Pretext resolves this by wrapping each logical text block in an isolated style scope — a Pretext scope — that explicitly declares all style properties on the container element itself. Each scope is self-contained and immune to outside CSS interference, regardless of what block elements are inserted between scopes.

**T5.2 Integration Steps**

1. Import Changelou Pretext library from its GitHub CDN URL on document load
2. When the output is rendered, wrap each block element — paragraph, heading, list — in a Pretext scope:
   ```javascript
   Pretext.wrap('.output-block', { inheritStyles: true, isolate: true });
   ```
3. When the user inserts an image, inject the image block element between existing Pretext scopes — never inside a scope
4. After insertion, call `Pretext.reflow()` to re-validate all scope boundaries and re-declare styles
5. All style modifications such as font changes or alignment changes must call `Pretext.updateScope(blockId, newStyles)` instead of directly modifying DOM styles

**T5.3 Image Block HTML Structure**

```html
<div class="image-block" data-pretext-boundary="true">
  <img src="{dataURL}" style="width: {width}%; max-width: 100%;" alt="{captionText}" />
  <p class="img-caption">Figure {n}: {captionText}</p>
  <div class="resize-handle" data-direction="right"></div>
</div>
```

**T5.4 Image Export Technical Implementation**

| Export Format | Image Handling Method |
|---|---|
| PDF Export | Use html2canvas to rasterize the entire output div including all images at scale 2 for high DPI; pass each page slice canvas to jsPDF.addImage() |
| Word Export | Convert each image to base64 data URL using FileReader or canvas.toDataURL; pass to docx.js ImageRun with calculated DXA dimensions |
| Word Image Sizing | Pixel to DXA: pixels divided by 96 gives inches; inches multiplied by 1440 gives DXA units |

---

**T6. Export Engine — Technical Specification**

**T6.1 PDF Export Flow**

1. Capture output: `html2canvas(outputDiv, { scale: 2, useCORS: true, allowTaint: false })`
2. Calculate page dimensions: A4 width is 794px at 96dpi; page height = (794 divided by canvas.width) multiplied by canvas.height
3. For each page: slice canvas with getImageData and add to jsPDF with `doc.addImage()`
4. Add page numbers at bottom center of each page using `doc.text()`
5. Trigger download: `doc.save('TextMorph_Document.pdf')`

**T6.2 Word Export Flow**

1. Parse output HTML into a structured content tree using DOMParser
2. Map HTML elements to docx.js objects: h1 to Heading1, h2 to Heading2, p to Paragraph, ul to bullet list, img to ImageRun
3. Apply document-level settings from template: font, page margins, page size
4. For each image element: extract base64 from src attribute and pass to ImageRun with calculated DXA width and height
5. Build document: `new Document({ sections: [{ children: contentArray }] })`
6. Pack and trigger download: `Packer.toBlob(doc)` then `window.URL.createObjectURL` and anchor click

---

**T7. LocalStorage Schema**

| Key Pattern | Value Type | Content | Retention |
|---|---|---|---|
| template_custom_{typeId} | JSON Object | Full user-modified template for this document type | Permanent |
| autosave_content | JSON Object | rawText, formattedHTML, templateId, currentStep, timestamp | 7 days |
| ui_preferences | JSON Object | darkMode boolean, lastDocType string, fontSize number | Permanent |
| chunk_progress_{sessionId} | JSON Object | totalChunks, completedChunks, partialOutputHTML | 1 hour |

**T7.1 Storage Overflow Handling**

- Before each write, check remaining LocalStorage quota using a try-catch around a test write
- If quota would be exceeded, show non-blocking toast: "Auto-save storage full. Oldest saves will be cleared."
- Clear the oldest autosave entry first; retry the write
- Template customizations are never auto-deleted — only autosave content is eligible for eviction

---

**T8. Security and Privacy Requirements**

- All Gemini API calls made directly from browser to Google — no proxy server; no middleware
- User-provided API key stored in sessionStorage only — cleared automatically on tab or browser close
- Platform default API key stored as Vercel environment variable — never exposed in client-side code
- Client-side rate limiting for default key: maximum 10 requests per minute per browser session
- Input sanitization: strip all script tags, iframe elements, and inline event handlers from any pasted HTML
- Image uploads processed entirely in browser using FileReader API — no data leaves the device
- LocalStorage data is device-local and never transmitted anywhere
- No analytics, no tracking, no content logging of any kind

---

**T9. Performance Benchmarks**

| Operation | Target Time | Measurement Method |
|---|---|---|
| Initial page load | Under 2 seconds | Lighthouse Performance Score above 90 |
| Template load on type selection | Under 200 milliseconds | console.time measurement in dev build |
| Small document format (under 3,000 words) | Under 8 seconds | API call timer from click to output render |
| Large document format (10 chunks) | Under 90 seconds total | Chunk queue total timer |
| PDF export 20 pages | Under 15 seconds | Export timer from click to download trigger |
| Word export 20 pages | Under 5 seconds | Export timer from click to download trigger |
| Image insert 5MB file | Under 2 seconds | FileReader load plus Pretext reflow timer |
| Live preview re-render on edit | Under 100 milliseconds | requestAnimationFrame delta measurement |

---

**T10. Testing Specification**

**T10.1 Unit Tests**

- `chunkText()` — verify boundary detection accuracy, overlap word count, all edge cases
- `templateEngine.load()` — verify all 10 document types load with correct default values
- `structureMapper.map()` — verify section mapping accuracy against 20 labeled sample texts
- `imageManager.insert()` — verify Pretext scope integrity is maintained before and after insertion
- `exportEngine.toPDF()` and `toWord()` — verify output file validity and image presence

**T10.2 Integration Tests**

- Full happy path: Select type → Paste text → Format Now → Review → Export PDF → verify file
- Chunking path: 10,000+ word document → chunk → merge → export → verify continuity
- Image path: Insert image mid-document → verify text formatting above and below → export → verify image in file
- AI Writer path: Input missing Abstract section → verify AI generation → verify badge visible
- Offline path: Disconnect network mid-chunk → verify queue pauses → reconnect → verify resume

**T10.3 Cross-Browser Test Matrix**

| Browser | Minimum Version | Priority |
|---|---|---|
| Google Chrome | 110+ | P0 — Primary target |
| Mozilla Firefox | 110+ | P0 — Primary target |
| Microsoft Edge | 110+ | P1 — High priority |
| Safari macOS | 16+ | P1 — High priority |
| Chrome on Android | Latest stable | P2 — Medium priority |
| Safari on iOS | 16+ | P2 — Medium priority |

---

**T11. Deployment Specification**

| Item | Specification |
|---|---|
| Hosting platform | Vercel — existing active deployment |
| Build process | None required — pure static HTML, CSS, and JavaScript files |
| External libraries via CDN | jsPDF, html2canvas, docx.js, Changelou Pretext |
| Environment variables | GEMINI_DEFAULT_KEY stored as Vercel env var; never in source code |
| Deployment trigger | Git push to main branch triggers automatic Vercel deployment |
| Branch strategy | main for production; develop branch gets preview URL from Vercel automatically |
| Rollback mechanism | Vercel one-click rollback to any previous deployment from dashboard |
| File structure | index.html, css/styles.css, js/modules/ (each module file), templates/ (each JSON template) |

---

*TextMorph — FormatFlow | TRD v2.0 | Confidential*
