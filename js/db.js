/**
 * db.js
 * Handles IndexedDB operations for Auto-Save and Local Document Library.
 */

const DB_NAME = 'SmartTextFormatterDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

class LocalDB {
    constructor() {
        this.db = null;
        this.initPromise = this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // Create object store with auto-incrementing ID
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    // Index by updated timestamp for sorting
                    store.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("IndexedDB initialization error:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    async saveDocument(doc) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // Ensure timestamp is updated
            doc.updatedAt = Date.now();
            
            const request = store.put(doc);
            
            request.onsuccess = () => resolve(request.result); // Returns the ID
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async getDocument(id) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async getAllDocuments() {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('updatedAt');
            
            // Get all records, sorted by updatedAt (using a cursor to reverse it so newest is first)
            const request = index.openCursor(null, 'prev');
            const results = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    // Only return metadata for the list, not the full heavy content
                    const { id, title, updatedAt, rawText } = cursor.value;
                    let snippet = rawText ? rawText.substring(0, 60).replace(/\n/g, ' ') : "Empty document...";
                    if (rawText && rawText.length > 60) snippet += "...";
                    
                    results.push({ id, title, updatedAt, snippet });
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async deleteDocument(id) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async clearAllDocuments() {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }
}

// Global instance
window.appDB = new LocalDB();
