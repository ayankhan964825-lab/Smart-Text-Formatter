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
    sections: [],
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
    sections: ["Abstract", "Introduction", "Literature Review", "Methodology", "Results", "Discussion", "Conclusion", "References"],
    formatting: {
      h1: { fontFamily: "'Times New Roman', serif", fontSize: "16" },
      h2: { fontFamily: "'Times New Roman', serif", fontSize: "14" },
      h3: { fontFamily: "'Times New Roman', serif", fontSize: "13" },
      body: { fontFamily: "'Times New Roman', serif", fontSize: "12" },
      alignment: "justify",
      lineSpacing: "2.0"
    },
    promptContext: `This is an ACADEMIC RESEARCH PAPER. Follow these structural rules:
- Expected sections (in order): Abstract, Introduction, Literature Review, Methodology, Results & Discussion, Conclusion, References.
- If the user's text contains content that belongs to these sections but doesn't have explicit headings, YOU MUST create the appropriate h2 headings and place the content under them.
- Abstract should be a single concise paragraph summarizing the entire paper.
- References section should preserve citation formatting exactly as provided.
- Use formal academic tone throughout. Do NOT add casual language.
- Heading numbering: Use "1. Introduction", "2. Literature Review" etc. for h2 headings.
- Sub-sections: Use "2.1 Topic", "2.2 Topic" for sub-subheadings.`
  },

  "assignment": {
    id: "assignment",
    name: "College Assignment",
    icon: "📝",
    description: "Student assignment with question-answer format.",
    sections: ["Title Page Info", "Questions & Answers", "Conclusion", "References"],
    formatting: {
      h1: { fontFamily: "Arial, sans-serif", fontSize: "16" },
      h2: { fontFamily: "Arial, sans-serif", fontSize: "14" },
      h3: { fontFamily: "Arial, sans-serif", fontSize: "13" },
      body: { fontFamily: "Arial, sans-serif", fontSize: "12" },
      alignment: "left",
      lineSpacing: "1.5"
    },
    promptContext: `This is a COLLEGE/UNIVERSITY ASSIGNMENT. Follow these rules:
- Detect question numbers (Q1, Q.1, Question 1, 1., etc.) and format them as h2 headings.
- Answer text goes under each question as body paragraphs.
- If sub-questions exist (a), b), i., ii.), format them as sub-subheadings.
- Preserve any code snippets, formulas, or diagrams exactly as provided.
- Keep the tone semi-formal and educational.`
  },

  "project-report": {
    id: "project-report",
    name: "Project Report",
    icon: "📋",
    description: "Academic project report with objectives and methodology.",
    sections: ["Project Title", "Overview", "Objectives", "Scope", "Methodology", "Expected Outcomes", "Conclusion"],
    formatting: {
      h1: { fontFamily: "Arial, sans-serif", fontSize: "16" },
      h2: { fontFamily: "Arial, sans-serif", fontSize: "14" },
      h3: { fontFamily: "Arial, sans-serif", fontSize: "12" },
      body: { fontFamily: "Arial, sans-serif", fontSize: "11" },
      alignment: "left",
      lineSpacing: "1.5"
    },
    promptContext: `This is an ACADEMIC PROJECT REPORT document. Follow these rules:
- Start with a clear Project Title (h1) and Overview section.
- Objectives should be formatted as a numbered list (ol) — clear, measurable goals.
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
    if (!template || template.id === 'general' || !template.promptContext) return "";

    let context = `\n\n--- DOCUMENT TYPE CONTEXT ---\n`;
    context += `The user has selected document type: "${template.name}".\n`;
    context += template.promptContext;

    if (template.sections.length > 0) {
      context += `\n\nExpected sections for this document type (in order): ${template.sections.join(", ")}.`;
      context += `\nMap the user's content to these sections where possible. If a section is clearly missing from the user's text, you may skip it — do NOT hallucinate content that doesn't exist in the input.`;
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
