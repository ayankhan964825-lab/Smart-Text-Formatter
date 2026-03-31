/**
 * PERMA Happiness Model — Presentation Engine
 * Navigation, Animations, Particles, Counters, Gestures, Confetti
 */

(() => {
    'use strict';

    // ============================================================
    // CONFIG & STATE
    // ============================================================
    const TOTAL_SLIDES = 12;
    const TRANSITION_DURATION = 800;
    let currentSlide = 1;
    let isTransitioning = false;
    let touchStartX = 0;
    let touchStartY = 0;

    // DOM refs
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progress-bar');
    const slideCounter = document.getElementById('slide-counter');
    const dotsContainer = document.getElementById('slide-dots');
    const prevBtn = document.getElementById('nav-prev');
    const nextBtn = document.getElementById('nav-next');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // ============================================================
    // INITIALIZATION
    // ============================================================
    function init() {
        createDots();
        setupNavigation();
        setupTouchGestures();
        setupKeyboard();
        setupMouseWheel();
        setupHashNavigation();
        initParticles();
        updateUI();
    }

    // ============================================================
    // NAVIGATION DOTS
    // ============================================================
    function createDots() {
        for (let i = 1; i <= TOTAL_SLIDES; i++) {
            const dot = document.createElement('button');
            dot.className = `slide-dot${i === 1 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Go to slide ${i}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    // ============================================================
    // SLIDE NAVIGATION
    // ============================================================
    function goToSlide(n) {
        if (isTransitioning || n === currentSlide || n < 1 || n > TOTAL_SLIDES) return;
        isTransitioning = true;

        const oldSlide = document.getElementById(`slide-${currentSlide}`);
        const newSlide = document.getElementById(`slide-${n}`);
        const goingForward = n > currentSlide;

        // Exit old slide: move it in the opposite direction
        oldSlide.classList.remove('active');
        if (goingForward) {
            oldSlide.classList.add('prev');       // exits to the left
        } else {
            oldSlide.classList.add('next-exit');   // exits to the right
        }

        // Position incoming slide off-screen on the correct side
        newSlide.style.transition = 'none';
        newSlide.style.transform = goingForward ? 'translateX(60px)' : 'translateX(-60px)';
        newSlide.style.opacity = '0';
        newSlide.style.visibility = 'visible';

        // Trigger reflow so the starting position is applied
        void newSlide.offsetWidth;

        // Remove the 'none' override and animate in
        newSlide.style.transition = '';
        newSlide.classList.add('active');
        newSlide.style.transform = '';
        newSlide.style.opacity = '';

        currentSlide = n;
        updateUI();

        // Animate stat counters on the new slide
        animateCounters(newSlide);

        // Confetti on last slide
        if (n === TOTAL_SLIDES) {
            setTimeout(() => launchConfetti(), 1200);
        }

        setTimeout(() => {
            oldSlide.classList.remove('prev', 'next-exit');
            oldSlide.style.visibility = '';
            isTransitioning = false;
        }, TRANSITION_DURATION);
    }

    function nextSlide() {
        if (currentSlide < TOTAL_SLIDES) goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        if (currentSlide > 1) goToSlide(currentSlide - 1);
    }

    // ============================================================
    // UI UPDATES
    // ============================================================
    function updateUI() {
        // Progress bar
        const progress = (currentSlide / TOTAL_SLIDES) * 100;
        progressBar.style.width = `${progress}%`;

        // Counter
        slideCounter.textContent = `${currentSlide} / ${TOTAL_SLIDES}`;

        // Dots
        const dots = dotsContainer.querySelectorAll('.slide-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i + 1 === currentSlide);
        });

        // Nav arrows visibility
        prevBtn.style.opacity = currentSlide === 1 ? '0.2' : '';
        prevBtn.style.pointerEvents = currentSlide === 1 ? 'none' : '';
        nextBtn.style.opacity = currentSlide === TOTAL_SLIDES ? '0.2' : '';
        nextBtn.style.pointerEvents = currentSlide === TOTAL_SLIDES ? 'none' : '';

        // URL hash
        history.replaceState(null, '', `#slide-${currentSlide}`);
    }

    // ============================================================
    // KEYBOARD NAVIGATION
    // ============================================================
    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowLeft':
                case 'Backspace':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'f':
                case 'F':
                    toggleFullscreen();
                    break;
                default:
                    // Number keys 1-9, 0 for 10
                    if (e.key >= '1' && e.key <= '9') {
                        goToSlide(parseInt(e.key));
                    } else if (e.key === '0') {
                        goToSlide(10);
                    }
            }
        });
    }

    // ============================================================
    // BUTTON NAVIGATION
    // ============================================================
    function setupNavigation() {
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    // ============================================================
    // TOUCH GESTURES
    // ============================================================
    function setupTouchGestures() {
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const diffX = e.changedTouches[0].screenX - touchStartX;
            const diffY = e.changedTouches[0].screenY - touchStartY;
            const threshold = 60;

            // Only horizontal swipes (not vertical scrolling)
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
                if (diffX < 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }, { passive: true });
    }

    // ============================================================
    // MOUSE WHEEL (debounced)
    // ============================================================
    function setupMouseWheel() {
        let wheelTimeout = null;
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (wheelTimeout) return;
            wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 800);

            if (e.deltaY > 0 || e.deltaX > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }, { passive: false });
    }

    // ============================================================
    // HASH NAVIGATION
    // ============================================================
    function setupHashNavigation() {
        const hash = window.location.hash;
        if (hash) {
            const match = hash.match(/slide-(\d+)/);
            if (match) {
                const n = parseInt(match[1]);
                if (n >= 1 && n <= TOTAL_SLIDES) {
                    // Jump directly (no animation on load)
                    slides.forEach(s => s.classList.remove('active'));
                    const target = document.getElementById(`slide-${n}`);
                    if (target) {
                        target.classList.add('active');
                        currentSlide = n;
                        updateUI();
                        setTimeout(() => animateCounters(target), 600);
                    }
                }
            }
        } else {
            // Animate first slide counters
            setTimeout(() => animateCounters(slides[0]), 800);
        }
    }

    // ============================================================
    // FULLSCREEN
    // ============================================================
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    // ============================================================
    // ANIMATED COUNTERS
    // ============================================================
    function animateCounters(slideEl) {
        const counters = slideEl.querySelectorAll('.stat-number[data-count]');
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.count);
            const duration = 2000;
            const startTime = performance.now();

            function update(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                counter.textContent = Math.round(target * eased);
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }
            requestAnimationFrame(update);
        });
    }

    // ============================================================
    // PARTICLE SYSTEM (Title Slide)
    // ============================================================
    function initParticles() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animId;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.4 + 0.1;
                this.pulse = Math.random() * Math.PI * 2;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.pulse += 0.02;
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    this.reset();
                }
            }
            draw() {
                const currentOpacity = this.opacity * (0.5 + 0.5 * Math.sin(this.pulse));
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(167, 139, 250, ${currentOpacity})`;
                ctx.fill();
            }
        }

        // Create particles
        const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(167, 139, 250, ${0.06 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(animate);
        }
        animate();
    }

    // ============================================================
    // CONFETTI (Conclusion Slide)
    // ============================================================
    function launchConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#FF375F', '#2997FF', '#BF5AF2', '#30D158', '#FF9F0A', '#FFD60A', '#5AC8FA'];
        const pieces = [];

        for (let i = 0; i < 100; i++) {
            pieces.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 12,
                vy: -(Math.random() * 10 + 4),
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 3,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.15 + Math.random() * 0.1,
                opacity: 1,
                shape: Math.random() > 0.5 ? 'rect' : 'circle'
            });
        }

        let frame = 0;
        function animateConfetti() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;

            pieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.99;
                p.rotation += p.rotSpeed;
                p.opacity -= 0.005;

                if (p.opacity > 0) {
                    alive = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;
                    if (p.shape === 'rect') {
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                    } else {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            });

            frame++;
            if (alive && frame < 300) {
                requestAnimationFrame(animateConfetti);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        requestAnimationFrame(animateConfetti);
    }

    // ============================================================
    // LAUNCH
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    }
})();

// ============================================================
// OOPD PIPELINE INTERACTIVE MODALS
// ============================================================
const PIPELINE_DATA = {
    'TextProcessor': {
        title: 'TextProcessor.js',
        tag: 'PIPELINE STAGE 1',
        code: `class TextProcessor {
  constructor(rawText) {
    this.rawText = rawText;
  }

  normalize() {
    // Unify line endings, trim
    return this.rawText
      .replace(/\\r\\n/g, '\\n')
      .trim();
  }

  tokenize() {
    // Split into logical blocks
    // Intelligent merge of OCR breaks
    return mergedBlocks;
  }
}`,
        output: `> Running TextProcessor.normalize()...
[INFO] Standardized 4 CRLF occurrences to LF.
[INFO] Trimmed leading/trailing whitespace.

> Running TextProcessor.tokenize()...
[DEBUG] Found 12 paragraph breaks.
[DEBUG] Heuristically repaired 3 broken OCR lines.
[SUCCESS] Generated 14 normalized text blocks.`
    },

    'StructureDetector': {
        title: 'StructureDetector.js',
        tag: 'PIPELINE STAGE 2',
        code: `class StructureDetector {
  classifyBlocks(textBlocks) {
    // Identify: h1, h2, p, ul, ol
    // Handle glued headings
    return classifiedElements;
  }

  _detectType(block, index) {
    // Markdown headings: # ## ###
    // Numbered: 1.1, 2.3.1
    // Roman: I. II. III.
    // Lists: - * 1. 2.
    return { type, content };
  }
}`,
        output: `> Running StructureDetector.classifyBlocks(14 blocks)...
[DETECT] Block 1 identified as <h1> via heuristic matching
[DETECT] Block 2 identified as <p> (standard paragraph)
[DETECT] Block 3 identified as <ul> (detected bullet "-")
[DETECT] Block 4 identified as <li>
...
[SUCCESS] Classification complete.
  Detected: 1x Title, 3x Headings, 8x Paragraphs, 2x Lists.`
    },

    'RuleEngine': {
        title: 'RuleEngine.js',
        tag: 'PIPELINE STAGE 3',
        code: `class RuleEngine {
  constructor(customRules) {
    this.defaultRules = {
      h1: { fontSize: '16pt', bold: true },
      p:  { fontSize: '12pt', bold: false }
    };
    // Merge defaults + custom
    this.currentRules = {
      ...this.defaultRules,
      ...customRules
    };
  }

  applyRules(elements) {
    return elements.map(el => ({
      ...el, styleString: this._generateCSS(el.type)
    }));
  }
}`,
        output: `> Initializing RuleEngine...
[INFO] Loaded default metrics: Times New Roman, 12pt paragraph.
[INFO] Merged with Custom Override: { h1: { fontFamily: 'Arial' } }

> Running RuleEngine.applyRules(14 elements)...
[APPLY] -> <h1> -> font-family: 'Arial'; font-size: '16pt'; font-weight: 'bold';
[APPLY] -> <p>  -> font-family: 'Times New Roman'; font-size: '12pt';
...
[SUCCESS] Style injection completed.`
    },

    'OutputGenerator': {
        title: 'OutputGenerator.js',
        tag: 'PIPELINE STAGE 4',
        code: `class OutputGenerator {
  generateHTML(styledElements) {
    // Build semantic HTML tags
    // Handle nested lists, mermaid, tables
    // Keep-with-next grouping
    return htmlParts.join('\\n');
  }

  _cleanMarkdown(str) {
    // **bold** -> <b>
    // *italic* -> <i>
  }

  _escapeHTML(str) {
    // XSS prevention layer
  }
}`,
        output: `> Running OutputGenerator.generateHTML()...
[PROCESS] Escaping XSS vectors across 14 elements...
[BUILD] Opening <html> structure...
[RENDER] Found 1x Mermaid Code block. Retaining raw syntax.
[RENDER] Wrapping <li> elements into parent <ul> tag natively.
...
[SUCCESS] HTML rendered cleanly. Output byte size: 4.2kb.
> Execution finished in 12ms.`
    },

    'AIFormatter': {
        title: 'AIFormatter.js',
        tag: 'AI EXTENSION',
        code: `class AIFormatter {
  async formatText(rawText) {
    // PATH 1: Custom API key -> Direct Gemini call
    // PATH 2: No key -> Server proxy fallback
    
    // const params = this._buildPrompt(rawText);
    // const res = await fetch('/api/format');
    // return validation;
  }

  async fixMermaid(code, err) {
    // Auto-heal broken diagrams
    // using Gemini as validator
  }
}`,
        output: `> Running AIFormatter.formatText()...
[INFO] No custom API key detected. Routing to Proxy mode...
[NETWORK] Fetching https://gemini-proxy/api/format ...
[DEBUG] Awaiting Gemini 2.5 Flash Response...
[NETWORK] 200 OK Response received (240ms).
[PARSE] Validating Semantic JSON structure...
[SUCCESS] Payload integrated successfully. Engine bypass succeeded.`
    },

    'DocxExporter': {
        title: 'DocxExporter.js',
        tag: 'EXPORT EXTENSION',
        code: `const DocxExporter = (() => {
  function toWordML(container) {
    // DOM -> OpenXML WordML
    // Handles: h1-h6, p, lists, tables, images
  }

  async function generate(el) {
    // Build full DOCX ZIP via JSZip library
    return zip.generateAsync({
      type: 'blob'
    });
  }

  return { generate };
})();`,
        output: `> Running DocxExporter.generate(DOMNode)...
[INFO] Resolving relative CSS metrics to OpenXML DPI constraints...
[XML] Opening word/document.xml tree...
[XML] Translating HTML <h1> -> w:pPr w:pStyle="Heading1"
[XML] Translating HTML <p>  -> w:pPr w:pStyle="Normal"
[ZIP] Compressing OpenXML directories...
[SUCCESS] Blob generated (MIME: application/vnd.openxmlformats-officedocument)
> Output File: document_export.docx`
    }
};

window.openOOPDModal = function(classId) {
    const data = PIPELINE_DATA[classId];
    if (!data) return;

    let modalOverlay = document.getElementById('oopd-global-modal');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'oopd-global-modal';
        modalOverlay.className = 'oopd-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="oopd-modal">
                <div class="modal-topbar">
                    <div class="modal-title-group">
                        <span class="class-tag" id="oopd-modal-tag"></span>
                        <h3 class="modal-title" id="oopd-modal-title"></h3>
                    </div>
                    <button class="modal-close-btn" onclick="closeOOPDModal()">×</button>
                </div>
                <div class="modal-split">
                    <div class="modal-panel modal-panel-left">
                        <div class="modal-panel-header">Source Code</div>
                        <div class="modal-panel-content">
                            <pre id="oopd-modal-code"></pre>
                        </div>
                    </div>
                    <div class="modal-panel modal-panel-right">
                        <div class="modal-panel-header">Execution Output</div>
                        <div class="modal-panel-content">
                            <pre id="oopd-modal-output"></pre>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeOOPDModal();
        });
    }

    document.getElementById('oopd-modal-tag').textContent = data.tag;
    document.getElementById('oopd-modal-title').textContent = data.title;
    document.getElementById('oopd-modal-code').textContent = data.code;
    document.getElementById('oopd-modal-output').textContent = data.output;

    modalOverlay.style.display = 'flex';
    // trigger reflow
    void modalOverlay.offsetWidth;
    modalOverlay.classList.add('show');
};

window.closeOOPDModal = function() {
    const modalOverlay = document.getElementById('oopd-global-modal');
    if (modalOverlay) {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300); // match css transition
    }
};
