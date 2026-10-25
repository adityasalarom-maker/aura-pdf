/**
 * AuraPDF — High-Performance Multilingual On-Device OCR Pipeline
 * Features:
 * 1. Advanced Adaptive Pre-processing (Grayscale + Dynamic Thresholding + Scanner Border Noise Removal)
 * 2. Primary Devanagari (Hindi + Sanskrit) Recognition Engine with Latin/English Fallback
 * 3. Cache-Bypassing Re-Scan capability
 * 4. Post-processing Unicode Devanagari normalizer (removes scanner dust & isolated punctuation artifacts)
 */

class OCREngine {
  constructor() {
    this.worker = null;
    this.isInitializing = false;
    this.isLoaded = false;
    this.activeLanguageMode = 'hin+san+eng'; // Hindi & Sanskrit primary with English fallback
  }

  /**
   * Initialize Tesseract Worker with Hindi & Sanskrit as primary models
   */
  async initWorker(onProgress = null) {
    if (this.worker && this.isLoaded) return this.worker;
    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise(r => setTimeout(r, 100));
      }
      return this.worker;
    }

    this.isInitializing = true;
    try {
      if (onProgress) onProgress({ status: 'Initializing Hindi & Sanskrit Neural Models...', progress: 0.1 });

      // In Tesseract v5, order matters: 'hin+san+eng' places Devanagari lexicon first
      // avoiding English hallucination on Sanskrit/Hindi text
      this.worker = await Tesseract.createWorker(['hin', 'san', 'eng'], 1, {
        logger: (m) => {
          if (onProgress && m.status) {
            const pct = Math.round((m.progress || 0) * 100);
            onProgress({
              status: `${m.status} ${pct > 0 ? `(${pct}%)` : ''}`,
              progress: m.progress || 0
            });
          }
        }
      });

      // Optimize Tesseract parameters for printed Indian & English books
      await this.worker.setParameters({
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO || '3',
      });

      this.isLoaded = true;
      this.isInitializing = false;
      return this.worker;
    } catch (err) {
      this.isInitializing = false;
      console.error('Failed to initialize Tesseract.js worker:', err);
      // Fallback to Hindi + English if Sanskrit model is unavailable in CDN
      try {
        if (onProgress) onProgress({ status: 'Loading Hindi + English Fallback Model...', progress: 0.15 });
        this.worker = await Tesseract.createWorker(['hin', 'eng'], 1, {
          logger: (m) => {
            if (onProgress && m.status) {
              const pct = Math.round((m.progress || 0) * 100);
              onProgress({
                status: `${m.status} ${pct > 0 ? `(${pct}%)` : ''}`,
                progress: m.progress || 0
              });
            }
          }
        });
        this.isLoaded = true;
        this.isInitializing = false;
        return this.worker;
      } catch (err2) {
        this.isInitializing = false;
        console.error('Secondary OCR initialization failed:', err2);
        throw err2;
      }
    }
  }

  /**
   * Pre-process Scanned Canvas for Maximum OCR Accuracy
   * Removes paper yellowing, shadows, dark scanner borders, and enhances ink contrast.
   */
  preprocessCanvas(sourceCanvas) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;

    // Create offscreen high-contrast canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = w;
    pCanvas.height = h;
    const pCtx = pCanvas.getContext('2d');

    // Draw original image
    pCtx.drawImage(sourceCanvas, 0, 0);

    const imgData = pCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // 1. Clear outer 2.5% scanner border margins to prevent dirty edge noise (e.g. --- === %)
    const cropX = Math.floor(w * 0.025);
    const cropY = Math.floor(h * 0.025);

    // 2. Sample pixel luminance to determine background threshold
    let sumLum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 16) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sumLum += lum;
      count++;
    }
    const avgLum = sumLum / (count || 1);
    // Threshold biased towards preserving fine Devanagari ligatures
    const threshold = Math.min(Math.max(avgLum * 0.78, 90), 185);

    // 3. High-Contrast Binarization & Margin Cleaning
    for (let y = 0; y < h; y++) {
      const isMarginY = y < cropY || y > (h - cropY);
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;

        if (isMarginY || x < cropX || x > (w - cropX)) {
          // Force scanner border edges to pure white
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          continue;
        }

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Binarize: ink becomes solid black, paper background becomes pure white
        if (lum < threshold) {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
        } else {
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
        }
      }
    }

    pCtx.putImageData(imgData, 0, 0);
    return pCanvas;
  }

  /**
   * Post-process & Clean Extracted Devanagari/Hindi Text
   */
  cleanExtractedText(rawText) {
    if (!rawText) return '';

    const lines = rawText.split('\n');
    const cleanedLines = [];

    for (let line of lines) {
      let trimmed = line.trim();
      if (!trimmed) continue;

      // Filter out scanner artifacts (lines made up purely of dashes, equals, percent, tildes)
      if (/^[=\-_~%#*><|\\/.\s]{3,}$/.test(trimmed)) continue;

      // Filter out isolated stray scanner noise punctuation
      if (trimmed.length <= 2 && /^[=\-_~%#*><|\\/]$/.test(trimmed)) continue;

      // Normalize multiple consecutive spaces
      trimmed = trimmed.replace(/[ \t]{2,}/g, ' ');

      cleanedLines.push(trimmed);
    }

    return cleanedLines.join('\n\n').normalize('NFC');
  }

  /**
   * Process a page canvas with OCR
   * @param {HTMLCanvasElement} canvasElement 
   * @param {string} docId 
   * @param {number} pageNumber 
   * @param {Function} onProgress 
   * @param {boolean} forceRefresh - If true, bypasses and overwrites IndexedDB cache
   */
  async processCanvasPage(canvasElement, docId, pageNumber, onProgress = null, forceRefresh = false) {
    // 1. Check local IndexedDB cache only if not forcing refresh
    if (!forceRefresh && window.appDB && docId) {
      const cached = await window.appDB.getOCR(docId, pageNumber);
      if (cached && cached.trim().length > 0) {
        if (onProgress) onProgress({ status: 'Loaded from local OCR cache', progress: 1.0 });
        return { text: cached, words: [], isCached: true };
      }
    }

    // 2. Initialize worker
    const worker = await this.initWorker(onProgress);

    // 3. Pre-process Canvas for Devanagari Clarity
    if (onProgress) onProgress({ status: 'Pre-processing page image (binarization & denoising)...', progress: 0.25 });
    const processedCanvas = this.preprocessCanvas(canvasElement);
    const dataUrl = processedCanvas.toDataURL('image/png');

    // 4. Run Neural OCR Recognition
    if (onProgress) onProgress({ status: 'Recognizing Hindi & Sanskrit Devanagari text...', progress: 0.45 });
    const result = await worker.recognize(dataUrl);

    // 5. Clean & Format Extracted Text
    const rawText = result.data.text || '';
    const cleanedText = this.cleanExtractedText(rawText);

    // 6. Save directly to IndexedDB (overwriting any previous bad OCR)
    if (window.appDB && docId && cleanedText.trim().length > 0) {
      await window.appDB.saveOCR(docId, pageNumber, cleanedText);
    }

    return {
      text: cleanedText || rawText,
      words: result.data.words || [],
      confidence: result.data.confidence,
      isCached: false
    };
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isLoaded = false;
    }
  }
}

// Global OCR Engine instance
window.ocrEngine = new OCREngine();
