---
title: "Personal PDF Reader — Full Available Project Context"
project: "Personal PDF Reader"
document_type: "Conversation Context Record and Project Specification Archive"
status: "Context archive; not a verbatim complete chat export"
version: "1.0.0"
created: "2026-10-14"
updated: "2026-10-14"
tags:
  - pdf-reader
  - antigravity-ide
  - conversation-context
  - OCR
  - Hindi
  - English
  - project-archive
---

# Personal PDF Reader — Full Available Project Context

## 1. Important scope and fidelity notice

This file is a **full available project-context record**, not a guaranteed verbatim export of every message in the original chat.

It preserves:
- The original project request verbatim as available in the current conversation.
- The substantive technical requirements, architecture options, limitations, and implementation decisions discussed.
- The current project specification, including both Antigravity prompts, acceptance tests, source register, data model, and phased plan.
- The questions and status clarifications made about the Markdown files.

It cannot guarantee:
- Every sentence of every earlier assistant response is reproduced verbatim.
- Hidden system/developer instructions or private internal reasoning.
- Exact content from any earlier message that is no longer available in the conversation context.

**How to interpret this archive**
- **VERBATIM AVAILABLE:** wording reproduced from a user message or available document.
- **STRUCTURED RECORD:** content consolidated from the available project discussion.
- **NOT RECOVERABLE VERBATIM:** exact wording is not available and is not fabricated.

The separate `PERSONAL_PDF_READER_PROJECT.md` remains the concise operational specification. This file is intended to preserve more project context for future work in Antigravity.

## 2. Project identity and objective

**Project name:** Personal PDF Reader

**Target development environment:** Google Antigravity IDE.

**Primary objective:** Build a personal PDF reader that combines bilingual PDF reading, OCR, reading customization, annotations, document organisation, and source-linked capture of selected passages into TXT or Markdown notes.

**Distinctive workflow:** Select text in a PDF → show a concise popup → choose TXT or Markdown → search for an existing note or create one → append the selected passage safely → preserve the source PDF and page reference → remember recent/last-used destinations.

**Status as of 2026-10-14:** Documentation/specification created. Application implementation has not been performed or verified in this conversation.

## 3. Original user request — verbatim as available

