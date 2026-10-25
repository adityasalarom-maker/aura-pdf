/**
 * AuraPDF — Core PDF.js Rendering, Multilingual Reflow & Scroll Page Shifter
 * Features:
 * 1. High-fidelity hardware-accelerated Canvas with transparent HTML Text Layer
 * 2. 25% enlarged typography & zoom by default (125% zoom, 23px reflow font)
 * 3. Continuous Scroll Page Shift: mouse wheel at page boundaries turns pages smoothly
 * 4. Sidebar Reflow Reader: extracts and formats Hindi & English text inside left panel
 * 5. Robust standard font & CMap handling so no PDF renders blank
 */

class PDFViewer {
  constructor() {
    this.pdfDoc = null;
    this.currentDocId = null;
    this.docTitle = 'Document';
    this.currentPageNumber = 1;
    this.totalPages = 0;
    this.zoomScale = 1.25; // Default text display increased by 25%
    this.currentViewMode = 'original'; // 'original' | 'reflow'
    this.reflowFontSize = 23; // Default reflow font increased to 23px
    this.reflowLineHeight = 1.75;

    this.canvas = document.getElementById('pdfCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.textLayerContainer = document.getElementById('textLayer');
    this.canvasWrapper = document.getElementById('canvasWrapper');
    this.reflowWrapper = document.getElementById('reflowWrapper');
    this.reflowContent = document.getElementById('reflowContent');
    this.scrollContainer = document.getElementById('pdfScrollContainer');
    this.sidebarReflowContent = document.getElementById('sidebarReflowContent');
    this.sidebarReflowPageLabel = document.getElementById('sidebarReflowPageLabel');
    this.dropzone = document.getElementById('dropzoneEmptyState');

    this.renderTask = null;
    this.outline = [];
    this.isPageShifting = false;

    // Initialize Wheel and Gesture Scroll Page Shifter
    this.setupScrollPageShift();
  }

  /**
   * Load PDF Document from File Blob or ArrayBuffer
   */
  async loadDocument(fileOrBuffer, docName = 'Document.pdf') {
    this.docTitle = docName;
    let data;

    if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
      data = await fileOrBuffer.arrayBuffer();
    } else {
      data = fileOrBuffer;
    }

    // Clone data buffer to prevent detachment issues
    const bufferCopy = data.slice(0);
    this.currentDocId = `${docName}_${data.byteLength}`;

    const loadingTask = pdfjsLib.getDocument({
      data: bufferCopy,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
      enableScripting: false
    });

    this.pdfDoc = await loadingTask.promise;
    this.totalPages = this.pdfDoc.numPages;

    // Hide Dropzone and reveal canvas
    if (this.dropzone) this.dropzone.classList.add('hidden');
    if (this.canvasWrapper) this.canvasWrapper.classList.remove('hidden');

    // Extract PDF Table of Contents (Outline)
    try {
      this.outline = (await this.pdfDoc.getOutline()) || [];
    } catch (e) {
      this.outline = [];
    }

    return {
      docId: this.currentDocId,
      totalPages: this.totalPages,
      outline: this.outline
    };
  }

