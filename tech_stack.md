# Technology Stack
**Project:** Smart Text Formatting Algorithm

This project is designed as a lightweight, frontend-only Web Application (Single Page Application) for Phase 1 and 2, meaning it runs entirely in the user's browser without requiring a backend server.

## 1. Core Technologies
- **Structure:** `HTML5` (Semantic layout, splitting input/output panels).
- **Styling:** `CSS3` (Vanilla CSS for maximum control and speed. Utilizing CSS Flexbox/Grid for layout patterns, and native CSS custom properties (`var(--name)`) for Dark/Light mode thematic control).
- **Logic & Algorithm:** `Vanilla JavaScript (ES6+)` (No heavy frameworks like React/Vue or bundle runtimes are used for Phase 1 to ensure blazing fast parsing speed and an ultra-lightweight project footprint).

## 2. Data Storage
- **Browser LocalStorage:** `LocalStorage API` used to persistently save and load user-defined custom formatting rulesets across their browsing sessions. Ensures user privacy as no data leaves the browser.

## 3. External Libraries
- **PDF Exporting:** `jsPDF` and `html2canvas` (These libraries will be loaded via secure CDNs to capture the rendered formatted HTML DOM and convert it to a downloadable PDF document).
- **Icons (Optional):** SVG Icons, FontAwesome, or Heroicons (For clean UI elements representing copy, download, undo, redo, and settings).

## 4. Development, Testing & Deployment
- **Version Control:** `Git` & `GitHub` (For source code management).
- **Testing:** 
  - `Jest` or Vanilla JS assert scripts (for unit testing the core text processing and structure detection logic).
  - `Chrome DevTools / Lighthouse` (for performance profiling on 10k+ word documents and ensuring 60 FPS scrolling).
- **Hosting/Deployment:** `GitHub Pages`, `Vercel`, or `Netlify` (Because the application consists entirely of static client-side files, it can be hosted on any static site CDN for free, global, instant delivery).