> can I make my own pdf reader using anti gravity ide which can rescale text hindi and english, ocr detectable or non detectable pdf files , font size color change , background color change schemes upto atleast 12 types , adaptable to all of this and zooms of different levels , where when I open a pdf then 2 option -direct open (last page or 1st page and remember settings) , highlights , book marks , easy copy paste selected portion into a file  under this viewer like ( If I select some text then after copy it will show a small concise pop up section asking for pasting ( note txt markdown as it is copy format , name of the file to paste into , option to create new file and save there , having search bar to search file by name and select for pasting, should remember last paste file and show in quick pop with all these for easy pasting) , themes , categories for pdfs , and all else what you think would require or need in a pdf reader

## 4. User's follow-up — verbatim

> Is ur md file has full chat data or selective?

## 5. Assistant's answer about the first Markdown file — verbatim

The MD file contains **selective, structured project data—not the full chat transcript.**

| Content | Included? |
|---|---|
| Your original PDF reader requirements | Yes, summarised and organised |
| All major features discussed | Yes |
| Recommended architecture and technologies | Yes |
| 12 themes and Hindi/English OCR requirements | Yes |
| Selection-to-note workflow | Yes |
| Antigravity Phase 0 and Phase 1 prompts | Yes |
| Implementation phases and acceptance tests | Yes |
| Every message from our conversation, verbatim | No |
| Every explanation, discussion and detail exactly as written in chat | No |
| Complete chat metadata and message history | No |

**My recommendation:** Keep the current MD as the *project specification*. If you want Antigravity to retain the complete reasoning, requirements, alternatives, limitations and exact discussion, create a separate **full-context project record** rather than replacing this specification with a raw transcript.

I can create that as a second Markdown file containing the full available project-related conversation, preserving the original wording wherever available and clearly marking any portions that cannot be recovered verbatim.

## 6. User's instruction to create the full-context record

> Yes do

## 7. Requirements and decisions consolidated from the available discussion

### 7.1 Reader and document library
- Import and open PDFs.
- Show document metadata and organise documents into categories, collections, and tags.
- Search by filename/title/author/tags, and later across extracted/OCR text.
- Provide **Resume Reading** and **Start from Page 1**.
- Restore reading position and applicable settings per document.
- Keep global defaults separate from document-specific overrides.
- Handle unavailable, moved, malformed, and password-protected documents gracefully.

### 7.2 Reading modes and display
- Preserve original PDF layout as the default.
- Provide zoom, fit-to-page, fit-to-width, navigation, rotation, and supported page layout modes.
- Provide reflowed text when extraction quality and document structure make it practical.
- Support font-size and typography controls in reflow mode.
- Offer at least 12 distinct themes:
  1. Classic Light
  2. Night
  3. Warm Sepia
  4. Soft Green
  5. Cool Blue
  6. Soft Rose
  7. Lavender
  8. Paper
  9. Midnight Blue
  10. Warm Dark
  11. Cream
  12. Amber Night
- Allow text/background/selection/highlight color controls where technically supported.
- Do not claim all original PDF content can be recolored or reflowed perfectly.

### 7.3 Hindi/English extraction and OCR
- Support selectable/extractable Hindi and English text.
- For image-only scans, render PDF pages to images before image-based OCR.
- Evaluate Hindi (`hin`) and English (`eng`) language-data support.
- Support page-level and batch OCR where feasible.
- Report progress, cancellation, errors, and limitations.
- Keep the original PDF unchanged by default.
- Preserve page references and coordinates where available.
- Evaluate OCR against known sample text; do not assume accuracy merely because processing completes.

### 7.4 Selection-to-note workflow
- Show a compact popup after text selection.
- Show selected-text preview.
- Offer TXT and Markdown.
- Search existing destination files by name.
- Select an existing destination or create a new file.
- Remember the last-used destination and recent destinations.
- Support safe append without silent overwrites.
- Preserve Unicode Hindi, punctuation, and meaningful line breaks.
- Add source PDF and page attribution.
- Avoid duplicate insertion on double-click/retry where practical.
- Show truthful success/failure feedback.
- Keep the reading workflow uninterrupted.
- Distinguish application-managed notes in a database from ordinary user-visible files on the filesystem.

### 7.5 Annotation and productivity
- Highlights with multiple colors.
- Bookmarks with names and page references.
- Page/passage annotations.
- Reading history and recent documents.
- Export highlights/bookmarks/annotations.
- Source-linked capture history.
- Backup, restore, and portable data export.
- Keyboard navigation and accessibility.
- Local-first privacy by default; no automatic upload of private documents.

## 8. Architecture recommendations from the available discussion

These are recommendations to validate in the actual target workspace, not claims of successful integration.

| Area | Candidate | Purpose |
|---|---|---|
| PDF rendering/text layer | Mozilla PDF.js | PDF rendering and text-layer foundation |
| Browser OCR | Tesseract.js | OCR on rendered page images; verify Hindi/English language data and quality |
| Batch/local OCR alternative | OCRmyPDF | Optional local OCR pipeline for searchable PDF copies |
| Structured browser persistence | IndexedDB | Store document metadata, progress, preferences, extracted text, and annotations |
| Direct note-file access | File System API where supported | User-authorised read/write access to ordinary TXT/Markdown files |
| Testing | Existing project test stack and browser checks | Validate real workflows and persistence |

### Architecture trade-offs
- **Local-first web app/PWA:** recommended initial path for a portable, comparatively lightweight application, subject to browser file-access and storage limitations.
- **Desktop app:** consider early if reliable access to arbitrary folders, ordinary note files, or large local libraries is a day-one requirement.
- **Hosted web app:** not the default because it adds hosting, authentication, sync, privacy, and security decisions.

### Three viewing modes
1. **Original layout:** best for preserving fidelity.
2. **Reflowed text:** best for adjustable typography when extraction and layout are suitable.
3. **OCR text:** for scanned/image-only pages; accuracy depends on scan quality, language model, preprocessing, and page layout.

## 9. Phased implementation sequence

1. **Phase 0 — Inspect, research, and specify:** inspect repository and instructions; review Git status; verify official sources, dependencies, licences, architecture, data model, risks, and acceptance tests. No code edits or installs in this phase.
2. **Phase 1 — Core reader:** PDF import, rendering, navigation, zoom, reading position, persistent settings, and basic error/recovery states.
3. **Phase 2 — Themes and reading preferences:** 12 themes, supported color controls, reflow typography, global defaults and per-document overrides.
4. **Phase 3 — Notes and annotations:** selection popup, TXT/Markdown destinations, search/create/append, recent destinations, highlights, bookmarks, annotations.
5. **Phase 4 — OCR and full-text search:** Hindi/English OCR, text indexing, in-document/library search, reflow, and OCR quality evaluation.
6. **Phase 5 — Hardening and portability:** large-file testing, accessibility, backup/restore, permissions, security/dependency review, and optional desktop packaging assessment.

## 10. Required Antigravity execution protocol

For each substantial phase:

**INSPECT → RECONSTRUCT → PLAN → ACT → VERIFY → AUDIT → REPORT**

Before editing:
- Read project instructions and the specification.
- Inspect files, dependencies, Git status, diffs, and tests.
- Identify assumptions, dependencies, risks, and scope.
- Protect unrelated user work.

During implementation:
- Make minimal, coherent changes.
- Follow existing conventions.
- Do not invent APIs, commands, versions, or test results.
- Obtain approval before destructive changes, substantial installs, permission changes, publishing, or deployment.

After implementation:
- Run relevant tests/builds/linters with verified commands.
- Launch the application and test the UI where tools permit.
- Inspect errors and diffs.
- Compare observed evidence with acceptance criteria.
- Report what is complete, partial, or not done.

### Required status report

```text
STATUS: COMPLETED | PARTIAL | NOT DONE

Phase:
Scope attempted:
Files changed:
Commands actually run:
Tests run:
Observed results:
Acceptance criteria passed:
Acceptance criteria failed or not run:
Known limitations:
Risks/blockers:
Unrelated changes preserved:
Next recommended action:
```

A prompt or plan is not implementation. No tests may be marked passed unless actually run and observed.

## 11. Technical limitations that must remain explicit

- PDF.js, Tesseract.js, OCRmyPDF, IndexedDB, and File System API are candidates; compatibility and current versions must be verified before implementation.
- Tesseract.js is image-oriented; PDF pages need to be rendered to images for OCR.
- OCR output may contain errors, especially for low-resolution, skewed, complex, or mixed-language pages.
- Reflow may lose reading order or layout semantics in columns, tables, equations, footnotes, and complex pages.
- CSS theme changes cannot reliably recolor every embedded PDF object or scanned page.
- IndexedDB records are not automatically ordinary `.txt`/`.md` files on the device.
- Browser file access depends on support, user permissions, and platform behaviour.
- Persistence, export, backup, and restore need actual tests.
- Original PDFs should remain unchanged unless the user explicitly requests a separate processed/exported copy.

## 12. Acceptance-test categories

The implementation must include and report test evidence for:

- Import/open/render valid PDFs.
- Navigation and zoom.
- Resume Reading and Start from Page 1.
- Global and per-document theme persistence.
- Hindi and English text selection and note capture.
- OCR for Hindi, English, and mixed-language scans.
- Search results and correct page navigation.
- TXT/Markdown creation, append, destination search, and overwrite protection.
- Missing/renamed files and denied permissions.
- Highlight/bookmark/annotation persistence and export.
- Backup/restore and data integrity.
- Large/malformed/password-protected documents as supported.
- Keyboard navigation and accessible controls.
- Error states that do not falsely report successful saves.

If fixtures/tools are unavailable, mark a test **NOT RUN** and state why.

## 13. Source register available in the specification

These are starting references; they are not proof of a tested integration. Recheck current documentation and applicability during Phase 0.

- PDF.js getting started: https://mozilla.github.io/pdf.js/getting_started/
- PDF.js repository: https://github.com/mozilla/pdf.js/
- Tesseract.js repository: https://github.com/naptha/tesseract.js/
- Tesseract language data: https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html
- OCRmyPDF documentation: https://ocrmypdf.readthedocs.io/en/latest/
- OCRmyPDF cookbook: https://ocrmypdf.readthedocs.io/en/stable/cookbook.html
- IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- File System API: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
- Antigravity IDE overview: https://www.antigravity.google/docs/ide/overview/
- Antigravity browser documentation: https://www.antigravity.google/docs/ide/browser

## 14. Existing specification preserved in full

The complete contents of `PERSONAL_PDF_READER_PROJECT.md` are appended below, unchanged from the file available during archive creation. This preserves its detailed feature specification, data model, acceptance-test matrix, Phase 0 prompt, Phase 1 prompt, and definition of done.

---

# Appendix A — `PERSONAL_PDF_READER_PROJECT.md` (full available file)

---
title: "Personal PDF Reader — Project Specification"
project: "Personal PDF Reader"
document_type: "Project Brief and Antigravity Execution Protocol"
status: "Specification"
version: "1.0.0"
created: "2026-10-14"
updated: "2026-10-14"
tags:
  - pdf-reader
  - antigravity-ide
  - OCR
  - Hindi
  - English
  - local-first
  - knowledge-capture
---

# Personal PDF Reader — Project Specification

> **Purpose:** Build a personal, local-first PDF reader with Hindi/English text support, OCR for scanned documents, adjustable reading presentation, annotations, and a fast workflow for saving selected passages into TXT or Markdown notes.
>
> **Current status:** Specification only. The application has not been built or tested yet.
>
> **Execution environment:** Google Antigravity IDE. The IDE is the development environment, not the application's database or runtime architecture.

## 1. Executive Summary

Build a reliable PDF reader that combines everyday PDF viewing with a lightweight personal research and note-capture system.

The defining workflow is:

1. Open a PDF.
2. Select a passage from selectable PDF text or OCR-extracted text.
3. Open a compact selection popup.
4. Choose TXT or Markdown.
5. Search for an existing destination note or create a new one.
6. Append the passage safely, retaining source-document and page references.
7. Remember recent destinations and the last-used destination for quick capture.

The reader must support original-layout viewing and offer reflowed text where extraction quality and document structure make it practical. It must not imply that all PDFs can be perfectly reflowed or recolored.

## 2. Goals

- Import, catalogue, organise, open, and search a personal PDF library.
- Resume reading from the last saved position or start from page one.
- Preserve reading preferences globally and, where appropriate, per document.
- Provide at least 12 distinct reading themes.
- Offer zoom, fit-to-width, fit-to-page, page navigation, rotation, and supported page-layout modes.
- Support selectable/extractable Hindi and English text.
- OCR scanned/image-only pages in Hindi and English, subject to verified language-data availability and quality.
- Provide highlights, bookmarks, annotations, reading history, and source-linked notes.
- Save selected text into existing or new TXT/Markdown files with safe append behaviour.
- Support local-first operation, export, backup, and restore.
- Provide accessible keyboard interactions and responsive layouts.
- Keep original PDFs unchanged by default.

## 3. Non-Goals for the First Release

Unless separately approved, the first release should not attempt to:

- Reproduce every feature of a commercial PDF editor.
- Guarantee perfect reflow of complex layouts, equations, tables, multi-column pages, or scanned documents.
- Modify the original PDF automatically.
- Upload private PDFs or extracted text to a cloud service.
- Require an AI/LLM service for basic viewing, OCR, search, annotation, or note capture.
- Implement semantic/vector search before reliable text extraction and exact search work.
- Introduce a desktop wrapper before platform and file-access requirements have been evaluated.
- Perform destructive filesystem operations or overwrite existing notes without explicit user action.

## 4. Architecture Recommendation

### 4.1 Initial direction

Start by evaluating a **local-first web application/PWA**. Keep components modular so a desktop wrapper can be evaluated later if direct folder access, large-library performance, or native file workflows require it.

If the requirements demand reliable direct access to arbitrary folders and ordinary files from the first release, compare a desktop architecture before committing to browser-only delivery.

### 4.2 Candidate components

| Concern | Candidate | Role | Must verify |
|---|---|---|---|
| PDF rendering and text layer | Mozilla PDF.js | Render pages, support text selection and extraction, provide the viewer foundation | Current compatibility, worker setup, annotation needs, performance, licensing |
| Browser OCR | Tesseract.js | OCR rendered page images using Hindi and English language data | `hin`/`eng` model availability, download/runtime costs, preprocessing, quality |
| Batch/local OCR alternative | OCRmyPDF | Create searchable OCR text layers in processed PDF copies | Runtime requirements, language packages, installation and deployment constraints |
| Structured browser storage | IndexedDB | Store library metadata, extracted text, progress, settings and annotation records | Quotas, browser support, persistence and backup strategy |
| User-authorised file access | File System API where supported | Read/write note files and work with a user-selected directory | Browser compatibility, permissions, file handles and recovery |
| UI framework | Existing project framework if present | Avoid unnecessary rewrites and dependencies | Inspect repository before selecting |
| Testing | Existing project test stack plus browser checks | Verify actual user workflows | Inspect installed tools and scripts first |

These are candidates, not verified dependencies for a specific repository. Inspect the actual workspace and check current official documentation before committing to exact versions or APIs.

### 4.3 Logical architecture

```text
Reader UI
├── PDF Library
├── PDF Viewer
│   ├── Original-layout mode
│   ├── Text selection and extraction
│   ├── Navigation and zoom
│   └── Reflow mode (best-effort, text-based)
├── OCR Pipeline
│   ├── Render PDF page to image
│   ├── Run Hindi/English OCR
│   ├── Store extracted text and page references
│   └── Report errors and quality limitations
├── Research Capture
│   ├── Selection popup
│   ├── TXT/Markdown destination search
│   ├── Create/append file
│   └── Source and page attribution
├── Annotations
│   ├── Highlights
│   ├── Bookmarks
│   └── Page/passage notes
└── Persistence
    ├── Document metadata and stable IDs
    ├── Reading progress and settings
    ├── Extracted/OCR text index
    ├── Annotation and capture records
    └── Backup/export/restore
```

## 5. PDF Viewing Modes and Important Limitations

### Mode A — Original layout (essential)

- Preserve the original page layout.
- Support zoom, fit-to-page, fit-to-width, page navigation, rotation, and available single-/two-page/continuous layouts.
- Allow background/presentation adjustments only where technically supported.
- Keep the original document available for visual comparison.

### Mode B — Reflowed text (advanced)

- Extract text and display it in a readable column.
- Allow adjustable font size, font family, line height, paragraph spacing, and reading width.
- Preserve page/source references where possible.
- Clearly handle extraction errors and reading-order uncertainty.
- Do not promise accurate reconstruction of tables, columns, equations, footnotes, or complex layouts.

### Mode C — OCR text (essential for image-only scans)

- Render PDF pages to images before OCR when using an image-based OCR engine such as Tesseract.js.
- Support Hindi (`hin`) and English (`eng`) when the required language data is available.
- Support page-level and batch processing.
- Display progress, cancellation, failures, and processing state.
- Store extracted text separately from the original PDF.
- Keep page references and coordinates when available.
- Allow the user to compare OCR text with the original scan.
- Label OCR output as machine-recognised and potentially imperfect.

### Color and typography limitations

CSS/theme changes cannot reliably recolor every embedded image, vector element, scanned page, or original text object in a PDF. Adjustable font size applies most reliably to reflowed/extracted text, not to every original-layout PDF page. The UI must explain these distinctions rather than present unsupported controls as universally effective.

## 6. Feature Requirements

### 6.1 Library and opening

- Import one or multiple PDFs.
- Support drag-and-drop when available.
- Show filename, title when available, file size, page count, tags, category, import date, and last-read date.
- Search by filename/title/author/tags; add full-text search after extraction/indexing is implemented.
- Support categories, collections, tags, favourites, pinned documents, and reading status.
- Provide **Resume Reading** and **Start from Page 1**.
- Persist reading position separately for each document.
- Preserve the last saved position when the user chooses Start from Page 1.
- Store global defaults separately from per-document overrides.
- Handle unavailable/moved files, malformed files, and password-protected PDFs gracefully.
- Distinguish imported/stored copies from references to externally located files.

### 6.2 Reading controls

- Zoom in/out and a clear zoom indicator.
- Fit-to-page and fit-to-width.
- Page number navigation and total page count.
- Single-page, two-page, and continuous modes where supported.
- Page rotation and fullscreen.
- Optional distraction-free mode.
- Adjustable text size in reflow mode.
- Font-family selection with verified Devanagari support.
- Line/paragraph spacing and reading-column width.
- Independent controls for viewer background, text, selection, and highlight colors where supported.
- Reset-to-default and per-document overrides.
- Persist settings and test that they survive reopening.

### 6.3 Twelve initial theme presets

The following are proposed presets. Validate contrast and usability; do not claim these recolor all original PDF content.

1. Classic Light
2. Night
3. Warm Sepia
4. Soft Green
5. Cool Blue
6. Soft Rose
7. Lavender
8. Paper
9. Midnight Blue
10. Warm Dark
11. Cream
12. Amber Night

Users should be able to customise text, background, selection, and highlight colors where the current viewing mode supports those properties.

### 6.4 Text extraction, OCR, and search

- Classify pages/documents as selectable text, image-only, mixed content, or extraction/OCR uncertain.
- Search within the current PDF.
- Navigate to matches and show page numbers/snippets.
- Build library-wide full-text search incrementally after extraction is available.
- OCR Hindi and English pages, including mixed-language documents where supported.
- Allow current-page, selected-page, and whole-document OCR.
- Provide progress, cancellation, error reporting, and retry.
- Keep OCR output and extracted text separate from the original PDF.
- Preserve page references and text coordinates where available.
- Allow manual correction of OCR text if included in the approved scope.
- Evaluate quality using known sample passages, not merely task completion status.

### 6.5 Selection-to-note capture (signature feature)

When the user selects text from a PDF text layer or OCR text view:

1. Show a compact, non-blocking popup.
2. Display a concise preview of the selected passage.
3. Offer TXT and Markdown output.
4. Allow searching existing note files by filename.
5. Allow selecting a destination note.
6. Allow creating a new note with filename/extension handling.
7. Remember the last-used destination per format and optionally per source document.
8. Show recent destinations for quick selection.
9. Support explicit append-to-existing-file behaviour.
10. Preserve Hindi Unicode, punctuation, and meaningful line breaks.
11. Include source PDF and page number by default in Markdown capture; allow a comparable source reference in TXT.
12. Avoid duplicate insertion on double-click/retry where practical.
13. Never silently overwrite an existing file.
14. Show truthful success/failure feedback.
15. Keep the user in the reading workflow.

#### Suggested Markdown template

```markdown
## Captured passage

> [Selected passage]

**Source:** [PDF filename]
**Page:** [Page number]
**Captured:** [Timestamp]

**Context:** [Optional user-written note]
```

Replace placeholders with actual values. Do not fabricate source metadata when it is unavailable.

#### Storage distinction

Notes stored only in IndexedDB are application records, not automatically ordinary `.txt` or `.md` files in the user's filesystem. The specification must choose and explain one or both of these approaches:

- **Application-managed notes:** stored in the app database and exported to files on demand.
- **User-authorised filesystem notes:** files read/written through supported APIs and explicit permissions.

Test file permission denial, missing files, renamed files, write failures, and recovery.

### 6.6 Highlights, bookmarks, and annotations

- Multiple highlight colors.
- Store selected text, page number, coordinates when available, and stable document identity.
- Create, rename, navigate to, and delete bookmarks.
- Add personal notes to a page or selected passage.
- Search or filter annotations by document and type.
- Export highlights, bookmarks, and annotations separately.
- Provide undo for supported actions and protect against accidental deletion.
- Store annotation data separately from the original PDF by default.
- Treat embedding annotations into a new PDF as a separate export feature.

### 6.7 Recommended additional features

**Priority 1**
- Recent documents and reading history.
- Cross-document search once text indexing is reliable.
- Backup, restore, and export.
- Local-first privacy defaults.
- Error, loading, empty, and recovery states.
- Source-linked capture history.

**Priority 2**
- Keyboard shortcuts and configurable toolbar.
- Bulk tagging and organisation.
- Text-to-speech if an appropriate supported engine is available.
- Reading statistics and progress indicators.
- Migration support if moving to a desktop app later.

## 7. Data Model Proposal

Final field definitions must be reconciled with the existing project and selected storage engine.

| Entity | Example fields | Purpose |
|---|---|---|
| Document | `id`, `title`, `filename`, `storageRef`, `pageCount`, `fileSize`, `tags`, `categoryIds`, `importedAt`, `lastOpenedAt` | Stable library identity and metadata |
| ReadingProgress | `documentId`, `pageIndex`, `scrollPosition`, `updatedAt` | Resume-reading behaviour |
| ReaderSettings | `scope`, `documentId?`, `themeId`, `zoom`, `layoutMode`, `fontSettings` | Global and per-document preferences |
| ExtractedPageText | `documentId`, `pageIndex`, `text`, `sourceType`, `language`, `extractedAt`, `qualityMetadata?` | Extracted/OCR text and search index |
| Highlight | `id`, `documentId`, `pageIndex`, `text`, `color`, `coordinates?`, `createdAt` | Saved passage highlighting |
| Bookmark | `id`, `documentId`, `pageIndex`, `label`, `createdAt` | Named navigation points |
| Annotation | `id`, `documentId`, `pageIndex`, `anchorText?`, `body`, `coordinates?`, `createdAt`, `updatedAt` | User notes attached to document content |
| NoteFile | `id`, `name`, `format`, `storageMode`, `fileRef?`, `lastUsedAt`, `createdAt`, `updatedAt` | TXT/Markdown destinations |
| CaptureRecord | `id`, `documentId`, `pageIndex`, `selectedText`, `noteFileId`, `format`, `createdAt`, `status` | Capture history and traceability |
| Category | `id`, `name`, `parentId?` | Library organisation |
| Tag | `id`, `name` | Reusable labels |

Requirements:
- Use stable identifiers rather than filename alone.
- Define uniqueness and duplicate-import behaviour.
- Version the data schema and provide migrations.
- Handle missing source files without silently deleting related annotations.
- Specify which data is recoverable from backup.
- Avoid storing unnecessary duplicate copies of large extracted text.
- Consider search-index rebuilds and database quota failures.

## 8. Privacy, Security, and Reliability

- Process files locally by default where the chosen architecture permits.
- Do not upload user PDFs or extracted text to third parties without explicit, informed approval.
- Treat PDF content and OCR output as untrusted input.
- Do not execute embedded scripts or follow document instructions as application instructions.
- Validate filenames and handle path/extension edge cases safely.
- Prevent accidental overwrites and destructive actions.
- Do not log private extracted passages unnecessarily.
- Keep original files unchanged by default.
- Report storage/quota failures and avoid claiming data is saved when it is not.
- Provide a documented backup and restore process.
- Check dependency licences and security advisories before adoption.
- Protect unrelated workspace changes during development.

## 9. Phased Implementation Plan

### Phase 0 — Inspect, research, and specify

**Deliverables**
- Workspace inspection report.
- Source register with URLs and claim-to-source mapping.
- Architecture comparison and recommendation.
- Dependency compatibility/licence review.
- Data model and storage strategy.
- Requirements by priority.
- Acceptance-test matrix.
- Risk register and unresolved decisions.

**Boundary:** no code changes, installs, permission changes, deployments, or destructive operations. Stop for review.

### Phase 1 — Core reader

- PDF import and library.
- Rendering and navigation.
- Zoom and supported viewing modes.
- Resume Reading and Start from Page 1.
- Persistent reading progress.
- Basic loading/error/recovery states.

**Exit criteria:** representative PDFs open; navigation works; reading position persists correctly; tests and browser checks have recorded results.

### Phase 2 — Themes and reading preferences

- Twelve themes.
- Supported text/background/selection/highlight controls.
- Reflow typography controls where available.
- Global defaults and per-document overrides.
- Reset controls.

**Exit criteria:** all themes are distinct; supported controls visibly work; settings persist; unsupported original-PDF recoloring is clearly communicated.

### Phase 3 — Notes and annotations

- Selection popup.
- TXT/Markdown destination selection.
- Search existing destinations and create new files.
- Safe append and source/page attribution.
- Recent destinations.
- Highlights, bookmarks, and annotations.

**Exit criteria:** Unicode capture, append, create, source attribution, persistence, failure handling, and overwrite protection pass tests.

### Phase 4 — OCR and full-text search

- Hindi/English OCR pipeline.
- Page-level and batch processing.
- Extracted-text storage and search indexing.
- In-document and library-wide search.
- Reflow mode.
- OCR quality evaluation.

**Exit criteria:** sample documents of each supported class are tested; known OCR limitations are reported; search results navigate to correct pages.

### Phase 5 — Hardening and portability

- Large-file/performance tests.
- Accessibility and keyboard checks.
- Backup/restore.
- Missing-file and permission failure handling.
- Security and dependency review.
- Optional desktop packaging assessment.

**Exit criteria:** critical workflows are tested end-to-end, known risks are documented, and no unverified completion claims remain.

## 10. Acceptance-Test Matrix

| ID | Test | Pass condition |
|---|---|---|
| PDF-01 | Import a valid text PDF | Opens and displays correct page count |
| PDF-02 | Navigate and zoom | Controls work without breaking navigation |
| PDF-03 | Resume Reading | Reopens at the saved position |
| PDF-04 | Start from Page 1 | Opens page one without erasing the saved resume position |
| SET-01 | Select each theme | Correct, distinct theme is applied to supported surfaces |
| SET-02 | Reopen document | Applicable settings persist |
| TXT-01 | Select Hindi text | Captured text preserves Unicode characters |
| TXT-02 | Select English text | Captured text preserves expected punctuation and line breaks |
| TXT-03 | Create Markdown note | File/record is created and source/page metadata is correct |
| TXT-04 | Append to existing note | Existing content remains intact and new content is added once |
| TXT-05 | Search destination | Matching destination can be selected |
| TXT-06 | Permission/write failure | Error is visible; UI does not claim success |
| OCR-01 | OCR Hindi scan | Output is evaluated against known text |
| OCR-02 | OCR English scan | Output is evaluated against known text |
| OCR-03 | Mixed-language page | Quality and unsupported cases are documented |
| OCR-04 | Cancel/fail OCR | State is consistent and retry is possible where supported |
| ANN-01 | Create highlight/bookmark | Item persists and navigates to the correct page |
| ANN-02 | Export annotations | Export contains expected records and source references |
| SRCH-01 | Search PDF text | Results show correct snippets/pages |
| SRCH-02 | Search OCR text | Indexed OCR results navigate to correct pages |
| LIB-01 | Rename/missing source | App reports the issue and preserves recoverable metadata |
| DATA-01 | Backup/restore | Restored records match the exported data |
| SEC-01 | Untrusted/malformed PDF | Failure is handled without executing document content |
| A11Y-01 | Keyboard navigation | Core controls are reachable and operable by keyboard |

Do not mark a test as passed unless it was actually executed and its result observed. If a fixture, tool, or environment is unavailable, mark the test **NOT RUN** and document the blocker.

## 11. Antigravity Execution Protocol

Use the following lifecycle for each substantial phase:

**INSPECT → RECONSTRUCT → PLAN → ACT → VERIFY → AUDIT → REPORT**

Before editing:
- Read project instructions and this specification.
- Inspect project files, dependency manifests, Git status, diffs, and existing tests.
- Identify scope, assumptions, risks, and dependencies.
- Protect unrelated user changes.

During implementation:
- Make the smallest coherent change that satisfies the approved phase.
- Reuse project conventions and installed dependencies where appropriate.
- Do not invent APIs, commands, versions, or test results.
- Ask for approval before destructive edits, substantial installations, permission changes, publishing, or deployment.

After implementation:
- Run relevant tests/builds/linters using verified commands.
- Launch the app and exercise the UI where tools permit.
- Inspect diffs and errors.
- Compare evidence against acceptance criteria.
- Report actual results and unresolved issues.

### Required phase report

```text
STATUS: COMPLETED | PARTIAL | NOT DONE

Phase:
Scope attempted:
Files changed:
Commands actually run:
Tests run:
Observed results:
Acceptance criteria passed:
Acceptance criteria failed or not run:
Known limitations:
Risks/blockers:
Unrelated changes preserved:
Next recommended action:
```

A plan or prompt is not implementation. Do not claim work is complete without evidence.

## 12. Phase 0 Prompt for Antigravity

Copy the following prompt into the Antigravity Agent panel with the intended project workspace open.

---

**PERSONAL PDF READER — PHASE 0: INSPECT, RESEARCH, AND SPECIFY**

Act as a senior software architect, PDF-engine specialist, OCR engineer, local-first application designer, accessibility reviewer, and test engineer.

Investigate and specify a personal PDF reader with Hindi/English support, OCR for scanned PDFs, at least 12 themes, zoom and reading controls, bookmarks/highlights/annotations, and a selection-to-TXT/Markdown workflow with searchable destinations, safe append, and source/page attribution.

1. Inspect the actual workspace, instructions, README, dependency manifests, tests, configuration, and relevant code. Inspect Git status and protect uncommitted/untracked user work.
2. Identify the actual framework, runtime, package manager, existing architecture, and available testing tools. Do not infer filenames, APIs, versions, or commands without evidence.
3. Research current official documentation and primary repositories for PDF.js, Tesseract.js and Hindi/English language data, OCRmyPDF or an alternative local OCR pipeline, IndexedDB, File System APIs, and the installed Antigravity IDE's actual capabilities.
4. Record source URLs, applicable versions/dates, and the claims supported by each source. Label facts, recommendations, assumptions, and unresolved issues separately.
5. Compare local-first web/PWA and desktop architectures. Recommend one based on file access, privacy, portability, performance, complexity, and maintenance.
6. Specify the PDF rendering, OCR, text extraction, reflow, search, storage, annotation, note-file, backup/restore, and UI architecture.
7. Define the data model, feature priorities, implementation phases, risk register, and measurable acceptance tests.
8. Explicitly distinguish original-layout PDF styling from reflowed-text styling. Explain that arbitrary PDF recoloring and perfect reflow are not guaranteed.
9. Explicitly distinguish application-managed note records from ordinary user-visible TXT/Markdown files. Specify permissions, safe append, overwrite prevention, source attribution, and recovery.
10. Stop after the specification. Do not edit application code, install/upgrade packages, alter permissions, delete/move/overwrite files, deploy, publish, upload private documents, or spend money.

Deliver the workspace inspection report, source register, architecture recommendation, dependency compatibility/licence table, data model, feature specification, phased plan, risk register, acceptance-test matrix, and exact next step. Report unavailable tools or sources honestly. Do not claim that implementation or tests were completed. Request approval before Phase 1.

---

## 13. Phase 1 Prompt — Core Reader

Use only after reviewing and approving Phase 0 findings.

**PERSONAL PDF READER — PHASE 1: BUILD AND VERIFY THE CORE READER**

Use the approved Phase 0 architecture and acceptance matrix. Reinspect the workspace and Git status before editing.

Implement the smallest complete working reader foundation:

1. PDF import and document-library listing.
2. PDF rendering using the approved compatible engine.
3. Page navigation, page count, zoom, fit-to-width, fit-to-page, and supported scrolling/layout modes.
4. Resume Reading and Start from Page 1.
5. Persistent per-document reading position and applicable preferences.
6. The approved persistent storage layer and versioned data model.
7. Responsive accessible UI, loading/empty/error/recovery states.
8. Automated tests and fixtures for the implemented slice.

Preserve project conventions. Do not introduce unnecessary dependencies or change the approved architecture without documenting the reason. Do not modify original PDFs. Do not implement fake functionality or claim persistence without reopen tests. Protect unrelated user changes.

Sequence: inspect → implement → run relevant tests → launch with the verified command → exercise the interface using available browser tools → inspect errors and diffs → report evidence.

Acceptance: valid PDFs import/open; navigation and zoom work; Resume Reading restores the saved position; Start from Page 1 does not erase that saved position; preferences persist; invalid files show understandable errors; storage failures do not produce false success claims.

Report COMPLETED/PARTIAL/NOT DONE, changed files, actual commands, test results, browser evidence, limitations, and next phase. Stop after the core reader is verified. Do not implement OCR or the selection-to-note popup in this phase.

## 14. Source Register

Use these primary references during implementation. Recheck current content and version applicability when work begins.

### PDF rendering
- PDF.js getting started: https://mozilla.github.io/pdf.js/getting_started/
- PDF.js repository: https://github.com/mozilla/pdf.js/

### OCR
- Tesseract.js repository: https://github.com/naptha/tesseract.js/
- Tesseract language-data reference: https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html
- OCRmyPDF documentation: https://ocrmypdf.readthedocs.io/en/latest/
- OCRmyPDF cookbook: https://ocrmypdf.readthedocs.io/en/stable/cookbook.html

### Browser persistence and files
- IndexedDB API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- File System API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/File_System_API

### Antigravity IDE
- Official IDE overview: https://www.antigravity.google/docs/ide/overview/
- Official browser documentation: https://www.antigravity.google/docs/ide/browser

**Evidence rule:** these URLs are a starting source register, not proof that a specific integration, version, browser, or project has been tested. Record what was actually verified during Phase 0.

## 15. Definition of Done

The project is not complete merely because the interface looks finished.

The release candidate is ready for review when:
- All essential requirements are implemented or explicitly deferred.
- Acceptance tests have actual recorded results.
- Hindi/English text and OCR quality have been evaluated on representative documents.
- Selection-to-note capture preserves content and source attribution.
- Data persistence, file permissions, failure handling, backup, and restore are tested.
- Known PDF-layout and OCR limitations are documented.
- Security, accessibility, and dependency licences have been reviewed.
- Changes and test results have been audited.
- The final report accurately distinguishes completed, partial, and untested work.

---

**Next action:** Open the target project in Antigravity IDE and run the Phase 0 prompt. Review its evidence-based architecture recommendation before approving implementation.


## 15. Archive status and next action

**Archive status:** Created from available conversation context and the existing project specification. It is not a verified full export of all original chat messages.

**Project status:** Specification only; the PDF reader itself has not been implemented in this conversation.

**Next action:** Place this archive and `PERSONAL_PDF_READER_PROJECT.md` in the project repository (for example, under `docs/`). In Antigravity, run the Phase 0 prompt and verify the workspace and current official documentation before implementation.
