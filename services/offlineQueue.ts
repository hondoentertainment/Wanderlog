import { StorageData } from '../types';
import { saveToCloud } from './storageService';

const DB_NAME = 'wanderlog_offline_db';
const STORE_NAME = 'sync_queue';
const DB_VERSION = 1;

export interface QueuedOperation {
    id: string;
    userId: string;
    data: StorageData;
    timestamp: number;
}

class OfflineQueueService {
    private db: IDBDatabase | null = null;
    private isProcessing = false;

    constructor() {
        this.initDB();
    }

    private initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            // IndexedDB might not be available in environments like SSR, though this is a standard React SPA
            if (typeof window === 'undefined' || !window.indexedDB) {
                resolve();
                return;
            }

            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('OfflineQueue Error: Could not open IndexedDB', event);
                reject('Could not open IndexedDB');
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // 'timestamp' as fallback index, but 'id' is key path
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    public async enqueue(userId: string, data: StorageData): Promise<void> {
        if (!this.db) await this.initDB();
        if (!this.db) return; // If perfectly failed to init

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const operation: QueuedOperation = {
                id: crypto.randomUUID(),
                userId,
                data,
                timestamp: Date.now()
            };

            const request = store.add(operation);

            request.onsuccess = () => {
                console.log(`[OfflineQueue] Enqueued sync operation for ${userId}`);
                resolve();
            };

            request.onerror = (e) => {
                console.error('[OfflineQueue] Failed to enqueue', e);
                reject('Failed to enqueue');
            };
        });
    }

    public async processQueue(): Promise<void> {
        if (this.isProcessing || !navigator.onLine) return;
        if (!this.db) await this.initDB();
        if (!this.db) return;

        this.isProcessing = true;

        try {
            const operations = await this.getAllOperations();
            if (operations.length === 0) {
                this.isProcessing = false;
                return;
            }

            console.log(`[OfflineQueue] Processing ${operations.length} queued operations...`);

            // We process sequentially to avoid overwhelming rate limits
            for (const op of operations) {
                if (!navigator.onLine) {
                    console.warn('[OfflineQueue] Lost connection while processing. Pausing.');
                    break;
                }

                try {
                    await saveToCloud(op.userId, op.data, true); // true = bypass offline queue inside saveToCloud
                    await this.removeOperation(op.id);
                    console.log(`[OfflineQueue] Successfully synced operation ${op.id}`);
                } catch (err) {
                    console.error(`[OfflineQueue] Failed to sync operation ${op.id}. Keeping in queue`, err);
                }
            }
        } finally {
            this.isProcessing = false;
        }
    }

    private getAllOperations(): Promise<QueuedOperation[]> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by oldest first
                const operations = (request.result as QueuedOperation[]).sort((a, b) => a.timestamp - b.timestamp);
                resolve(operations);
            };

            request.onerror = () => {
                reject('Failed to get operations');
            };
        });
    }

    private removeOperation(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject('Failed to remove operation');
        });
    }
}

export const offlineQueue = new OfflineQueueService();
