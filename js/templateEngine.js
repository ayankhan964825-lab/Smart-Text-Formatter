/**
 * templateEngine.js
 * Manages document type templates with predefined formatting rules and section structures.
 * Now uses the "Structured Sections Array" architecture for strict AI output control.
 */

const DOCUMENT_TEMPLATES = {

  "general": {
    id: "general",
    name: "Normal Structure",
    icon: "📄",
    description: "No predefined sections. AI formats freely based on content.",
    skeleton: [],
    formatting: {
      h1: { fontFamily: "'Times New Roman', serif", fontSize: "16" },
      h2: { fontFamily: "'Times New Roman', serif", fontSize: "16" },
      h3: { fontFamily: "'Times New Roman', serif", fontSize: "14" },
      body: { fontFamily: "'Times New Roman', serif", fontSize: "12" },
      alignment: "left",
      lineSpacing: "1.5"
    },
    promptContext: ""
  },

  "research-paper": {
    id: "research-paper",
    name: "Research Paper",
    icon: "🔬",
    description: "Academic research paper with standard structure.",
    skeleton: [
      { id: "abstract", label: "Abstract", required: true, aliases: ["Summary", "Executive Summary"] },
      { id: "introduction", label: "Introduction", required: true, aliases: ["Background", "Overview"] },
      { id: "literature_review", label: "Literature Review", required: true, aliases: ["Related Work", "Previous Studies", "Literature Survey"] },
      { id: "methodology", label: "Methodology", required: true, aliases: ["Methods", "System Design", "Implementation", "How I did it"] },
      { id: "results", label: "Results", required: true, aliases: ["Findings", "Outcomes", "Data Analysis", "What I found", "Experimental Results", "Results and Discussion"] },
      { id: "discussion", label: "Discussion", required: false, aliases: ["Analysis", "Evaluation"] },
      { id: "conclusion", label: "Conclusion", required: true, aliases: ["Conclusions", "Final Thoughts"] },
      { id: "references", label: "References", required: true, aliases: ["Bibliography", "Citations"] }
    ],
    formatting: {
      h1: { fontFamily: "'Times New Roman', serif", fontSize: "16" },
      h2: { fontFamily: "'Times New Roman', serif", fontSize: "16" },
      h3: { fontFamily: "'Times New Roman', serif", fontSize: "14" },
      body: { fontFamily: "'Times New Roman', serif", fontSize: "12" },
      alignment: "justify",
      lineSpacing: "2.0"
    },
    promptContext: `This is an ACADEMIC RESEARCH PAPER.
- PRESERVE the user's original text EXACTLY. Do NOT rewrite, rephrase, or summarize any paragraph. Only fix OCR typos.
- References section: each reference item inside a section's blocks should use type "references" with an "items" array containing objects with "id" and "text".
- Heading numbering: Use "1. Introduction", "2. Literature Review" etc. for section headings.
- Sub-sections: Use "2.1 Topic", "2.2 Topic" for sub-section headings (these go inside the parent section's blocks array).`
  },

  "assignment": {
    id: "assignment",
    name: "College Assignment",
    icon: "📝",
    description: "Student assignment with question-answer format.",
    skeleton: [
      { id: "title_page", label: "Title Page Info", required: false, aliases: ["Cover Page", "Student Info"] },
      { id: "qna", label: "Questions & Answers", required: true, aliases: ["Answers", "Responses", "Main Content"] },
      { id: "conclusion", label: "Conclusion", required: false, aliases: ["Summary"] },
      { id: "references", label: "References", required: false, aliases: ["Bibliography", "Citations"] }
    ],
    formatting: {
      h1: { fontFamily: "Arial, sans-serif", fontSize: "16" },
      h2: { fontFamily: "Arial, sans-serif", fontSize: "16" },
      h3: { fontFamily: "Arial, sans-serif", fontSize: "14" },
      body: { fontFamily: "Arial, sans-serif", fontSize: "12" },
      alignment: "left",
      lineSpacing: "1.5"
    },
    promptContext: `This is a COLLEGE/UNIVERSITY ASSIGNMENT.
- Detect question numbers (Q1, Q.1, Question 1, 1., etc.) and format them as heading blocks with depth:2 inside the "qna" section.
- Answer text goes under each question as body paragraphs.
- If sub-questions exist (a), b), i., ii.), format them as heading blocks with depth:3.
- PRESERVE the user's original answers EXACTLY. Do NOT rewrite, rephrase, or improve any answer text.
- Preserve any code snippets, formulas, or diagrams exactly as provided.`
  },

  "project-report": {
    id: "project-report",
    name: "Project Report",
    icon: "📋",
    description: "Academic project report with objectives and methodology.",
    skeleton: [
      { id: "title", label: "Project Title", required: true, aliases: ["Title", "Heading"] },
      { id: "overview", label: "Overview", required: true, aliases: ["Introduction", "Executive Summary"] },
      { id: "objectives", label: "Objectives", required: true, aliases: ["Goals", "Aims"] },
      { id: "scope", label: "Scope", required: false, aliases: ["Boundaries", "Limitations"] },
      { id: "methodology", label: "Methodology", required: true, aliases: ["Process", "Execution"] },
      { id: "outcomes", label: "Expected Outcomes", required: true, aliases: ["Results", "Deliverables", "Outcomes", "What was achieved"] },
      { id: "conclusion", label: "Conclusion", required: true, aliases: ["Summary", "Final Thoughts"] }
    ],
    formatting: {
      h1: { fontFamily: "Arial, sans-serif", fontSize: "16" },
      h2: { fontFamily: "Arial, sans-serif", fontSize: "16" },
      h3: { fontFamily: "Arial, sans-serif", fontSize: "14" },
      body: { fontFamily: "Arial, sans-serif", fontSize: "12" },
      alignment: "left",
      lineSpacing: "1.5"
    },
    promptContext: `This is an ACADEMIC PROJECT REPORT document.
- Start with a clear Project Title as a heading block with depth:1.
- Objectives must be formatted as an ordered list (ol type) — clear, measurable goals.
- Scope section defines boundaries of the project.
- Methodology section explains how the project was or will be conducted.
- PRESERVE the user's original text EXACTLY. Do NOT rewrite, rephrase, or add new content.`
  }
};

