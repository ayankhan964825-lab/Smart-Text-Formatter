/**
 * ruleEngine.js
 * Responsible for holding default formatting rules and applying them 
 * to structured ElementObjects.
 */

class RuleEngine {
    constructor(customRibbonRules = null) {
        // Default rules mapped directly to Word OpenXML (docxExporter.js) specifications:
        // H1: 16pt, bold, centered, uppercase (360 twips before = 18pt, 240 twips after = 12pt)
        // H2: 16pt, bold, left, uppercase (300 twips before = 15pt, 200 twips after = 10pt)
        // H3: 14pt, bold, left (240 twips before = 12pt, 160 twips after = 8pt)
        // Body (p): 12pt, line-height 1.6, justify (160 twips after = 8pt)
        this.defaultRules = {
            // ── New unified heading type (replaces h1/h2/sub-subheading) ──
            'heading-1': {
                'font-family': "'Times New Roman', serif",
                'font-size': '16pt',
                'font-weight': '700',
                'text-align': 'center',
                'text-transform': 'uppercase',
                'margin-top': '18pt',
                'margin-bottom': '12pt'
            },
            'heading-2': {
                'font-family': "'Times New Roman', serif",
                'font-size': '16pt',
                'font-weight': '700',
                'text-align': 'left',
                'text-transform': 'uppercase',
                'margin-top': '15pt',
                'margin-bottom': '10pt'
            },
            'heading-3': {
                'font-family': "'Times New Roman', serif",
                'font-size': '14pt',
                'font-weight': '700',
                'text-align': 'left',
                'margin-top': '12pt',
                'margin-bottom': '8pt'
            },
            // ── Backward-compat old types ──
            h1: {
                'font-family': "'Times New Roman', serif",
                'font-size': '16pt',
                'font-weight': '700',
                'text-align': 'center',
                'text-transform': 'uppercase',
                'margin-top': '18pt',
                'margin-bottom': '12pt'
            },
            h2: {
                'font-family': "'Times New Roman', serif",
                'font-size': '16pt',
                'font-weight': '700',
                'text-align': 'left',
                'text-transform': 'uppercase',
                'margin-top': '15pt',
                'margin-bottom': '10pt'
            },
            h3: {
                'font-family': "'Times New Roman', serif",
                'font-size': '14pt',
                'font-weight': '700',
                'text-align': 'left',
                'margin-top': '12pt',
                'margin-bottom': '8pt'
            },
            p: {
                'font-family': "'Times New Roman', serif",
                'font-size': '12pt',
                'line-height': '1.6',
                'text-align': 'justify',
                'text-justify': 'inter-word',
                'margin-bottom': '8pt'
            },
            ul: {
                'font-family': "'Times New Roman', serif",
                'font-size': '12pt',
                'line-height': '1.6',
                'margin-bottom': '8pt',
                'padding-left': '0.5in'
            },
            ol: {
                'font-family': "'Times New Roman', serif",
                'font-size': '12pt',
                'line-height': '1.6',
                'margin-bottom': '8pt',
                'padding-left': '0.5in'
            },
            li: {
                'font-family': "'Times New Roman', serif",
                'font-size': '12pt',
                'line-height': '1.6',
                'margin-bottom': '4pt'
            },
            'sub-subheading': {
                'font-family': "'Times New Roman', serif",
                'font-size': '14pt',
                'font-weight': '700',
                'margin-top': '12pt',
                'margin-bottom': '8pt',
                'page-break-after': 'avoid'
            }
        };

        // Merge defaults with active template formatting if available
        if (typeof window !== 'undefined' && window.templateEngine && window.templateEngine.getSelectedTemplate) {
            const tmpl = window.templateEngine.getSelectedTemplate();
            if (tmpl && tmpl.formatting) {
                const fmt = tmpl.formatting;
                if (fmt.alignment) {
                    this.defaultRules.p['text-align'] = fmt.alignment;
                }
                if (fmt.lineSpacing) {
                    this.defaultRules.p['line-height'] = fmt.lineSpacing;
                }
            }
        }

        // Merge defaults with ribbon overrides
        this.currentRules = { ...this.defaultRules };

        if (customRibbonRules) {
            // Handle specific tag rules
            for (const tag in customRibbonRules) {
                if (tag !== 'global' && this.currentRules[tag]) {
                    this.currentRules[tag] = {
                        ...this.currentRules[tag],
                        ...customRibbonRules[tag]
                    };
                }
            }
            // Store global rules separately
            this.globalRules = customRibbonRules.global || {};
        } else {
            this.globalRules = {};
        }
    }

    /**
     * Applies styling rules to the logical elements
     * @param {Array<Object>} elements 
     * @returns {Array<Object>} Styled elements with `.styleString` attached
     */
    applyRules(elements) {
        if (!elements || elements.length === 0) return [];

        return elements.map(element => {
            // For the new 'heading' type, look up rules by depth
            let ruleKey = element.type;
            if (element.type === 'heading') {
                const depth = parseInt(element.depth, 10) || 1;
                ruleKey = `heading-${depth}`;
            }

            const rules = this.currentRules[ruleKey] || {};

            // Merge specific tag rules with global text alignment rules
            const combinedRules = { ...rules, ...this.globalRules };

            // Build inline CSS string from rule object
            const styleString = Object.entries(combinedRules)
                .map(([key, value]) => `${key}: ${value};`)
                .join(' ');

            return {
                ...element,
                styleString
            };
        });
    }
}

// Export for usage in app.js
window.RuleEngine = RuleEngine;
