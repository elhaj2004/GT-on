/**
 * Stockage local de secours basé sur IndexedDB.
 *
 * Utilisé quand Firebase n'est pas configuré : l'application reste
 * pleinement fonctionnelle sur l'appareil (les images sont conservées
 * en data URL). L'API imite celle de services/db.js.
 */
const DB_NAME = 'virtual-closet';
const DB_VERSION = 1;
const STORES = ['items', 'outfits', 'kv'];

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: name === 'kv' ? 'key' : 'id' });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function tx(storeName, mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = fn(store);
        transaction.oncomplete = () => resolve(request?.result);
        transaction.onerror = () => reject(transaction.error);
      })
  );
}

export const localStore = {
  getAll: (storeName) => tx(storeName, 'readonly', (s) => s.getAll()),
  get: (storeName, id) => tx(storeName, 'readonly', (s) => s.get(id)),
  put: (storeName, value) => tx(storeName, 'readwrite', (s) => s.put(value)),
  delete: (storeName, id) => tx(storeName, 'readwrite', (s) => s.delete(id)),
  getKv: async (key) => (await tx('kv', 'readonly', (s) => s.get(key)))?.value,
  setKv: (key, value) => tx('kv', 'readwrite', (s) => s.put({ key, value })),
};