class TemplateEngine {
  constructor() {
    this.templates = DOCUMENT_TEMPLATES;
    this.selectedTemplateId = 'general';
  }

  getAllTemplates() {
    return Object.values(this.templates);
  }

  getTemplate(id) {
    return this.templates[id] || this.templates["general"];
  }

  selectTemplate(id) {
    this.selectedTemplateId = id;
    return this.getTemplate(id);
  }

  getSelectedTemplate() {
    return this.getTemplate(this.selectedTemplateId || "general");
  }

  /**
   * Builds the structured prompt context for the AI, including skeleton mapping rules
   * and the new "document_sections" array instructions.
   */
  getPromptContext() {
    const template = this.getSelectedTemplate();
    if (!template) return "";

    // For general template with no skeleton and no promptContext, return empty
    if (template.id === 'general' && (!template.skeleton || template.skeleton.length === 0)) return "";

    let context = `\n\n--- DOCUMENT TYPE CONTEXT ---\n`;
    context += `The user has selected document type: "${template.name}".\n`;

    if (template.promptContext) {
      context += template.promptContext;
    }

    if (template.skeleton && template.skeleton.length > 0) {
      context += `\n\n--- STRUCTURAL SKELETON (SECTIONS ARRAY ARCHITECTURE) ---\n`;
      context += `You MUST output sections in a "document_sections" array. Each section object has:\n`;
      context += `  - "template_id": The skeleton ID if it matches a known section, or "none" if it's a custom/unknown section.\n`;
      context += `  - "heading_title": The display title for the section heading (e.g., "1. Introduction").\n`;
      context += `  - "blocks": An array of content blocks (p, table, ul, ol, equation, mermaid, references, code, blockquote, image) that belong under this section.\n\n`;

      context += `SKELETON DEFINITION:\n`;
      context += JSON.stringify(template.skeleton.map(s => ({
        id: s.id,
        label: s.label,
        required: s.required,
        aliases: s.aliases
      })), null, 2);

      context += `\n\nCRITICAL RULES FOR SECTIONS ARRAY:\n`;
      context += `1. ALIAS MATCHING: Use aliases as FALLBACK mapping. If user text has heading "Approach" and no "Methodology" heading, map "Approach" content to template_id "methodology". But if BOTH "Methodology" AND "Approach" exist as separate headings with different content, keep both: one gets template_id "methodology", the other gets template_id "none" (custom section).\n`;
      context += `2. SEQUENCE PRESERVATION: Read the user's text TOP-TO-BOTTOM. Place sections in the array in the EXACT order they appear in the raw text. Do NOT reorder sections to match the skeleton order. Preserve the user's chronological flow.\n`;
      context += `3. CUSTOM SECTIONS (template_id: "none"): If you find a heading in the user's text that does NOT match any skeleton ID or alias, create a section with template_id "none" and set heading_title to the user's original heading text. Place it in the array exactly where it appeared in the text.\n`;
      context += `4. MISSING SECTIONS: If a skeleton section (especially required ones) has NO matching content in the user's text, simply OMIT it from the array. Do NOT hallucinate content. The frontend will detect missing sections and alert the user.\n`;
      context += `5. HEADING DETECTION: If the user's text has no explicit headings but contains content that semantically belongs to a skeleton section, create the section with the appropriate template_id and generate an appropriate heading_title.\n`;
    }

    context += `\n--- END DOCUMENT TYPE CONTEXT ---\n`;
    return context;
  }

  /**
   * Returns the skeleton section IDs for the currently selected template.
   * Used by outputGenerator to compute missing/bonus sections.
   */
  getSkeletonIds() {
    const template = this.getSelectedTemplate();
    if (!template || !template.skeleton) return [];
    return template.skeleton.map(s => s.id);
  }

  /**
   * Returns skeleton sections marked as required.
   */
  getRequiredSections() {
    const template = this.getSelectedTemplate();
    if (!template || !template.skeleton) return [];
    return template.skeleton.filter(s => s.required);
  }

  /**
   * Returns the full skeleton array for the current template.
   */
  getSkeleton() {
    const template = this.getSelectedTemplate();
    if (!template || !template.skeleton) return [];
    return template.skeleton;
  }

  getRibbonDefaults() {
    const template = this.getSelectedTemplate();
    const f = template.formatting;
    return {
      h1: { fontFamily: f.h1.fontFamily, fontSize: f.h1.fontSize },
      h2: { fontFamily: f.h2.fontFamily, fontSize: f.h2.fontSize },
      h3: { fontFamily: f.h3.fontFamily, fontSize: f.h3.fontSize },
      body: { fontFamily: f.body.fontFamily, fontSize: f.body.fontSize },
      alignment: f.alignment
    };
  }
}

window.templateEngine = new TemplateEngine();
