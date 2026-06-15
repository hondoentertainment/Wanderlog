import '@testing-library/jest-dom';

// Simple mock for IndexedDB
const mockIndexedDB = {
    open: (dbName: string, version: number) => {
        return {
            onupgradeneeded: null,
            onsuccess: null,
            onerror: null,
            result: {
                objectStoreNames: { contains: () => true },
                createObjectStore: () => ({ createIndex: () => { } }),
                transaction: () => ({
                    objectStore: () => ({
                        add: () => ({ onsuccess: null, onerror: null }),
                        getAll: () => ({ onsuccess: null, onerror: null, result: [] }),
                        delete: () => ({ onsuccess: null, onerror: null }),
                    })
                })
            }
        };
    }
};

Object.defineProperty(window, 'indexedDB', {
    value: mockIndexedDB
});
