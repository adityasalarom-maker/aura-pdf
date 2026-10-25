/**
 * AuraPDF — Obsidian Vault Connector & Note Capture System
 * Supports:
 * 1. Direct folder read/write via File System Access API (Windows 11)
 * 2. Obsidian URI deep-links (Galaxy S25 Ultra & Android app integration)
 * 3. Timestamped Markdown formatting with Moment.js
 */

class ObsidianManager {
  constructor() {
    this.vaultName = 'AI notes';
    this.activeFileName = 'Research Notes.md';
    this.dirHandle = null;
    this.knownFiles = ['Research Notes.md', 'Daily Notes.md', 'Inbox.md'];
    this.loadSettings();
  }

  loadSettings() {
    const savedVault = localStorage.getItem('aurapdf_obsidian_vault');
    if (savedVault) this.vaultName = savedVault;
    const savedFile = localStorage.getItem('aurapdf_last_target_file');
    if (savedFile) this.activeFileName = savedFile;
  }

  setVaultName(name) {
    this.vaultName = name.trim() || 'AI notes';
    localStorage.setItem('aurapdf_obsidian_vault', this.vaultName);
  }

  setActiveFile(fileName) {
    let cleanName = fileName.trim();
    if (!cleanName.endsWith('.md') && !cleanName.endsWith('.txt')) {
      cleanName += '.md';
    }
    this.activeFileName = cleanName;
    localStorage.setItem('aurapdf_last_target_file', this.activeFileName);

    if (!this.knownFiles.includes(this.activeFileName)) {
      this.knownFiles.unshift(this.activeFileName);
    }
  }

  /**
   * Request user permission to pick Obsidian Vault folder on disk (Win 11)
   */
  async pickVaultDirectory() {
    if (!('showDirectoryPicker' in window)) {
      console.log('Mobile environment detected: Obsidian URI scheme active.');
      this.isLinked = true;
      return null;
    }

    try {
      this.dirHandle = await window.showDirectoryPicker({
        id: 'obsidian-vault',
        mode: 'readwrite',
        startIn: 'documents'
      });

      // Scan directory for existing markdown files
      await this.scanVaultFiles();
      return this.dirHandle;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error selecting Obsidian directory:', err);
      }
      throw err;
    }
  }

  async scanVaultFiles() {
    if (!this.dirHandle) return;
    this.knownFiles = [];
    try {
      for await (const entry of this.dirHandle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
          this.knownFiles.push(entry.name);
        }
      }
      if (this.knownFiles.length === 0) {
        this.knownFiles.push(this.activeFileName);
      }
    } catch (err) {
      console.warn('Could not scan directory files:', err);
    }
  }

  /**
   * Format selected text into Markdown with rich metadata & Moment.js timestamps
   */
  formatClipContent(text, docTitle, pageNumber, format = 'markdown') {
    const now = moment();
    const formattedDate = now.format('dddd, MMMM Do YYYY, h:mm:ss a');
    const relativeTime = now.fromNow();

    if (format === 'markdown') {
      return `\n## Clip from ${docTitle || 'Document'} (Page ${pageNumber})\n\n> ${text.trim().replace(/\n/g, '\n> ')}\n\n- **Source:** [[${docTitle || 'Document'}]]\n- **Page:** ${pageNumber}\n- **Captured:** ${formattedDate} (${relativeTime})\n- **Tags:** #pdf-clip #research\n\n---\n`;
    } else if (format === 'txt') {
      return `\n[CLIP - Page ${pageNumber} | ${docTitle || 'Document'}]\n${text.trim()}\nCaptured on: ${formattedDate}\n----------------------------------------\n`;
    } else {
      // Literal As-Is
      return `\n${text}\n`;
    }
  }

  /**
   * Append clipped text to target file
   */
  async appendClip(text, docTitle, pageNumber, format = 'markdown', targetFile = null) {
    const fileName = targetFile || this.activeFileName;
    this.setActiveFile(fileName);

    const formattedContent = this.formatClipContent(text, docTitle, pageNumber, format);

    // Save clip to internal database history
    if (window.appDB) {
      await window.appDB.saveClip({
        documentTitle: docTitle,
        pageNumber,
        text,
        formattedContent,
        targetFile: this.activeFileName,
        format
      });
    }

    // Path 1: Direct File System Access API (Windows 11)
    if (this.dirHandle) {
      try {
        const fileHandle = await this.dirHandle.getFileHandle(this.activeFileName, { create: true });
        const existingFile = await fileHandle.getFile();
        const existingText = await existingFile.text();

        const writable = await fileHandle.createWritable();
        await writable.write(existingText + formattedContent);
        await writable.close();

        return { success: true, method: 'filesystem', fileName: this.activeFileName };
      } catch (err) {
        console.warn('Filesystem write failed, falling back to Obsidian URI:', err);
      }
    }

    // Path 2: Obsidian URI Scheme (Galaxy S25 Ultra & Android App Integration)
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const encodedVault = encodeURIComponent(this.vaultName);
    const fileNameWithoutExt = this.activeFileName.replace(/\.(md|txt)$/i, '');
    const encodedFile = encodeURIComponent(fileNameWithoutExt);
    const encodedContent = encodeURIComponent(formattedContent);

    // Try Obsidian Advanced URI or Standard New URI with append
    const obsidianUri = `obsidian://new?vault=${encodedVault}&file=${encodedFile}&content=${encodedContent}&append=true`;

    if (isMobile) {
      // Trigger deep link directly on mobile
      const link = document.createElement('a');
      link.href = obsidianUri;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Always copy to clipboard as seamless backup
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(formattedContent);
      } catch (clipErr) {
        console.warn('Clipboard write error:', clipErr);
      }
    }

    return {
      success: true,
      method: isMobile ? 'obsidian_uri' : 'clipboard',
      fileName: this.activeFileName,
      uri: obsidianUri
    };
  }

  /**
   * Export all collected clips as a downloadable .md file
   */
  async exportAllClipsAsMarkdown() {
    if (!window.appDB) return;
    const clips = await window.appDB.getAllClips();
    if (clips.length === 0) return;

    let combined = `# AuraPDF Captured Notes & Research Clips\n\n*Exported on ${moment().format('LLLL')}*\n\n`;
    for (const clip of clips) {
      combined += clip.formattedContent || `> ${clip.text}\n\n`;
    }

    const blob = new Blob([combined], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.vaultName}_Clips_${moment().format('YYYY-MM-DD_HHmm')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Global Obsidian Manager instance
window.obsidianManager = new ObsidianManager();
