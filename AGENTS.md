# Aura PDF — Project Guidelines (Oct 2026 Standard)
- **Ecosystem**: Native Vanilla HTML5 + ES Modules + IndexedDB (db.js) + Service Worker PWA (sw.js) + PDF.js + Tesseract OCR + Obsidian Export.
- **Remote Repo**: Tracked on GitHub (dityasalarom-maker/aura-pdf.git).

## Strict Scope Boundaries (NO BUNDLERS)
- **CRITICAL**: STRICTLY ZERO BUNDLERS. Never install npm, Vite, Webpack, or external node packages. Keep all logic in native ES modules.
- Preserve offline-first IndexedDB schema and decoupled OCR extraction.

## Judgment Boundaries
- **NEVER**: Modify db.js schema without an explicit migration plan.
- **ALWAYS**: Test changes directly via launch.bat in browser. Tasks execute via docs/tasks/TASK-XX.md.
