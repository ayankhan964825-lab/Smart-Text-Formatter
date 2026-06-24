/**
 * templateEngine.js
 * Manages document type templates with predefined formatting rules and section structures.
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
      { id: "literature_review", label: "Literature Review", required: false, aliases: ["Related Work", "Previous Studies"] },
      { id: "methodology", label: "Methodology", required: true, aliases: ["Approach", "Methods", "System Design", "Implementation", "How I did it"] },
      { id: "results", label: "Results", required: false, aliases: ["Findings", "Outcomes", "Data Analysis", "What I found"] },
      { id: "discussion", label: "Discussion", required: false, aliases: ["Analysis", "Evaluation"] },
      { id: "conclusion", label: "Conclusion", required: true, aliases: ["Conclusions", "Final Thoughts"] },
      { id: "references", label: "References", required: true, aliases: ["Bibliography", "Citations"] }
    ],
    formatting: {
      h1: { fontFamily: "'Times New Roman', serif", fontSize: "16" },
      h2: { fontFamily: "'Times New Roman', serif", fontSize: "14" },
      h3: { fontFamily: "'Times New Roman', serif", fontSize: "13" },
      body: { fontFamily: "'Times New Roman', serif", fontSize: "12" },
      alignment: "justify",
      lineSpacing: "2.0"
    },
    promptContext: `This is an ACADEMIC RESEARCH PAPER. Follow these structural rules:
- You MUST use the 'heading' type with depth values: depth:1 for the document title, depth:2 for main sections (Abstract, Introduction, etc.), depth:3 for sub-sections (1.1, 2.1, etc.).
- DO NOT use old types like h1, h2, or sub-subheading. ONLY use 'heading' with the correct depth.
- If the user's text contains content that belongs to skeleton sections but has no explicit heading, YOU MUST create the appropriate heading block and place the content under it.
- Abstract should be a single concise paragraph summarizing the entire paper.
- References section must use the 'references' type with an items array, NOT a plain paragraph.
- Use formal academic tone throughout. Do NOT add casual language.
- Heading numbering: Use "1. Introduction", "2. Literature Review" etc. for depth:2 headings.
- Sub-sections: Use "2.1 Topic", "2.2 Topic" for depth:3 headings.`
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
      h2: { fontFamily: "Arial, sans-serif", fontSize: "14" },
      h3: { fontFamily: "Arial, sans-serif", fontSize: "13" },
      body: { fontFamily: "Arial, sans-serif", fontSize: "12" },
      alignment: "left",
      lineSpacing: "1.5"
    },
    promptContext: `This is a COLLEGE/UNIVERSITY ASSIGNMENT. Follow these rules:
- You MUST use the 'heading' type with depth values: depth:1 for document/assignment title, depth:2 for question headings, depth:3 for sub-questions.
- DO NOT use old types like h1, h2, or sub-subheading.
- Detect question numbers (Q1, Q.1, Question 1, 1., etc.) and format them as heading blocks with depth:2.
- Answer text goes under each question as body paragraphs.
- If sub-questions exist (a), b), i., ii.), format them as heading blocks with depth:3.
- Preserve any code snippets, formulas, or diagrams exactly as provided.
- Keep the tone semi-formal and educational.`
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
      { id: "methodology", label: "Methodology", required: true, aliases: ["Approach", "Process", "Execution"] },
      { id: "outcomes", label: "Expected Outcomes", required: false, aliases: ["Results", "Deliverables"] },
      { id: "conclusion", label: "Conclusion", required: true, aliases: ["Summary", "Final Thoughts"] }
    ],
    formatting: {
      h1: { fontFamily: "Arial, sans-serif", fontSize: "16" },
      h2: { fontFamily: "Arial, sans-serif", fontSize: "14" },
      h3: { fontFamily: "Arial, sans-serif", fontSize: "12" },
      body: { fontFamily: "Arial, sans-serif", fontSize: "11" },
      alignment: "left",
      lineSpacing: "1.5"
    },
    promptContext: `This is an ACADEMIC PROJECT REPORT document. Follow these rules:
- You MUST use the 'heading' type with depth values: depth:1 for the Project Title, depth:2 for main sections (Overview, Objectives, etc.), depth:3 for sub-sections.
- DO NOT use old types like h1, h2, or sub-subheading.
- Start with a clear Project Title as a heading block with depth:1.
- Objectives must be formatted as an ordered list (ol type) — clear, measurable goals.
- Scope section defines boundaries of the project.
- Methodology section explains how the project was or will be conducted.
- Keep the tone formal, factual, and persuasive.`
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
      context += `\n\n--- STRUCTURAL SKELETON ---\n`;
      context += `You MUST map the user's content to the following skeleton. The 'label' is the section name, 'aliases' are alternative names the user may have used for the same section.\n`;
      context += `skeleton_definition = ${JSON.stringify(template.skeleton, null, 2)}\n`;
      context += `\nCRITICAL RULES FOR SKELETON MAPPING:\n`;
      context += `1. Do NOT look for exact word matches. Map content based on SEMANTIC MEANING using the aliases array.\n`;
      context += `2. Output sections in the ORDER they appear in the skeleton_definition array.\n`;
      context += `3. If a section has required:true but is MISSING from the user text, append this at the end: {"type":"info","content":"Missing required sections: [section name]"}\n`;
      context += `4. If a section has required:false and is missing, simply OMIT it. Do NOT hallucinate content.\n`;
    }

    context += `\n--- END DOCUMENT TYPE CONTEXT ---\n`;
    return context;
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
