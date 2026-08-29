**PRODUCT REQUIREMENTS DOCUMENT**
**TextMorph — FormatFlow**
AI-Powered Document Formatting Platform | Version 2.0
https://formatxflow.vercel.app

| Field | Details |
|---|---|
| Product Name | TextMorph — FormatFlow |
| Version | 2.0 (Major Feature Update) |
| Document Type | Product Requirements Document (PRD) |
| Tech Stack | HTML5, CSS3, Vanilla JavaScript, Gemini API |
| Previous Version | v1.0 — Live at formatxflow.vercel.app |
| Status | Active Development |
| Date | April 2026 |

---

**1. Executive Summary**

TextMorph is an AI-powered web-based document formatting platform that converts raw, unstructured text into professionally formatted documents. The existing v1.0 platform supports Gemini AI-powered text analysis, custom font and alignment settings, PDF and Word export, and live preview editing with manual correction tools.

Version 2.0 introduces five major feature additions: (1) Document Type Selection with pre-loaded format templates, (2) AI Writing Assistant for missing section auto-generation, (3) In-document Image Upload with layout-safe rendering via the Changelou Pretext library, (4) Intelligent Text Chunking for 40 to 200+ page documents, and (5) a fully redesigned Professional UI/UX with a guided step-by-step workflow.

---

**2. Problem Statement**

Despite the success of v1.0, user feedback and usage analysis have identified the following critical gaps:

| Problem | Impact | Priority |
|---|---|---|
| No document type templates — user must manually configure all format settings | Very high friction for new users | Critical |
| AI cannot fill missing required sections — user must write them manually | Incomplete outputs produced | High |
| No image insertion in output — text-only documents only | Limits academic and professional use cases | High |
| Large documents (40+ pages) fail or timeout with a single API call | Entire large-doc use case is broken | High |
| No guided workflow — users confused about step sequence | Poor onboarding and retention | High |
| Image/diagram insertion breaks text formatting below insertion point | Corrupted document layout | Medium |

---

**3. Product Vision and Goals**

**3.1 Vision**
To be the most intelligent, accessible, and user-friendly AI document formatting platform on the web — capable of handling any document type, any size, producing professional output quality equivalent to expert manual formatting.

**3.2 v2.0 Goals**
- Reduce time to format a raw text document by 80% compared to manual formatting
- Support 10+ document types with professionally designed default templates
- Successfully format documents up to 200 pages via chunked processing
- Allow seamless image insertion without disrupting text formatting continuity
- Auto-generate missing required sections using AI context awareness
- Achieve UI experience score of 4.5/5 or above in user testing

---

**4. Target Users**

| User Segment | Primary Use Case | Relevant Document Types |
|---|---|---|
| University Students | Format assignments, research papers, thesis | Assignment, Research Paper, Thesis |
| Researchers and Academics | Structure academic papers with standard formatting | Research Paper, Literature Review |
| Corporate Professionals | Create business reports and project proposals | Business Report, Project Proposal |
| Freelance Writers | Format articles, blog posts, manuscripts | Article, Blog Post, General |
| School Students | Format school projects and essays | Assignment, Essay, General |
| Legal and Medical Professionals | Format structured professional documents | Legal Brief, Medical Report |

---

**5. New Features — v2.0**

**5.1 Document Type Selection with Format Templates**

The first screen users see will be a document type selection interface. Selecting a document type pre-loads a default format template defining the structural and visual defaults appropriate for that document type. The template is fully editable by the user before formatting begins.

**5.1.1 Supported Document Types and Default Templates**

| Document Type | Default Sections | Font | Spacing | Alignment |
|---|---|---|---|---|
| Research Paper | Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion, References | Times New Roman 12pt | Double | Justify |
| Assignment | Title, Question, Answer Body, Conclusion, References | Arial 12pt | 1.5x | Left |
| Business Report | Executive Summary, Background, Findings, Recommendations, Conclusion | Arial 11pt | Single | Left |
| Project Proposal | Overview, Objectives, Scope, Timeline, Budget, Team, Conclusion | Calibri 11pt | 1.15x | Left |
| Thesis/Dissertation | Abstract, Acknowledgements, TOC, Chapters, Bibliography, Appendix | Times New Roman 12pt | Double | Justify |
| Essay | Introduction, Body Paragraphs, Conclusion | Times New Roman 12pt | Double | Justify |
| Article/Blog Post | Title, Subtitle, Introduction, Sections, Conclusion | Arial 11pt | 1.5x | Left |
| Legal Brief | Case Header, Facts, Issues, Argument, Conclusion | Times New Roman 12pt | Double | Justify |
| Meeting Minutes | Date and Attendees, Agenda, Discussion Points, Action Items | Arial 11pt | Single | Left |
| General/Custom | No predefined sections — fully user-defined | Arial 12pt | 1.5x | Left |