  /**
   * Render Page in High-Fidelity Original Canvas Mode
   */
  async renderPage(pageNumber) {
    if (!this.pdfDoc || pageNumber < 1 || pageNumber > this.totalPages) return;
    this.currentPageNumber = pageNumber;

    if (this.renderTask) {
      this.renderTask.cancel();
    }

    const page = await this.pdfDoc.getPage(pageNumber);

    // Calculate High-DPR viewport for crisp rendering on Galaxy S25 Ultra & high-res screens
    const dpr = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale: this.zoomScale });

    this.canvas.width = Math.floor(viewport.width * dpr);
    this.canvas.height = Math.floor(viewport.height * dpr);
    this.canvas.style.width = `${Math.floor(viewport.width)}px`;
    this.canvas.style.height = `${Math.floor(viewport.height)}px`;

    this.canvasWrapper.style.width = `${Math.floor(viewport.width)}px`;
    this.canvasWrapper.style.height = `${Math.floor(viewport.height)}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const renderContext = {
      canvasContext: this.ctx,
      viewport: viewport
    };

    this.renderTask = page.render(renderContext);
    await this.renderTask.promise;

    // Render Synchronized Transparent HTML Text Layer
    await this.renderTextLayer(page, viewport);

    // Render Highlights for this page
    await this.renderPageHighlights(pageNumber);

    // Update Sidebar Reflow Reader (shows text in the left panel!)
    await this.updateSidebarReflow(page);

    // If main viewport is in Reflow mode, update the main reflow text view
    if (this.currentViewMode === 'reflow') {
      await this.extractAndRenderReflow(page);
    }
  }

  /**
   * Render Text Layer for Native Selection
   */
  async renderTextLayer(page, viewport) {
    if (!this.textLayerContainer) return;
    this.textLayerContainer.innerHTML = '';
    this.textLayerContainer.style.width = `${Math.floor(viewport.width)}px`;
    this.textLayerContainer.style.height = `${Math.floor(viewport.height)}px`;

    const textContent = await page.getTextContent();

    pdfjsLib.renderTextLayer({
      textContentSource: textContent,
      container: this.textLayerContainer,
      viewport: viewport,
      textDivs: []
    });
  }

  /**
   * Render Reflow Text inside the Left Side Panel (Issue 3 resolution)
   */
  async updateSidebarReflow(page) {
    if (!this.sidebarReflowContent) return;
    if (this.sidebarReflowPageLabel) {
      this.sidebarReflowPageLabel.textContent = `Page ${this.currentPageNumber}`;
    }

    const textContent = await page.getTextContent();
    const items = textContent.items;

    if (!items || items.length === 0) {
      let ocrText = null;
      if (window.appDB) {
        ocrText = await window.appDB.getOCR(this.currentDocId, this.currentPageNumber);
      }
      if (ocrText) {
        this.sidebarReflowContent.innerHTML = `
          <div class="p-1.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-semibold mb-2 flex items-center justify-between">
            <span>OCR Extracted Text</span>
            <span class="text-[9px] opacity-70 font-mono">Pg ${this.currentPageNumber}</span>
          </div>
          <div class="whitespace-pre-wrap text-[11px] font-hindi leading-relaxed opacity-90">${ocrText}</div>
        `;
        return;
      }
      this.sidebarReflowContent.innerHTML = `
        <div class="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-divider text-center space-y-2">
          <p class="text-[10px] opacity-70">Scanned Page (No digital text layer)</p>
          <button class="w-full py-1 px-2 rounded bg-amber-500 hover:bg-amber-600 text-white font-medium text-[10px] flex items-center justify-center space-x-1 shadow transition-transform active:scale-95" onclick="document.getElementById('btnTriggerOCR').click()">
            <i data-lucide="scan" class="w-3 h-3"></i>
            <span>Run Hindi/English OCR</span>
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    // Heuristic Paragraph Formatter for Sidebar
    let paragraphs = [];
    let currentPara = [];
    let lastY = null;

    items.forEach((item) => {
      const text = item.str;
      const currentY = item.transform[5];

      if (lastY !== null && Math.abs(currentY - lastY) > (item.height * 1.8)) {
        if (currentPara.length > 0) {
          paragraphs.push(currentPara.join(' '));
          currentPara = [];
        }
      }
      if (text.trim().length > 0) currentPara.push(text);
      lastY = currentY;
    });
    if (currentPara.length > 0) paragraphs.push(currentPara.join(' '));

    this.sidebarReflowContent.innerHTML = '';
    paragraphs.forEach((pText) => {
      const p = document.createElement('p');
      p.className = 'font-hindi text-[11px] leading-relaxed opacity-90 pb-1.5 border-b border-divider/30';
      p.textContent = pText;
      this.sidebarReflowContent.appendChild(p);
    });
  }

  /**
   * Main Reflow Mode Formatter
   * Handles both Digital and Scanned PDFs so no page ever renders blank
   */
  async extractAndRenderReflow(page) {
    if (!this.reflowContent) return;
    this.reflowContent.innerHTML = '';

    const textContent = await page.getTextContent();
    const items = textContent.items;

    if (!items || items.length === 0) {
      let ocrText = null;
      if (window.appDB) {
        ocrText = await window.appDB.getOCR(this.currentDocId, this.currentPageNumber);
      }

      if (ocrText) {
        const header = document.createElement('div');
        header.className = 'p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-center justify-between';
        header.innerHTML = `
          <div class="flex items-center space-x-1.5">
            <i data-lucide="scan" class="w-4 h-4 text-amber-500"></i>
            <span class="font-semibold text-xs">Page ${this.currentPageNumber} — Extracted via OCR</span>
          </div>
          <button id="btnReOCRReflow" class="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-[11px] font-medium">Re-scan</button>
        `;
        this.reflowContent.appendChild(header);

        const textDiv = document.createElement('div');
        textDiv.className = 'reflow-paragraph whitespace-pre-wrap leading-relaxed font-hindi';
        textDiv.style.fontSize = `${this.reflowFontSize}px`;
        textDiv.style.lineHeight = this.reflowLineHeight;
        textDiv.textContent = ocrText;
        this.reflowContent.appendChild(textDiv);

        const reBtn = header.querySelector('#btnReOCRReflow');
        if (reBtn) {
          reBtn.addEventListener('click', () => {
            if (window.runPageOCR) {
              window.runPageOCR(true); // forceRefresh = true to overwrite previous bad OCR
            } else {
              const btn = document.getElementById('btnTriggerOCR');
              if (btn) btn.click();
            }
          });
        }
        if (window.lucide) lucide.createIcons();
        return;
      }

      // If not yet OCR'd: Render the visual page canvas inline with an active OCR action banner!
      // This ensures the user NEVER sees an empty screen!
      const noticeCard = document.createElement('div');
      noticeCard.className = 'p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4';
      noticeCard.innerHTML = `
        <div class="flex items-center space-x-2">
          <i data-lucide="scan" class="w-5 h-5 text-amber-500 shrink-0"></i>
          <div>
            <p class="font-semibold text-xs text-amber-600 dark:text-amber-400">Scanned Page (Page ${this.currentPageNumber})</p>
            <p class="text-[11px] opacity-75">Extract Hindi & English text directly on this page via on-device OCR.</p>
          </div>
        </div>
        <button id="btnInlineRunOCR" class="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow transition-transform active:scale-95 shrink-0">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
          <span>⚡ Run Hindi OCR</span>
        </button>
      `;
      this.reflowContent.appendChild(noticeCard);

      const btnInline = noticeCard.querySelector('#btnInlineRunOCR');
      if (btnInline) {
        btnInline.addEventListener('click', () => {
          if (window.runPageOCR) {
            window.runPageOCR(false);
          } else {
            const btn = document.getElementById('btnTriggerOCR');
            if (btn) btn.click();
          }
        });
      }

      // Render the visual page canvas inline
      const inlineCanvas = document.createElement('canvas');
      inlineCanvas.className = 'max-w-full rounded-lg shadow-md mx-auto block border border-divider';
      const inlineCtx = inlineCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: 1.25 });
      inlineCanvas.width = Math.floor(viewport.width * dpr);
      inlineCanvas.height = Math.floor(viewport.height * dpr);
      inlineCanvas.style.width = `${Math.min(viewport.width, 800)}px`;
      inlineCanvas.style.height = 'auto';
      inlineCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      page.render({ canvasContext: inlineCtx, viewport: viewport });
      this.reflowContent.appendChild(inlineCanvas);

      if (window.lucide) lucide.createIcons();
      return;
    }

    let paragraphs = [];
    let currentPara = [];
    let lastY = null;

    items.forEach((item) => {
      const text = item.str;
      const currentY = item.transform[5];

      if (lastY !== null && Math.abs(currentY - lastY) > (item.height * 1.8)) {
        if (currentPara.length > 0) {
          paragraphs.push(currentPara.join(' '));
          currentPara = [];
        }
      }
      if (text.trim().length > 0) currentPara.push(text);
      lastY = currentY;
    });
    if (currentPara.length > 0) paragraphs.push(currentPara.join(' '));

    paragraphs.forEach((paraText) => {
      const p = document.createElement('p');
      p.className = 'reflow-paragraph leading-relaxed tracking-normal font-hindi';
      p.style.fontSize = `${this.reflowFontSize}px`;
      p.style.lineHeight = this.reflowLineHeight;
      p.textContent = paraText;
      this.reflowContent.appendChild(p);
    });
  }

  /**
   * Smooth Viewport Scrolling, Mouse Wheel Page Shifter & Touch Swipe (Issue 3 resolution)
   * Enables mouse wheel to flip pages when reaching boundaries or fitting screen, plus mobile swipe.
   */
  setupScrollPageShift() {
    if (!this.scrollContainer) return;

    let lastWheelShiftTime = 0;

    // Desktop Mouse Wheel Scroll Page Shifter (Issue 3 resolution)
    this.scrollContainer.addEventListener('wheel', (e) => {
      if (!this.pdfDoc || this.isPageShifting) return;
      const now = Date.now();
      if (now - lastWheelShiftTime < 380) return; // Debounce so 1 gesture flips 1 page cleanly

      const fitsInScreen = (this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight) < 25;
      const isAtBottom = (this.scrollContainer.scrollTop + this.scrollContainer.clientHeight) >= (this.scrollContainer.scrollHeight - 15);
      const isAtTop = this.scrollContainer.scrollTop <= 10;

      // Scroll Down (deltaY > 0) -> Next Page
      if (e.deltaY > 25) {
        if (fitsInScreen || isAtBottom) {
          if (this.currentPageNumber < this.totalPages) {
            e.preventDefault();
            lastWheelShiftTime = now;
            this.triggerPageShift(this.currentPageNumber + 1, 'top');
          }
        }
      }
      // Scroll Up (deltaY < 0) -> Previous Page
      else if (e.deltaY < -25) {
        if (fitsInScreen || isAtTop) {
          if (this.currentPageNumber > 1) {
            e.preventDefault();
            lastWheelShiftTime = now;
            this.triggerPageShift(this.currentPageNumber - 1, 'bottom');
          }
        }
      }
    }, { passive: false });

    // Mobile swipe gesture for Galaxy S25 Ultra
    let touchStartX = 0;
    let touchStartY = 0;
    this.scrollContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    this.scrollContainer.addEventListener('touchend', (e) => {
      if (!this.pdfDoc || this.isPageShifting) return;
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Horizontal swipe navigation (when horizontal swipe is dominant)
      if (Math.abs(diffX) > 75 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX < 0 && this.currentPageNumber < this.totalPages) {
          this.triggerPageShift(this.currentPageNumber + 1, 'top');
        } else if (diffX > 0 && this.currentPageNumber > 1) {
          this.triggerPageShift(this.currentPageNumber - 1, 'top');
        }
      }
    }, { passive: true });
  }

  async triggerPageShift(targetPage, scrollTarget = 'top') {
    this.isPageShifting = true;
    
    // Update input display
    const pageInput = document.getElementById('inputCurrentPage');
    if (pageInput) pageInput.value = targetPage;
    const mPage = document.getElementById('mPageDisplay');
    if (mPage) mPage.textContent = `${targetPage} / ${this.totalPages}`;

    await this.renderPage(targetPage);

    // Smoothly scroll to the target edge of the newly rendered page
    if (scrollTarget === 'top') {
      this.scrollContainer.scrollTop = 0;
    } else {
      this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight;
    }

    if (window.persistCurrentReadingState) {
      await window.persistCurrentReadingState();
    }

    setTimeout(() => {
      this.isPageShifting = false;
    }, 280);
  }

  /**
   * Highlights Overlay Renderer
   */
  async renderPageHighlights(pageNumber) {
    if (!window.appDB || !this.currentDocId) return;
    const highlights = await window.appDB.getHighlights(this.currentDocId);
    const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber);

    const existing = document.getElementById('highlightsOverlay');
    if (existing) existing.remove();

    if (pageHighlights.length === 0) return;

    const overlay = document.createElement('div');
    overlay.id = 'highlightsOverlay';
    overlay.className = 'absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-10';

    pageHighlights.forEach(hl => {
      if (hl.rects && hl.rects.length > 0) {
        hl.rects.forEach(rect => {
          const mark = document.createElement('div');
          mark.className = 'absolute user-highlight-mark';
          mark.style.left = `${rect.left * 100}%`;
          mark.style.top = `${rect.top * 100}%`;
          mark.style.width = `${rect.width * 100}%`;
          mark.style.height = `${rect.height * 100}%`;
          mark.style.backgroundColor = hl.color || '#facc15';
          overlay.appendChild(mark);
        });
      }
    });

    this.canvasWrapper.appendChild(overlay);
  }

  /**
   * Zoom & Fit Helpers (Issue 4 resolution: immediately visible zoom changes in both Original and Reflow modes)
   */
  setZoom(scale) {
    this.zoomScale = Math.min(Math.max(scale, 0.5), 3.0);
    const pct = Math.round(this.zoomScale * 100);

    const label = document.getElementById('zoomPercentageLabel');
    if (label) label.textContent = `${pct}%`;

    if (this.currentViewMode === 'original') {
      this.renderPage(this.currentPageNumber);
    } else {
      // In Reflow mode: dynamically scale reflow typography so clicking zoom/% visibly rescales text!
      this.reflowFontSize = Math.round(18 * this.zoomScale);
      const fsLabel = document.getElementById('reflowFontSizeLabel');
      if (fsLabel) fsLabel.textContent = `${this.reflowFontSize}px`;

      const paras = document.querySelectorAll('.reflow-paragraph');
      paras.forEach(p => {
        p.style.fontSize = `${this.reflowFontSize}px`;
      });
    }

    this.showZoomToast(`${pct}%`);
    return pct;
  }

  showZoomToast(text) {
    const toast = document.getElementById('zoomToast');
    if (!toast) return;
    toast.textContent = `Zoom: ${text}`;
    toast.classList.add('show');
    clearTimeout(this._zoomToastTimer);
    this._zoomToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 800);
  }

  fitToWidth() {
    if (!this.scrollContainer || !this.canvas) return;
    const containerWidth = this.scrollContainer.clientWidth - 40;
    const currentCanvasWidth = parseFloat(this.canvas.style.width) || 600;
    const currentScale = this.zoomScale;
    const newScale = (containerWidth / currentCanvasWidth) * currentScale;
    return this.setZoom(newScale);
  }

  fitToPage() {
    if (!this.scrollContainer || !this.canvas) return;
    const containerHeight = this.scrollContainer.clientHeight - 48;
    const currentCanvasHeight = parseFloat(this.canvas.style.height) || 800;
    const currentScale = this.zoomScale;
    const newScale = (containerHeight / currentCanvasHeight) * currentScale;
    return this.setZoom(newScale);
  }

  toggleViewMode(mode) {
    this.currentViewMode = mode;
    const mModeLabel = document.getElementById('mModeLabel');
    if (mode === 'reflow') {
      this.canvasWrapper.classList.add('hidden');
      this.reflowWrapper.classList.remove('hidden');
      document.getElementById('reflowControlsBar').classList.remove('hidden');
      if (mModeLabel) mModeLabel.textContent = 'Original';
      if (this.pdfDoc) {
        this.pdfDoc.getPage(this.currentPageNumber).then(page => {
          this.extractAndRenderReflow(page);
        });
      }
    } else {
      this.canvasWrapper.classList.remove('hidden');
      this.reflowWrapper.classList.add('hidden');
      document.getElementById('reflowControlsBar').classList.add('hidden');
      if (mModeLabel) mModeLabel.textContent = 'Reflow';
      this.renderPage(this.currentPageNumber);
    }
  }

  setReflowFontSize(val, isAbsolute = false) {
    if (isAbsolute) {
      this.reflowFontSize = Math.min(Math.max(val, 12), 48);
    } else {
      this.reflowFontSize = Math.min(Math.max(this.reflowFontSize + val, 12), 48);
    }
    const label = document.getElementById('reflowFontSizeLabel');
    if (label) label.textContent = `${this.reflowFontSize}px`;
    const mLabel = document.getElementById('mFontSizeLabel');
    if (mLabel) mLabel.textContent = `${this.reflowFontSize}px`;

    const paras = document.querySelectorAll('.reflow-paragraph');
    paras.forEach(p => p.style.fontSize = `${this.reflowFontSize}px`);
    return this.reflowFontSize;
  }

  setReflowLineHeight(lh) {
    this.reflowLineHeight = lh;
    const paras = document.querySelectorAll('.reflow-paragraph');
    paras.forEach(p => p.style.lineHeight = lh);
  }
}

// Global PDF Viewer instance
window.pdfViewer = new PDFViewer();
