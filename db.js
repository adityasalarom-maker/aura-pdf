/**
 * AuraPDF — IndexedDB Persistence Engine
 * Handles persistent storage for document reading positions, preferences,
 * bookmarks, multi-color highlights, OCR text cache, and Obsidian clips.
 */

class AppDatabase {
  constructor() {
    this.dbName = 'AuraPDF_DB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('IndexedDB Error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Documents Store: tracks metadata, reading progress, and settings
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('lastOpenedAt', 'lastOpenedAt', { unique: false });
        }

        // 2. Bookmarks Store: user bookmarks per document
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bmStore = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
          bmStore.createIndex('documentId', 'documentId', { unique: false });
        }

        // 3. Highlights Store: saved passages and coordinate boxes
        if (!db.objectStoreNames.contains('highlights')) {
          const hlStore = db.createObjectStore('highlights', { keyPath: 'id', autoIncrement: true });
          hlStore.createIndex('documentId', 'documentId', { unique: false });
        }

        // 4. Clips Store: captured Obsidian research passages
        if (!db.objectStoreNames.contains('clips')) {
          const clipStore = db.createObjectStore('clips', { keyPath: 'id', autoIncrement: true });
          clipStore.createIndex('documentId', 'documentId', { unique: false });
          clipStore.createIndex('capturedAt', 'capturedAt', { unique: false });
        }

        // 5. OCR Cache Store: extracted text for scanned image-only pages
        if (!db.objectStoreNames.contains('ocrCache')) {
          db.createObjectStore('ocrCache', { keyPath: 'pageKey' });
        }
      };
    });
  }

  // --- Document Progress & History ---
  async saveDocumentProgress(docData) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['documents'], 'readwrite');
      const store = tx.objectStore('documents');
      
      // Update with moment.js ISO timestamp
      docData.lastOpenedAt = moment().toISOString();
      const request = store.put(docData);

      request.onsuccess = () => resolve(docData);
      request.onerror = () => reject(request.error);
    });
  }

  async getDocumentProgress(docId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['documents'], 'readonly');
      const store = tx.objectStore('documents');
      const request = store.get(docId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDocuments() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['documents'], 'readonly');
      const store = tx.objectStore('documents');
      const index = store.index('lastOpenedAt');
      const request = index.getAll();

      request.onsuccess = () => {
        // Return documents in reverse chronological order
        const docs = request.result || [];
        docs.sort((a, b) => moment(b.lastOpenedAt).diff(moment(a.lastOpenedAt)));
        resolve(docs);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // --- Bookmarks ---
  async addBookmark(docId, pageNumber, label) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['bookmarks'], 'readwrite');
      const store = tx.objectStore('bookmarks');
      const item = {
        documentId: docId,
        pageNumber,
        label: label || `Page ${pageNumber}`,
        createdAt: moment().toISOString()
      };
      const request = store.add(item);
      request.onsuccess = () => resolve({ id: request.result, ...item });
      request.onerror = () => reject(request.error);
    });
  }

  async getBookmarks(docId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['bookmarks'], 'readonly');
      const store = tx.objectStore('bookmarks');
      const index = store.index('documentId');
      const request = index.getAll(docId);

      request.onsuccess = () => {
        const items = request.result || [];
        items.sort((a, b) => a.pageNumber - b.pageNumber);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBookmark(id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['bookmarks'], 'readwrite');
      const store = tx.objectStore('bookmarks');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Highlights ---
  async addHighlight(docId, pageNumber, text, color, rects) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['highlights'], 'readwrite');
      const store = tx.objectStore('highlights');
      const item = {
        documentId: docId,
        pageNumber,
        text,
        color: color || '#facc15',
        rects: rects || [],
        createdAt: moment().toISOString()
      };
      const request = store.add(item);
      request.onsuccess = () => resolve({ id: request.result, ...item });
      request.onerror = () => reject(request.error);
    });
  }

  async getHighlights(docId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['highlights'], 'readonly');
      const store = tx.objectStore('highlights');
      const index = store.index('documentId');
      const request = index.getAll(docId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Obsidian Clips ---
  async saveClip(clipData) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['clips'], 'readwrite');
      const store = tx.objectStore('clips');
      const item = {
        ...clipData,
        capturedAt: moment().toISOString()
      };
      const request = store.add(item);
      request.onsuccess = () => resolve({ id: request.result, ...item });
      request.onerror = () => reject(request.error);
    });
  }

  async getAllClips() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['clips'], 'readonly');
      const store = tx.objectStore('clips');
      const request = store.getAll();

      request.onsuccess = () => {
        const clips = request.result || [];
        clips.sort((a, b) => moment(b.capturedAt).diff(moment(a.capturedAt)));
        resolve(clips);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllClips() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['clips'], 'readwrite');
      const store = tx.objectStore('clips');
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // --- OCR Cache ---
  async saveOCR(docId, pageNum, text) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['ocrCache'], 'readwrite');
      const store = tx.objectStore('ocrCache');
      const item = {
        pageKey: `${docId}_p${pageNum}`,
        text,
        cachedAt: moment().toISOString()
      };
      const request = store.put(item);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getOCR(docId, pageNum) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['ocrCache'], 'readonly');
      const store = tx.objectStore('ocrCache');
      const request = store.get(`${docId}_p${pageNum}`);
      request.onsuccess = () => resolve(request.result ? request.result.text : null);
      request.onerror = () => reject(request.error);
    });
  }
}

// Global database instance
window.appDB = new AppDatabase();
