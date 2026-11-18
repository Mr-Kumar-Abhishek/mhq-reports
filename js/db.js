/**
 * @fileoverview Offline-first IndexedDB persistence layer for MHQ reports with transparent
 * localStorage and in-memory Map fallbacks for restricted browser or Node test environments.
 * @license MIT
 */

const DB_NAME = 'mhq_reports_db';
const DB_VERSION = 1;
const STORE_NAME = 'reports';
const LOCAL_STORAGE_KEY = 'mhq_reports_fallback_v1';

export class MHQStorage {
  constructor() {
    this.dbPromise = null;
    this.memoryStore = new Map();
    this.mode = 'pending';
  }

  /**
   * Returns active storage backend mode: 'indexeddb' | 'localstorage' | 'memory'.
   * @returns {string}
   */
  getStorageMode() {
    return this.mode;
  }

  _getLocalStorage() {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return window.localStorage || null;
    } catch {
      return null;
    }
  }

  _resolveFallbackMode() {
    this.mode = this._getLocalStorage() ? 'localstorage' : 'memory';
    return null;
  }

  /**
   * Lazily initializes IndexedDB or resolves the best available fallback.
   * @returns {Promise<IDBDatabase|null>}
   */
  async _getDB() {
    if (typeof indexedDB === 'undefined') {
      return this._resolveFallbackMode();
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.mode = 'indexeddb';
          resolve(event.target.result);
        };

        request.onerror = () => resolve(this._resolveFallbackMode());
      } catch {
        resolve(this._resolveFallbackMode());
      }
    });

    return this.dbPromise;
  }

  _readFallbackRecords() {
    const ls = this.mode === 'localstorage' ? this._getLocalStorage() : null;
    if (ls) {
      try {
        const raw = ls.getItem(LOCAL_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return Array.from(this.memoryStore.values());
      }
    }
    return Array.from(this.memoryStore.values());
  }

  _writeFallbackRecords(records) {
    this.memoryStore.clear();
    for (const r of records) {
      this.memoryStore.set(r.id, r);
    }
    const ls = this.mode === 'localstorage' ? this._getLocalStorage() : null;
    if (ls) {
      try {
        ls.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
      } catch {
        // Storage quota exceeded; memoryStore retains records for current session.
      }
    }
  }

  /**
   * Saves or updates an MHQ report record locally.
   * @param {object} report
   * @returns {Promise<object>}
   */
  async saveReport(report) {
    if (!report || !report.id) {
      throw new Error('Cannot save report without a valid id.');
    }
    const db = await this._getDB();
    if (!db) {
      const existing = this._readFallbackRecords().filter((r) => r.id !== report.id);
      existing.push(report);
      this._writeFallbackRecords(existing);
      return report;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(report);
      req.onsuccess = () => resolve(report);
      req.onerror = () => reject(req.error || new Error('IndexedDB saveReport failed.'));
    });
  }

  /**
   * Retrieves all saved reports sorted newest-first by createdAt.
   * @returns {Promise<Array<object>>}
   */
  async getAllReports() {
    const db = await this._getDB();
    let records;

    if (!db) {
      records = this._readFallbackRecords();
    } else {
      records = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error || new Error('IndexedDB getAllReports failed.'));
      });
    }

    return [...records].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );
  }

  /**
   * Retrieves a single report by id.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async getReportById(id) {
    const db = await this._getDB();
    if (!db) {
      return this._readFallbackRecords().find((r) => r.id === id) || null;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('IndexedDB getReportById failed.'));
    });
  }

  /**
   * Deletes a single report by id.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteReport(id) {
    const db = await this._getDB();
    if (!db) {
      const next = this._readFallbackRecords().filter((r) => r.id !== id);
      this._writeFallbackRecords(next);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('IndexedDB deleteReport failed.'));
    });
  }

  /**
   * Removes all locally persisted MHQ reports.
   * @returns {Promise<void>}
   */
  async clearAllReports() {
    const db = await this._getDB();
    if (!db) {
      this._writeFallbackRecords([]);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('IndexedDB clearAllReports failed.'));
    });
  }
}

export const mhqStorage = new MHQStorage();