**5.1.2 User Customization Rules**
- After selecting a document type, the default template is pre-loaded but fully editable
- User can add new sections, remove existing sections, and reorder sections via drag-and-drop
- User can override any format setting (font, size, spacing, alignment) per section or globally
- User can save a custom template for future sessions via LocalStorage
- A Reset to Default button restores the original template for the selected document type
- Format preview panel shows a live sample of how the output will look with current settings

**5.1.3 Document Type Selection Edge Cases**

| Edge Case | Expected System Behavior |
|---|---|
| User does not select a document type and proceeds | Default to General template automatically; proceed normally |
| User switches document type after pasting text | Warning: Switching type will re-apply template. Your text is preserved. Confirm to proceed. |
| User selects Research Paper but pastes a recipe | AI maps available content to closest sections; flags all unmapped content for user review |
| User selects General with no predefined sections | AI applies only formatting rules; no structure injection; user defines all sections |
| User saves a custom template and later clears browser storage | Template is lost; show one-time notice: Consider exporting your custom template as JSON |

---

**5.2 AI Detection and Structuring**

After the user pastes their raw text, the AI analyzes the content and maps it to the appropriate sections of the selected document template.

- AI reads raw text and identifies existing section boundaries using heading patterns, keyword detection, and structural heuristics
- Identified sections are mapped to template sections — e.g., text containing methodology keywords maps to the Methodology section
- A confidence score is computed for each mapping; low-confidence mappings are flagged with a visual indicator for user review
- Unmatched content is placed in a Review Zone where users manually assign it to a section
- The AI uses the template as a structural guide, not a rigid constraint

---

**5.3 AI Writing Assistant — Missing Section Generation**

If a required section from the document template is not found in the user's input text, the AI Writing Assistant activates to generate a draft for that missing section.

**5.3.1 Behavior Rules**
- AI WILL generate: missing required sections using context from the existing content provided by the user
- AI WILL NOT rewrite, paraphrase, or alter the user's existing precise content — it only adds what is missing
- All AI-generated sections are clearly marked with a visual badge: [AI Generated — Please Review Before Exporting]
- User can accept, edit, or permanently delete any AI-generated section
- AI uses the document type context as a guiding prompt — e.g., for a Research Paper, the generated Abstract summarizes the body content

**5.3.2 AI Writing Assistant Edge Cases**

| Edge Case | Expected System Behavior |
|---|---|
| User provides zero content — blank input | Show error: Please paste your content before formatting |
| Required section missing AND no context available to generate from | Insert placeholder: [Section Name — Content Required] |
| User content is under 100 words | AI generates draft with warning: Content may be insufficient for selected document type |
| Gemini API rate limit hit during generation | Queue request, show spinner with Generating text, retry automatically after 5 seconds |
| User rejects AI-generated section and leaves it blank | Allow blank section — do not force AI content; blank sections are exported as empty |
| Duplicate sections detected in user input | Detect and show dialog: Duplicate content found. Merge into one section? Yes or No |
| AI generates section with incorrect facts | Badge clearly marks it as AI Generated — user is responsible for reviewing and editing |

---

**5.4 In-Document Image Upload with Changelou Pretext Integration**

Users can insert images directly into the document output at any position between text blocks. The Changelou Pretext library from GitHub is used to ensure that text formatting — font, size, and alignment — is fully preserved above and below any inserted image, resolving a known CSS cascade problem.

**5.4.1 Image Upload Features**
- Image upload button available in the Output Preview toolbar
- User clicks or places cursor at desired insertion point in the output
- File picker opens supporting JPG, PNG, GIF, WEBP, and SVG formats
- Image is inserted at the exact cursor or click position between text blocks
- Resize handles allow user to adjust image width while maintaining aspect ratio
- Alignment options per image: Left, Center, Right, Full Width
- Optional caption field below each image with auto-numbering: Figure 1, Figure 2, etc.
- Text above and below the image retains original font, size, and alignment (guaranteed by Changelou Pretext)

**5.4.2 Image Upload Edge Cases**

