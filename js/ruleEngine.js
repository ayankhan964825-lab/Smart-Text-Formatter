/**
 * ruleEngine.js
 * Responsible for holding default formatting rules and applying them 
 * to structured ElementObjects.
 */

class RuleEngine {
    constructor(customRibbonRules = null) {
        // Default rules mapped directly to CSS inline styles
        this.defaultRules = {
            h1: {
                'font-size': '16pt',
                'font-weight': '700',
                'color': '#212529',
                'margin-bottom': '1rem',
                'border-bottom': '2px solid #DEE2E6',
                'padding-bottom': '0.5rem'
            },
            h2: {
                'font-size': '14pt',
                'font-weight': '600',
                'color': '#212529',
                'margin-bottom': '0.75rem',
                'margin-top': '1.5rem'
            },
            h3: {
                'font-size': '12pt',
                'font-weight': '600',
                'color': '#495057',
                'margin-bottom': '0.5rem',
                'margin-top': '1rem'
            },
            p: {
                'font-size': '12pt',
                'line-height': '1.6',
                'color': '#333333',
                'margin-bottom': '1rem'
            },
            ul: {
                'margin-bottom': '1rem',
                'padding-left': '2rem'
            },
            ol: {
                'margin-bottom': '1rem',
                'padding-left': '2rem'
            },
            li: {
                'font-size': '12pt',
                'line-height': '1.6',
                'margin-bottom': '0.5rem'
            },
            'sub-subheading': {
                'font-size': '12pt',      // Body size
                'font-weight': '700',     // Bold to stand out as a heading
                'color': '#212529',
                'margin-bottom': '0.75rem',
                'margin-top': '1.25rem'
            }
        };

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
            const rules = this.currentRules[element.type] || {};

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
