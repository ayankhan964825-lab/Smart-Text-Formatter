/**
 * Smart Text Formatter — OOPD Presentation
 * Cinematic Slide Navigation & Animation Controller
 */

(function () {
    'use strict';

    const TOTAL_SLIDES = 12;
    let currentSlide = 1;
    let isTransitioning = false;

    // DOM Elements
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progress-bar');
    const slideCounter = document.getElementById('slide-counter');
    const navPrev = document.getElementById('nav-prev');
    const navNext = document.getElementById('nav-next');

    // ---- Initialize ----
    function init() {
        updateUI();
        setupKeyboardNav();
        setupClickNav();
        setupTouchNav();
        setupArrowButtons();

        // Preload — show first slide with cinematic entry
        requestAnimationFrame(() => {
            const firstSlide = document.getElementById('slide-1');
            firstSlide.classList.add('active');
            firstSlide.classList.add('transition-fade-in');
        });
    }

    // ---- Go to Slide ----
    function goToSlide(n) {
        if (n < 1 || n > TOTAL_SLIDES || n === currentSlide || isTransitioning) return;

        isTransitioning = true;

        const currentEl = document.getElementById('slide-' + currentSlide);
        const nextEl = document.getElementById('slide-' + n);

        // Phase 1: Fade out current slide
        currentEl.classList.remove('transition-fade-in');
        currentEl.classList.add('transition-fade-out');

        // Phase 2: After fade-out completes, switch slides
        setTimeout(() => {
            // Deactivate old slide
            currentEl.classList.remove('active', 'transition-fade-out');
            resetAnimations(currentEl);

            // Activate new slide
            currentSlide = n;
            nextEl.classList.add('active');

            // Trigger blur-to-sharp fade-in
            requestAnimationFrame(() => {
                nextEl.classList.add('transition-fade-in');
                activateAnimations(nextEl);
            });

            updateUI();
        }, 450); // Matches fade-out animation duration

        // Allow next transition after everything settles
        setTimeout(() => {
            isTransitioning = false;
        }, 1200);
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // ---- Reset Animations ----
    function resetAnimations(slideEl) {
        const items = slideEl.querySelectorAll('.animate-in');
        items.forEach(item => {
            item.style.removeProperty('opacity');
            item.style.removeProperty('transform');
            item.style.removeProperty('filter');
            item.style.removeProperty('transition');
            item.classList.add('reset');
        });
    }

    function activateAnimations(slideEl) {
        const items = slideEl.querySelectorAll('.animate-in.reset');
        // Force reflow before removing reset class
        void slideEl.offsetHeight;
        // Small delay to ensure the slide is fully visible before triggering stagger
        setTimeout(() => {
            items.forEach(item => {
                item.classList.remove('reset');
            });
        }, 80);
    }

    // ---- Update UI ----
    function updateUI() {
        // Progress bar
        const progress = (currentSlide / TOTAL_SLIDES) * 100;
        progressBar.style.width = progress + '%';

        // Counter
        slideCounter.textContent = currentSlide + ' / ' + TOTAL_SLIDES;

        // Arrow visibility
        navPrev.classList.toggle('visible', currentSlide > 1);
        navNext.classList.toggle('visible', currentSlide < TOTAL_SLIDES);
    }

    // ---- Keyboard Navigation ----
    function setupKeyboardNav() {
        document.addEventListener('keydown', function (e) {
            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                case ' ':
                case 'PageDown':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'Backspace':
                case 'PageUp':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    goToSlide(1);
                    break;
                case 'End':
                    e.preventDefault();
                    goToSlide(TOTAL_SLIDES);
                    break;
                case 'f':
                case 'F':
                    // Toggle fullscreen
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(() => {});
                    } else {
                        document.exitFullscreen().catch(() => {});
                    }
                    break;
            }
        });
    }

    // ---- Click Navigation ----
    function setupClickNav() {
        document.addEventListener('click', function (e) {
            if (e.target.closest('.nav-arrow') || e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            const x = e.clientX / window.innerWidth;
            if (x < 0.25) {
                prevSlide();
            } else if (x > 0.75) {
                nextSlide();
            }
        });
    }

    // ---- Touch / Swipe Navigation ----
    function setupTouchNav() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', function (e) {
            const dx = e.changedTouches[0].screenX - touchStartX;
            const dy = e.changedTouches[0].screenY - touchStartY;

            if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

            if (dx < 0) nextSlide();
            else prevSlide();
        }, { passive: true });
    }

    // ---- Arrow Button Navigation ----
    function setupArrowButtons() {
        navPrev.addEventListener('click', function (e) {
            e.stopPropagation();
            prevSlide();
        });
        navNext.addEventListener('click', function (e) {
            e.stopPropagation();
            nextSlide();
        });
    }

    // ---- Start ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