| Edge Case | Expected System Behavior |
|---|---|
| Image file exceeds 10MB | Show error: Image too large. Maximum allowed size is 10MB. Please compress and retry. |
| Unsupported file format uploaded | Show error listing supported formats: JPG, PNG, GIF, WEBP, SVG |
| Image inserted before any text — at document start | Allow; image appears as header image with full-width default option |
| Multiple images inserted consecutively | Allow; each image is treated as an independent isolated block |
| Image upload fails due to network error | Show retry button with error message; no partial state corruption |
| User exports Word document containing images | Images embedded as inline objects using docx.js ImageRun |
| User exports PDF containing images | Images captured via html2canvas rasterization and embedded in jsPDF |
| User deletes an image | Image block removed; surrounding text formatting completely unaffected |
| Image has transparent background PNG | Preserve transparency in preview; use white background for PDF export |
| User inserts image in middle of a paragraph | Image is inserted after the current paragraph as a separate block; paragraph remains intact |

---

**5.5 Intelligent Text Chunking for Large Documents**

For documents exceeding 3,000 words (~12 pages), the system automatically activates chunked processing mode. The text is divided into semantically meaningful segments, each processed sequentially by the Gemini API, and results are merged into a single coherent final output.

**5.5.1 Chunking Process**
1. Detect document word count on Format Now click — activate chunking if count exceeds 3,000 words
2. Split text at natural paragraph or section boundaries — never split mid-sentence or mid-paragraph
3. Each chunk is approximately 2,500–3,000 words with a 200-word overlap at boundaries for context continuity
4. Process chunks sequentially: each chunk API call includes the last 200 words of the previous chunk as context
5. Show real-time progress: "Formatting chunk 3 of 8" with an animated progress bar
6. Merge all formatted chunks into a unified output document
7. Run a global consistency pass: normalize heading levels, fonts, and spacing across all chunks
8. If Table of Contents is enabled, regenerate it from the final merged output as the last step

**5.5.2 Chunking Edge Cases**

| Edge Case | Expected System Behavior |
|---|---|
| Single paragraph exceeds 3,000 words | Force-split at the sentence boundary closest to 2,500 words |
| API call fails on one chunk | Retry that chunk up to 3 times with exponential backoff before showing partial error with manual retry option |
| Heading numbering inconsistent across chunk boundaries | Post-merge processing pass re-numbers all headings sequentially |
| TOC entries do not match final headings after merge | Regenerate TOC from final merged output as the last post-processing step |
| User cancels formatting mid-process | Stop processing; preserve already-formatted chunks; offer partial output for download |
| Document is exactly at the 3,000-word threshold | Apply chunking — safer to chunk than to risk API timeout |
| Network goes offline during chunk processing | Pause processing; queue remaining chunks; auto-resume when connection is restored |
| Last chunk contains only a few words | Merge last chunk with the previous chunk before sending to API |

---

**5.6 Professional UI/UX — Guided Step-by-Step Workflow**

The entire user experience is redesigned as a guided multi-step workflow with clear instructions at each stage, eliminating confusion about what to do next.

| Step | Screen Name | User Action | System Response |
|---|---|---|---|
| Step 1 | Document Type Selection | Select document type from cards or dropdown | Pre-load template; show live format preview panel |
| Step 2 | Format Customization | Review and customize default format settings | Live update format preview with each change |
| Step 3 | Content Input | Paste raw text or upload existing document | Validate input; enable Format Now button |
| Step 4 | AI Processing | Click Format Now | Show chunking progress or single spinner; call AI |
| Step 5 | Review and Edit | Review output; make manual edits; insert images | Live editing toolbar; AI-generated badges visible |
| Step 6 | Export | Download as PDF or Word | Generate file and trigger browser download |

**5.6.1 UI Requirements**
- Progress stepper at top of page showing current step number and title
- Each step includes a brief instruction card explaining exactly what to do
- Format preview panel updates in real-time as user changes settings in Step 2
- Back and Next navigation buttons on each step
- Auto-save progress to LocalStorage every 30 seconds from Step 3 onwards
- Mobile responsive design fully functional on tablets and above
- Dark mode toggle available from the very first step

---

**6. Existing v1.0 Features — Retained and Enhanced**

| Feature | v1.0 Status | v2.0 Enhancement |
|---|---|---|
| Gemini API text formatting | Live | Chunking support and document type context added to prompt |
| Font selection (Times New Roman, Arial, Courier) | Live | Per-section font selection added |
| Alignment controls (Left, Center, Right, Justify) | Live | Per-section alignment control added |
| Table of Contents generation | Live | Auto-regenerated after chunked merge |
| PDF Export | Live | Images correctly embedded in PDF output |
| Word (.docx) Export | Live | Images embedded as inline objects |
| Manual output editing toolbar | Live | Extended with image insert button and caption controls |
| Custom Gemini API key input | Live | Retained; user can always use their own free key |
| Live preview panel | Live | Enhanced with step-by-step layout and image rendering |
| Overwrite and Append on re-format | Live | Retained with full chunking awareness |

