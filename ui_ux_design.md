# UI/UX & Design Document
**Project:** Smart Text Formatting Algorithm

## 1. Design Philosophy
- **Clean & Minimal:** Focus on content with an uncluttered interface, giving priority to readability.
- **Real-Time Feedback:** Instant preview of formatted text without needing to click a "Format" button.
- **Accessibility:** High contrast, keyboard navigable, and visually distinct elements.

## 2. Layout Structure
The application uses a Single Page Application (SPA) architecture with a **Split-Panel Layout**:
- **Header/Top Bar:** Contains application title, Dark/Light mode toggle, and global actions (e.g., Undo/Redo).
- **Left Panel (Input):** A plain text editor textarea where the user types or pastes unstructured raw text.
- **Right Panel (Preview):** A scrollable container displaying the live, formatted HTML output.
- **Sidebar/Modal (Formatting Rules):** A toggleable interface to customize element-specific styles (H1, H2, Paragraph, Lists).
- **Bottom Bar:** Export actions (Copy HTML, Download HTML, Export to PDF, Export to Word).

## 3. Typography & Colors (Suggested)
- **Primary Font:** Inter, Roboto, or system-ui (for a clean, modern look).
- **Monospace Font (Code blocks):** Fira Code, Consolas, or Courier New.
- **Color Palette (Light Mode):**
  - Background: `#F8F9FA`
  - Surface (Panels): `#FFFFFF`
  - Text: `#212529`
  - Borders: `#E9ECEF`
  - Accent/Primary: `#0D6EFD` (Blue) for action buttons.
- **Color Palette (Dark Mode):**
  - Background: `#121212`
  - Surface (Panels): `#1E1E1E`
  - Text: `#E0E0E0`
  - Borders: `#333333`
  - Accent/Primary: `#66B2FF`

## 4. User Interactions
- **Live Preview:** As the user types in the left panel, the right panel updates automatically (using debouncing to prevent lag).
- **Custom Rule Application:** When a user changes a rule (e.g., changes H1 font size or color), the preview pane updates instantly.
- **Exporting:** Provides visual feedback (like a toast notification) upon successful PDF/Word/HTML export or copying to clipboard.
