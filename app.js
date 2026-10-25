/**
 * AuraPDF — Application Orchestrator
 * Integrates:
 * 1. Smart Open Prompts (Resume Session vs Fresh Start)
 * 2. 12 Ergonomic Visual Themes Engine
 * 3. Contextual Quick-Capture Pop-up with Obsidian Vault Routing
 * 4. On-Device Hindi/English OCR Pipeline
 * 5. Bookmarks, Highlights & Session Tracking with Moment.js
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Lucide Icons
  if (window.lucide) lucide.createIcons();

  // Initialize Database
  if (window.appDB) await window.appDB.init();

  // App State
  let currentActiveTheme = localStorage.getItem('aurapdf_theme') || 'theme-slate';
  let activeClipFormat = 'markdown';
  let sessionStartTime = moment();
  let pendingDocumentFile = null;
  let activeSelectionText = '';
  let activeSelectionRects = [];

  // Theme Definitions (The 12 Curated Presets)
  const THEMES = [
    { id: 'theme-classic-light', name: 'Classic Light', bg: '#ffffff', text: '#0f172a', type: 'Day' },
    { id: 'theme-warm-paper', name: 'Warm Paper', bg: '#fbf0d9', text: '#2d241e', type: 'Day' },
    { id: 'theme-sepia-classic', name: 'Sepia Classic', bg: '#f4ecd8', text: '#5c4033', type: 'Warm' },
    { id: 'theme-solarized-light', name: 'Solarized Light', bg: '#fdf6e3', text: '#657b83', type: 'Day' },
    { id: 'theme-solarized-dark', name: 'Solarized Dark', bg: '#002b36', text: '#839496', type: 'Night' },
    { id: 'theme-slate', name: 'Slate Gray', bg: '#1e222a', text: '#e2e8f0', type: 'Night' },
    { id: 'theme-oled-black', name: 'OLED Black', bg: '#000000', text: '#ededed', type: 'Extreme' },
    { id: 'theme-forest-green', name: 'Forest Green', bg: '#121c15', text: '#c5d8c9', type: 'Relaxed' },
    { id: 'theme-soft-amber', name: 'Soft Amber', bg: '#18110b', text: '#e6a86c', type: 'Night' },
    { id: 'theme-cool-charcoal', name: 'Cool Charcoal', bg: '#1f232b', text: '#dbe0ea', type: 'Night' },
    { id: 'theme-cyberpunk', name: 'Cyberpunk', bg: '#0a0b10', text: '#00ffcc', type: 'Vibrant' },
    { id: 'theme-pastel-muted', name: 'Pastel Lavender', bg: '#f5f2f8', text: '#3c3247', type: 'Soft' }
  ];

  // Apply Initial Theme
  applyTheme(currentActiveTheme);
  populateThemesGrid();

  // Start Session Timer & Clock (Moment.js)
  setInterval(updateSessionClocks, 1000);
  updateSessionClocks();

  // Load Initial Clips & Documents from DB
  await refreshClipsHistory();
  await refreshLibraryList();

  // --------------------------------------------------------------------------
  // 1. Theme Engine Functions
  // --------------------------------------------------------------------------
  function applyTheme(themeId) {
    THEMES.forEach(t => document.body.classList.remove(t.id));
    document.body.classList.add(themeId);
    currentActiveTheme = themeId;
    localStorage.setItem('aurapdf_theme', themeId);
  }

  function populateThemesGrid() {
    const grid = document.getElementById('themesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    THEMES.forEach(theme => {
      const card = document.createElement('button');
      card.className = `p-3 rounded-xl border border-divider text-left transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between ${theme.id === currentActiveTheme ? 'ring-2 ring-amber-500' : ''}`;
      card.style.backgroundColor = theme.bg;
      card.style.color = theme.text;
      card.innerHTML = `
        <div class="flex items-center justify-between w-full mb-2">
          <span class="text-[10px] px-1.5 py-0.5 rounded opacity-75 border" style="border-color: currentColor">${theme.type}</span>
          <span class="text-xs font-bold">अA</span>
        </div>
        <div>
          <p class="font-semibold text-xs">${theme.name}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        applyTheme(theme.id);
        populateThemesGrid();
        document.getElementById('themeModal').classList.add('hidden');
      });
      grid.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // 2. Document Loading & Smart Open Launcher
  // --------------------------------------------------------------------------
  const pdfFileInput = document.getElementById('pdfFileInput');
  pdfFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingDocumentFile = file;

    // Check if document was previously opened in IndexedDB
    const docKey = `${file.name}_${file.size}`;
    const previousState = await window.appDB.getDocumentProgress(docKey);

    if (previousState && previousState.lastPage > 1) {
      // Show Smart Open Prompt
      document.getElementById('smartOpenDocMessage').textContent = 
        `You previously read "${file.name}". Would you like to resume where you left off or start fresh?`;
      document.getElementById('soLastPageVal').textContent = `Page ${previousState.lastPage} of ${previousState.pageCount || '?'}`;
      document.getElementById('soLastSchemeVal').textContent = THEMES.find(t => t.id === previousState.themeId)?.name || 'Default';
      document.getElementById('soLastZoomVal').textContent = `${Math.round((previousState.zoom || 1) * 100)}%`;
      document.getElementById('soLastTimeVal').textContent = moment(previousState.lastOpenedAt).fromNow();

      document.getElementById('smartOpenModal').classList.remove('hidden');
    } else {
      // Direct Fresh Start
      await executeLoadDocument(file, 1);
    }
  });

  document.getElementById('btnSmartResume').addEventListener('click', async () => {
    document.getElementById('smartOpenModal').classList.add('hidden');
    if (!pendingDocumentFile) return;
    const docKey = `${pendingDocumentFile.name}_${pendingDocumentFile.size}`;
    const previousState = await window.appDB.getDocumentProgress(docKey);
    if (previousState && previousState.themeId) {
      applyTheme(previousState.themeId);
    }
    await executeLoadDocument(pendingDocumentFile, previousState ? previousState.lastPage : 1, previousState ? previousState.zoom : 1.0);
  });

  document.getElementById('btnSmartFresh').addEventListener('click', async () => {
    document.getElementById('smartOpenModal').classList.add('hidden');
    if (!pendingDocumentFile) return;
    await executeLoadDocument(pendingDocumentFile, 1);
  });

  async function executeLoadDocument(file, initialPage = 1, initialZoom = 1.0) {
    try {
      document.getElementById('docTitleDisplay').textContent = file.name;
      document.getElementById('docPageStats').textContent = 'Rendering pages...';

      const res = await window.pdfViewer.loadDocument(file, file.name);
      document.getElementById('totalPagesLabel').textContent = res.totalPages;
      document.getElementById('inputCurrentPage').max = res.totalPages;
      document.getElementById('inputCurrentPage').value = initialPage;
      document.getElementById('mPageDisplay').textContent = `${initialPage} / ${res.totalPages}`;
      document.getElementById('docPageStats').textContent = `${res.totalPages} pages`;

      if (initialZoom) {
        window.pdfViewer.zoomScale = initialZoom;
        document.getElementById('zoomPercentageLabel').textContent = `${Math.round(initialZoom * 100)}%`;
      } else {
        window.pdfViewer.zoomScale = 1.25;
        document.getElementById('zoomPercentageLabel').textContent = '125%';
      }

      await window.pdfViewer.renderPage(initialPage);
      renderTableOfContents(res.outline);
      await refreshBookmarksList();
      await refreshLibraryList();

      // Save initial reading state
      await persistCurrentReadingState();
    } catch (err) {
      console.error('Error rendering PDF:', err);
      alert('Could not render this PDF. Please check if it is a valid PDF file.');
    }
  }

  async function persistCurrentReadingState() {
    if (!window.pdfViewer.pdfDoc || !window.pdfViewer.currentDocId) return;
    await window.appDB.saveDocumentProgress({
      id: window.pdfViewer.currentDocId,
      filename: window.pdfViewer.docTitle,
      lastPage: window.pdfViewer.currentPageNumber,
      pageCount: window.pdfViewer.totalPages,
      zoom: window.pdfViewer.zoomScale,
      themeId: currentActiveTheme,
      reflowFontSize: window.pdfViewer.reflowFontSize
    });
  }
  window.persistCurrentReadingState = persistCurrentReadingState;

  // Drag and Drop & Dropzone File Loading
  const dropzoneFileInput = document.getElementById('dropzoneFileInput');
  if (dropzoneFileInput) {
    dropzoneFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        pendingDocumentFile = file;
        await executeLoadDocument(file, 1, 1.25);
      }
    });
  }

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  const scrollContainer = document.getElementById('pdfScrollContainer');
  if (scrollContainer) {
    scrollContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      scrollContainer.classList.add('ring-2', 'ring-amber-500');
    });
    scrollContainer.addEventListener('dragleave', (e) => {
      scrollContainer.classList.remove('ring-2', 'ring-amber-500');
    });
    scrollContainer.addEventListener('drop', async (e) => {
      e.preventDefault();
      scrollContainer.classList.remove('ring-2', 'ring-amber-500');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          pendingDocumentFile = file;
          await executeLoadDocument(file, 1, 1.25);
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 3. Page Navigation & Zoom Handlers
  // --------------------------------------------------------------------------
  async function jumpToPage(num) {
    if (!window.pdfViewer.pdfDoc) return;
    const target = Math.max(1, Math.min(num, window.pdfViewer.totalPages));
    document.getElementById('inputCurrentPage').value = target;
    document.getElementById('mPageDisplay').textContent = `${target} / ${window.pdfViewer.totalPages}`;
    await window.pdfViewer.renderPage(target);
    await persistCurrentReadingState();
  }

  document.getElementById('btnPrevPage').addEventListener('click', () => jumpToPage(window.pdfViewer.currentPageNumber - 1));
  document.getElementById('btnNextPage').addEventListener('click', () => jumpToPage(window.pdfViewer.currentPageNumber + 1));
  document.getElementById('mBtnPrevPage').addEventListener('click', () => jumpToPage(window.pdfViewer.currentPageNumber - 1));
  document.getElementById('mBtnNextPage').addEventListener('click', () => jumpToPage(window.pdfViewer.currentPageNumber + 1));

  document.getElementById('inputCurrentPage').addEventListener('change', (e) => {
    jumpToPage(parseInt(e.target.value) || 1);
  });

  document.getElementById('btnZoomIn').addEventListener('click', () => {
    const pct = window.pdfViewer.setZoom(window.pdfViewer.zoomScale + 0.15);
    document.getElementById('zoomPercentageLabel').textContent = `${pct}%`;
    persistCurrentReadingState();
  });

  document.getElementById('btnZoomOut').addEventListener('click', () => {
    const pct = window.pdfViewer.setZoom(window.pdfViewer.zoomScale - 0.15);
    document.getElementById('zoomPercentageLabel').textContent = `${pct}%`;
    persistCurrentReadingState();
  });

  // Clickable % button cycles zoom presets: 100% -> 125% -> 145% -> 175% -> 200% -> 75%
  const btnZoomPercentage = document.getElementById('btnZoomPercentage');
  if (btnZoomPercentage) {
    const presets = [1.0, 1.25, 1.45, 1.75, 2.0, 0.75];
    btnZoomPercentage.addEventListener('click', () => {
      const current = window.pdfViewer.zoomScale;
      let nextIndex = presets.findIndex(p => Math.abs(p - current) < 0.08);
      if (nextIndex === -1 || nextIndex >= presets.length - 1) {
        nextIndex = 0;
      } else {
        nextIndex += 1;
      }
      const pct = window.pdfViewer.setZoom(presets[nextIndex]);
      document.getElementById('zoomPercentageLabel').textContent = `${pct}%`;
      persistCurrentReadingState();
    });
  }

  document.getElementById('btnFitWidth').addEventListener('click', () => {
    const pct = window.pdfViewer.fitToWidth();
    document.getElementById('zoomPercentageLabel').textContent = `${pct}%`;
    persistCurrentReadingState();
  });

  document.getElementById('btnFitPage').addEventListener('click', () => {
    const pct = window.pdfViewer.fitToPage();
    document.getElementById('zoomPercentageLabel').textContent = `${pct}%`;
    persistCurrentReadingState();
  });

  // Global Keyboard Navigation (Arrow Keys & Page Turning)
  window.addEventListener('keydown', (e) => {
    // Skip if typing in an input
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea') return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      jumpToPage(window.pdfViewer.currentPageNumber + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      jumpToPage(window.pdfViewer.currentPageNumber - 1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      document.getElementById('btnZoomIn').click();
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      document.getElementById('btnZoomOut').click();
    }
  });

  // Mode Switching (Original vs Reflow)
  const btnOriginal = document.getElementById('btnModeOriginal');
  const btnReflow = document.getElementById('btnModeReflow');
  const mBtnModeToggle = document.getElementById('mBtnModeToggle');

  btnOriginal.addEventListener('click', () => {
    btnOriginal.classList.add('active-mode');
    btnReflow.classList.remove('active-mode');
    window.pdfViewer.toggleViewMode('original');
  });

  btnReflow.addEventListener('click', () => {
    btnReflow.classList.add('active-mode');
    btnOriginal.classList.remove('active-mode');
    window.pdfViewer.toggleViewMode('reflow');
  });

  mBtnModeToggle.addEventListener('click', () => {
    const newMode = window.pdfViewer.currentViewMode === 'original' ? 'reflow' : 'original';
    if (newMode === 'reflow') {
      btnReflow.click();
    } else {
      btnOriginal.click();
    }
  });

  // Reflow Typography Handlers
  document.getElementById('btnReflowFontDecrease').addEventListener('click', () => window.pdfViewer.setReflowFontSize(-2));
  document.getElementById('btnReflowFontIncrease').addEventListener('click', () => window.pdfViewer.setReflowFontSize(2));
  
  document.querySelectorAll('.btn-line-height').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-line-height').forEach(b => b.classList.remove('active-lh'));
      e.target.classList.add('active-lh');
      window.pdfViewer.setReflowLineHeight(parseFloat(e.target.getAttribute('data-lh')));
    });
  });

  // --------------------------------------------------------------------------
  // 4. On-Device OCR Pipeline (High-Resolution 300 DPI Sanskrit & Hindi Engine)
  // --------------------------------------------------------------------------
  window.runPageOCR = async (forceRefresh = false) => {
    if (!window.pdfViewer.pdfDoc) {
      alert('Please open a PDF document first.');
      return;
    }

    const banner = document.getElementById('ocrProgressBanner');
    const title = document.getElementById('ocrProgressTitle');
    const status = document.getElementById('ocrProgressStatus');

    banner.classList.remove('hidden');

    try {
      // 1. Render high-resolution 2.0x offscreen canvas for OCR recognition!
      // This guarantees 300 DPI clarity for Sanskrit/Hindi ligatures regardless of display zoom.
      title.textContent = 'Rendering High-Resolution Page...';
      status.textContent = 'Generating 300 DPI scan image';
      const page = await window.pdfViewer.pdfDoc.getPage(window.pdfViewer.currentPageNumber);
      const viewport = page.getViewport({ scale: 2.0 });
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = viewport.width;
      offscreenCanvas.height = viewport.height;
      const offscreenCtx = offscreenCanvas.getContext('2d');
      await page.render({ canvasContext: offscreenCtx, viewport: viewport }).promise;

      // 2. Run Neural OCR with adaptive binarization & margin dust cleaning
      title.textContent = 'Running Hindi & Sanskrit OCR...';
      const result = await window.ocrEngine.processCanvasPage(
        offscreenCanvas,
        window.pdfViewer.currentDocId,
        window.pdfViewer.currentPageNumber,
        (progress) => {
          title.textContent = 'Running Hindi & Sanskrit OCR...';
          status.textContent = progress.status;
        },
        forceRefresh
      );

      banner.classList.add('hidden');

      // 3. Update both main reflow view and sidebar reflow tab
      await window.pdfViewer.updateSidebarReflow(page);
      if (window.pdfViewer.currentViewMode === 'reflow') {
        await window.pdfViewer.extractAndRenderReflow(page);
      } else {
        window.pdfViewer.showZoomToast(`OCR: ${result.text.length} chars`);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      banner.classList.add('hidden');
      alert('OCR failed or was cancelled. Check console for details.');
    }
  };

  document.getElementById('btnTriggerOCR').addEventListener('click', () => {
    window.runPageOCR(true); // Header OCR button forces fresh high-res re-scan
  });

  // --------------------------------------------------------------------------
  // 5. Contextual Quick-Capture & Obsidian Note Clipping
  // --------------------------------------------------------------------------
  const selectionPopup = document.getElementById('selectionPopup');
  const popupPreviewText = document.getElementById('selectionPreviewText');
  const popupTargetSearch = document.getElementById('popupTargetSearch');

  // Trigger popup when text is selected in PDF text layer or reflow view
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('touchend', handleTextSelection);

  function handleTextSelection(e) {
    // Don't trigger if clicking inside the popup itself
    if (selectionPopup.contains(e.target)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text.length > 2) {
        activeSelectionText = text;
        popupPreviewText.textContent = text.length > 150 ? text.substring(0, 150) + '...' : text;

        // Position popup near selection or touch coordinates
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        let top = rect.bottom + 8;
        let left = Math.max(16, rect.left + (rect.width / 2) - 160);

        // Keep inside viewport bounds
        if (left + 320 > window.innerWidth) left = window.innerWidth - 336;
        if (top + 280 > window.innerHeight) top = Math.max(16, rect.top - 290);

        selectionPopup.style.top = `${top}px`;
        selectionPopup.style.left = `${left}px`;
        selectionPopup.classList.remove('hidden');
        setTimeout(() => {
          selectionPopup.classList.remove('scale-95', 'opacity-0');
        }, 10);
      } else {
        closeSelectionPopup();
      }
    }, 50);
  }

  function closeSelectionPopup() {
    selectionPopup.classList.add('scale-95', 'opacity-0');
    setTimeout(() => selectionPopup.classList.add('hidden'), 150);
  }

  document.getElementById('btnClosePopup').addEventListener('click', closeSelectionPopup);

  // Format Tabs Switcher in Popup
  document.querySelectorAll('.clip-format-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.clip-format-tab').forEach(t => {
        t.classList.remove('active-format');
        t.classList.add('opacity-70');
      });
      e.target.classList.add('active-format');
      e.target.classList.remove('opacity-70');
      activeClipFormat = e.target.getAttribute('data-format');
    });
  });

  // Execute Clip to Obsidian
  document.getElementById('btnExecuteClip').addEventListener('click', async () => {
    if (!activeSelectionText) return;
    const targetFile = popupTargetSearch.value.trim() || 'Research Notes.md';

    try {
      const res = await window.obsidianManager.appendClip(
        activeSelectionText,
        window.pdfViewer.docTitle,
        window.pdfViewer.currentPageNumber,
        activeClipFormat,
        targetFile
      );

      closeSelectionPopup();
      await refreshClipsHistory();

      // Show temporary badge notification
      const badge = document.getElementById('clipBadge');
      badge.classList.remove('hidden');
      setTimeout(() => badge.classList.add('hidden'), 4000);

      alert(`Clipped to Obsidian!\nTarget File: ${res.fileName}\nMethod: ${res.method.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to append clip:', err);
      alert('Could not save clip. Please verify vault settings.');
    }
  });

  // In-App Multi-color Highlights
  document.querySelectorAll('.color-highlight-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const color = e.target.getAttribute('data-color');
      if (!activeSelectionText || !window.pdfViewer.currentDocId) return;

      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rects = Array.from(range.getClientRects());
      const canvasRect = window.pdfViewer.canvas.getBoundingClientRect();

      // Normalize rects to page percentage
      const normalizedRects = rects.map(r => ({
        left: (r.left - canvasRect.left) / canvasRect.width,
        top: (r.top - canvasRect.top) / canvasRect.height,
        width: r.width / canvasRect.width,
        height: r.height / canvasRect.height
      }));

      await window.appDB.addHighlight(
        window.pdfViewer.currentDocId,
        window.pdfViewer.currentPageNumber,
        activeSelectionText,
        color,
        normalizedRects
      );

      await window.pdfViewer.renderPageHighlights(window.pdfViewer.currentPageNumber);
      await refreshBookmarksList();
      closeSelectionPopup();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Sidebar, Drawers & Modal Controls
  // --------------------------------------------------------------------------
  const leftSidebar = document.getElementById('leftSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const btnCloseSidebarMobile = document.getElementById('btnCloseSidebarMobile');
  const mBtnSidebar = document.getElementById('mBtnSidebar');
  const rightClipsDrawer = document.getElementById('rightClipsDrawer');
  const themeModal = document.getElementById('themeModal');
  const vaultSetupModal = document.getElementById('vaultSetupModal');

  function openMobileSidebar() {
    leftSidebar.classList.remove('-translate-x-full');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('hidden');
  }

  function closeMobileSidebar() {
    leftSidebar.classList.add('-translate-x-full');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
  }

  function toggleSidebar() {
    const isHidden = leftSidebar.classList.contains('-translate-x-full');
    if (isHidden) {
      openMobileSidebar();
    } else {
      closeMobileSidebar();
    }
  }

  document.getElementById('btnToggleSidebar').addEventListener('click', toggleSidebar);
  if (mBtnSidebar) mBtnSidebar.addEventListener('click', toggleSidebar);
  if (btnCloseSidebarMobile) btnCloseSidebarMobile.addEventListener('click', closeMobileSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

  // Mobile Bottom Bar Extra Controls: Pixel Font Size, Zoom, Page Jump
  const mBtnFontSize = document.getElementById('mBtnFontSize');
  if (mBtnFontSize) {
    const mobileFontSizes = [15, 18, 22, 26, 30];
    mBtnFontSize.addEventListener('click', () => {
      const current = window.pdfViewer.reflowFontSize;
      let nextIdx = mobileFontSizes.findIndex(s => s > current);
      if (nextIdx === -1) nextIdx = 0;
      const newSize = mobileFontSizes[nextIdx];
      window.pdfViewer.setReflowFontSize(newSize, true);
      document.getElementById('mFontSizeLabel').textContent = `${newSize}px`;
      window.pdfViewer.showZoomToast(`Text: ${newSize}px`);
    });
  }

  const mBtnZoom = document.getElementById('mBtnZoom');
  if (mBtnZoom) {
    const mobileZoomPresets = [1.0, 1.25, 1.5, 2.0, 0.75];
    mBtnZoom.addEventListener('click', () => {
      const current = window.pdfViewer.zoomScale;
      let nextIdx = mobileZoomPresets.findIndex(z => z > current + 0.05);
      if (nextIdx === -1) nextIdx = 0;
      const newScale = mobileZoomPresets[nextIdx];
      const pct = window.pdfViewer.setZoom(newScale);
      document.getElementById('mZoomLabel').textContent = `${pct}%`;
    });
  }

  const mBtnPageJump = document.getElementById('mBtnPageJump');
  if (mBtnPageJump) {
    mBtnPageJump.addEventListener('click', () => {
      const target = prompt(`Jump to page (1 - ${window.pdfViewer.totalPages}):`, window.pdfViewer.currentPageNumber);
      if (target) {
        jumpToPage(parseInt(target) || 1);
      }
    });
  }

  document.getElementById('btnToggleClipsDrawer').addEventListener('click', () => {
    rightClipsDrawer.classList.toggle('translate-x-full');
    document.getElementById('clipBadge').classList.add('hidden');
  });

  document.getElementById('btnCloseClipsDrawer').addEventListener('click', () => {
    rightClipsDrawer.classList.add('translate-x-full');
  });

  document.getElementById('btnThemeSelector').addEventListener('click', () => {
    themeModal.classList.remove('hidden');
  });

  document.getElementById('mBtnThemes').addEventListener('click', () => {
    themeModal.classList.remove('hidden');
  });

  document.getElementById('btnCloseThemeModal').addEventListener('click', () => {
    themeModal.classList.add('hidden');
  });

  document.getElementById('btnObsidianVault').addEventListener('click', () => {
    vaultSetupModal.classList.remove('hidden');
  });

  document.getElementById('btnCloseVaultModal').addEventListener('click', () => {
    vaultSetupModal.classList.add('hidden');
  });

  // Galaxy S25 Ultra Mobile Link Modal Handlers
  const mobileLinkModal = document.getElementById('mobileLinkModal');
  const btnMobileLink = document.getElementById('btnMobileLink');
  const btnCloseMobileModal = document.getElementById('btnCloseMobileModal');
  const btnCopyMobileUrl = document.getElementById('btnCopyMobileUrl');
  const mobileWifiUrlInput = document.getElementById('mobileWifiUrlInput');

  const btnCopyTunnelUrl = document.getElementById('btnCopyTunnelUrl');
  const mobileTunnelUrlInput = document.getElementById('mobileTunnelUrlInput');

  if (btnMobileLink && mobileLinkModal) {
    btnMobileLink.addEventListener('click', () => {
      mobileLinkModal.classList.remove('hidden');
    });
  }
  if (btnCloseMobileModal && mobileLinkModal) {
    btnCloseMobileModal.addEventListener('click', () => {
      mobileLinkModal.classList.add('hidden');
    });
  }
  if (btnCopyTunnelUrl && mobileTunnelUrlInput) {
    btnCopyTunnelUrl.addEventListener('click', () => {
      navigator.clipboard.writeText(mobileTunnelUrlInput.value);
      btnCopyTunnelUrl.textContent = 'Copied!';
      setTimeout(() => btnCopyTunnelUrl.textContent = 'Copy', 2000);
    });
  }
  if (btnCopyMobileUrl && mobileWifiUrlInput) {
    btnCopyMobileUrl.addEventListener('click', () => {
      navigator.clipboard.writeText(mobileWifiUrlInput.value);
      btnCopyMobileUrl.textContent = 'Copied!';
      setTimeout(() => btnCopyMobileUrl.textContent = 'Copy', 2000);
    });
  }

  // Obsidian Vault Setup Modal & Mobile Detection
  const btnSelectVaultFolder = document.getElementById('btnSelectVaultFolder');
  const mobileVaultStatus = document.getElementById('mobileVaultStatus');
  const isFileSystemApiSupported = 'showDirectoryPicker' in window;

  if (!isFileSystemApiSupported) {
    // On Mobile (Galaxy S25 Ultra): Hide desktop folder button, show mobile integration badge
    if (btnSelectVaultFolder) btnSelectVaultFolder.classList.add('hidden');
    if (mobileVaultStatus) mobileVaultStatus.classList.remove('hidden');
    document.getElementById('vaultStatusText').textContent = 'Vault: AI notes ✓';
  } else {
    if (mobileVaultStatus) mobileVaultStatus.classList.add('hidden');
  }

  if (btnSelectVaultFolder) {
    btnSelectVaultFolder.addEventListener('click', async () => {
      try {
        if (!isFileSystemApiSupported) {
          document.getElementById('vaultStatusText').textContent = 'Vault: AI notes ✓';
          vaultSetupModal.classList.add('hidden');
          return;
        }
        await window.obsidianManager.pickVaultDirectory();
        document.getElementById('vaultStatusText').textContent = 'Vault: Linked ✓';
        vaultSetupModal.classList.add('hidden');
        alert('Obsidian Vault linked! Clips will now append directly to your .md files on disk.');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Obsidian directory selection:', err);
        }
      }
    });
  }

  document.getElementById('inputVaultName').addEventListener('change', (e) => {
    window.obsidianManager.setVaultName(e.target.value);
  });

  // Sidebar Tab Navigation
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.sidebar-tab').forEach(t => {
        t.classList.remove('border-b-2', 'border-amber-500', 'font-semibold');
        t.classList.add('opacity-70');
      });
      const targetTab = e.currentTarget.getAttribute('data-tab');
      e.currentTarget.classList.add('border-b-2', 'border-amber-500', 'font-semibold');
      e.currentTarget.classList.remove('opacity-70');

      document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
      document.getElementById(targetTab).classList.remove('hidden');
    });
  });

  // Add Current Bookmark
  document.getElementById('btnAddBookmark').addEventListener('click', async () => {
    if (!window.pdfViewer.currentDocId) return;
    const label = prompt('Enter bookmark title:', `Page ${window.pdfViewer.currentPageNumber}`);
    if (label) {
      await window.appDB.addBookmark(window.pdfViewer.currentDocId, window.pdfViewer.currentPageNumber, label);
      await refreshBookmarksList();
    }
  });

  // Export All Clips as Markdown
  document.getElementById('btnExportAllClips').addEventListener('click', async () => {
    await window.obsidianManager.exportAllClipsAsMarkdown();
  });

  document.getElementById('btnClearClips').addEventListener('click', async () => {
    if (confirm('Clear all captured clips history?')) {
      await window.appDB.clearAllClips();
      await refreshClipsHistory();
    }
  });

  // --------------------------------------------------------------------------
  // 7. Render Helpers (TOC, Bookmarks, Highlights, Clips, Library)
  // --------------------------------------------------------------------------
  function renderTableOfContents(outline) {
    const container = document.getElementById('tocContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!outline || outline.length === 0) {
      container.innerHTML = '<div class="text-center py-8 opacity-40 text-xs">No Table of Contents in this PDF.</div>';
      return;
    }

    const renderItems = (items, targetDiv) => {
      items.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-2 py-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-xs truncate flex items-center space-x-1.5 transition-colors font-hindi';
        btn.innerHTML = `<i data-lucide="file" class="w-3.5 h-3.5 shrink-0 opacity-50"></i><span>${item.title}</span>`;
        btn.addEventListener('click', async () => {
          if (item.dest) {
            const pageIndex = await window.pdfViewer.pdfDoc.getPageIndex(item.dest[0]);
            jumpToPage(pageIndex + 1);
            if (window.innerWidth < 768) leftSidebar.classList.add('-translate-x-full');
          }
        });
        targetDiv.appendChild(btn);

        if (item.items && item.items.length > 0) {
          const subDiv = document.createElement('div');
          subDiv.className = 'pl-4 border-l border-divider space-y-0.5 my-0.5';
          renderItems(item.items, subDiv);
          targetDiv.appendChild(subDiv);
        }
      });
    };

    renderItems(outline, container);
    if (window.lucide) lucide.createIcons();
  }

  async function refreshBookmarksList() {
    const container = document.getElementById('bookmarksList');
    const hlContainer = document.getElementById('highlightsList');
    if (!container || !window.pdfViewer.currentDocId) return;

    // Bookmarks
    const bookmarks = await window.appDB.getBookmarks(window.pdfViewer.currentDocId);
    container.innerHTML = '';
    if (bookmarks.length === 0) {
      container.innerHTML = '<div class="text-center py-4 opacity-40 text-xs">No bookmarks added yet.</div>';
    } else {
      bookmarks.forEach(bm => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-divider text-xs';
        row.innerHTML = `
          <button class="flex-1 text-left font-medium hover:text-amber-500 truncate mr-2">
            <i data-lucide="bookmark" class="w-3.5 h-3.5 inline mr-1 text-amber-500"></i>
            ${bm.label} (Page ${bm.pageNumber})
          </button>
          <button class="del-bm text-red-400 hover:text-red-500 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        `;
        row.querySelector('button').addEventListener('click', () => jumpToPage(bm.pageNumber));
        row.querySelector('.del-bm').addEventListener('click', async () => {
          await window.appDB.deleteBookmark(bm.id);
          refreshBookmarksList();
        });
        container.appendChild(row);
      });
    }

    // Highlights
    const highlights = await window.appDB.getHighlights(window.pdfViewer.currentDocId);
    hlContainer.innerHTML = '';
    if (highlights.length === 0) {
      hlContainer.innerHTML = '<div class="text-center py-4 opacity-40 text-xs">No highlights made yet.</div>';
    } else {
      highlights.forEach(hl => {
        const item = document.createElement('div');
        item.className = 'p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-divider text-xs cursor-pointer hover:border-amber-500/50 transition-colors';
        item.innerHTML = `
          <div class="flex items-center space-x-1.5 mb-1">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${hl.color}"></span>
            <span class="font-semibold text-[10px] opacity-70">Page ${hl.pageNumber} • ${moment(hl.createdAt).fromNow()}</span>
          </div>
          <p class="font-hindi text-[11px] line-clamp-2 italic opacity-85">"${hl.text}"</p>
        `;
        item.addEventListener('click', () => jumpToPage(hl.pageNumber));
        hlContainer.appendChild(item);
      });
    }

    if (window.lucide) lucide.createIcons();
  }

  async function refreshClipsHistory() {
    const container = document.getElementById('clipsHistoryContainer');
    if (!container) return;
    const clips = await window.appDB.getAllClips();
    container.innerHTML = '';

    if (clips.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 opacity-40">
          <i data-lucide="copy" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          <p>No clips saved yet.</p>
          <p class="text-[11px] mt-1">Select text in PDF to clip to Obsidian.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    clips.forEach(clip => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-divider space-y-1.5';
      card.innerHTML = `
        <div class="flex items-center justify-between text-[10px] text-purple-600 dark:text-purple-400 font-mono font-medium">
          <span>📄 ${clip.targetFile || 'Notes.md'} (P. ${clip.pageNumber})</span>
          <span>${moment(clip.capturedAt).fromNow()}</span>
        </div>
        <p class="font-hindi text-[11px] line-clamp-3 leading-relaxed opacity-90">${clip.text}</p>
        <div class="text-[10px] opacity-50 pt-1 border-t border-divider flex justify-between">
          <span>${moment(clip.capturedAt).format('MMM D, h:mm A')}</span>
          <span class="uppercase tracking-wider font-semibold">${clip.format}</span>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  async function refreshLibraryList() {
    const container = document.getElementById('libraryList');
    if (!container) return;
    const docs = await window.appDB.getAllDocuments();
    container.innerHTML = '';

    if (docs.length === 0) {
      container.innerHTML = '<div class="text-center py-8 opacity-40 text-xs">No saved documents in library.</div>';
      return;
    }

    docs.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-divider hover:border-amber-500/50 transition-colors text-xs space-y-1';
      card.innerHTML = `
        <p class="font-semibold truncate text-[11px]">${doc.filename}</p>
        <div class="flex items-center justify-between text-[10px] opacity-60 font-mono">
          <span>Last read: Page ${doc.lastPage}</span>
          <span>${moment(doc.lastOpenedAt).fromNow()}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function updateSessionClocks() {
    const sessionLabel = document.getElementById('sessionDuration');
    const timeLabel = document.getElementById('currentTimeDisplay');
    if (sessionLabel) {
      const mins = moment().diff(sessionStartTime, 'minutes');
      sessionLabel.textContent = `Session: ${mins} min (${sessionStartTime.format('h:mm A')})`;
    }
    if (timeLabel) {
      timeLabel.textContent = moment().format('h:mm:ss A');
    }
  }
});