---

**7. Complete Edge Case Matrix**

**7.1 Input Edge Cases**

| Edge Case | Expected Behavior |
|---|---|
| Empty input text | Disable Format Now button; show tooltip: Please paste your content first |
| Input is only whitespace or line breaks | Treat as empty; show same validation error |
| Input contains only numbers or special characters | Format as body text; no heading detection attempted |
| Input in a non-English language | Process and format; preserve language; apply RTL layout for RTL scripts |
| Input is a mix of languages/code-switching | Format as-is; no translation; mixed language content preserved |
| Input contains raw HTML tags | Strip HTML tags before processing; format plain text only |
| Input contains Markdown syntax | Parse Markdown symbols before AI processing; convert to appropriate structure |
| Input contains plain-text tables | Detect pipe-separated or column-aligned tables; convert to HTML table |
| Input is copy-pasted from a PDF with garbled characters | Best-effort formatting; flag garbled sections with Review Required badge |
| User pastes identical text twice | Detect duplicate content; prompt: Duplicate detected. Deduplicate? Yes or No |

**7.2 Export Edge Cases**

| Edge Case | Expected Behavior |
|---|---|
| Export PDF with 200-page document | Paginate correctly; no content cutoff; show progress during generation |
| Export Word with AI-generated sections | Include "AI Generated Please Review" as a highlighted comment in the Word file |
| Export with empty output panel | Show error: Nothing to export. Please format your document first |
| Export before reviewing AI-generated sections | One-time warning: Document contains AI-generated sections. Review before exporting? with Review and Export Anyway options |
| PDF export fails because browser blocked popup | Show fallback link: Popup blocked. Click here to download your PDF |
| Word export with images larger than 5MB | Compress images to max 800KB before embedding to prevent file size overflow |

---

**8. Non-Functional Requirements**

| Requirement | Specification |
|---|---|
| Performance — Small Document (under 3,000 words) | Format Now completes within 8 seconds |
| Performance — Large Document (10 chunks) | Each chunk within 8 seconds; total within 90 seconds |
| Browser Compatibility | Chrome 110+, Firefox 110+, Edge 110+, Safari 16+ |
| Mobile Responsiveness | Tablet (768px and above) fully functional; mobile below 768px shows read-only preview |
| API Rate Limit Handling | Graceful retry with exponential backoff; user informed of wait time |
| Offline Behavior | Chunking queue paused; in-progress work auto-saved; resumes on reconnect |
| Data Privacy | No user content sent to any server except Gemini API; no content logging |
| LocalStorage | Auto-save every 30 seconds; 5MB limit with graceful overflow handling |
| Accessibility | WCAG 2.1 AA compliance; keyboard navigable; screen reader labels on all controls |
| Initial Page Load | Under 2 seconds on standard broadband connection |

---

**9. Success Metrics**

| KPI | Target |
|---|---|
| Document type template load accuracy | Template loads correctly 100% of the time on selection |
| AI section mapping accuracy | Greater than 85% of sections correctly identified from raw text |
| Missing section generation acceptance rate | User accepts AI-generated sections without editing in over 60% of cases |
| Image insert layout integrity | Zero instances of image insertion causing text formatting breakage |
| Large document chunking success rate | Over 95% of 40+ page documents fully formatted without manual retry |
| Export fidelity | 100% match between preview and exported PDF or Word output |
| Workflow completion rate | Over 70% of users who start Step 1 complete through to Step 6 Export |
| Initial page load time | Under 2 seconds |

---

**10. Development Roadmap**

| Phase | Features | Timeline |
|---|---|---|
| Phase 1 | Document type selection UI and template engine; Steps 1 and 2 workflow | Week 1–2 |
| Phase 2 | Updated Gemini prompts with document type context; section mapping; AI Writing Assistant | Week 3–4 |
| Phase 3 | Text chunking pipeline; progress UI; post-merge consistency pass | Week 5–6 |
| Phase 4 | Changelou Pretext integration; image upload UI; caption system; export embedding | Week 7–8 |
| Phase 5 | Full step-by-step UI redesign; mobile responsive; dark mode; accessibility pass | Week 9–10 |
| Phase 6 | All edge case testing; performance benchmarks; cross-browser testing; bug fixes | Week 11–12 |

---

*TextMorph — FormatFlow | PRD v2.0 | Confidential*