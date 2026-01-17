import { openDB } from 'idb';

const DB_NAME = 'MyMFCacheDB'; // Distinct name for cache
const DB_VERSION = 1;
const STORE_NAME = 'fundCache';

// 1. Initialize DB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

// 2. Get Cached Fund (Read)
export const getCachedFund = async (schemeCode) => {
  const db = await initDB();
  return db.get(STORE_NAME, schemeCode);
};

// 3. Save Fund to Cache (Write)
export const cacheFundResponse = async (schemeCode, data) => {
  const db = await initDB();
  return db.put(STORE_NAME, data, schemeCode);
};

// 4. Clear Cache (Optional: for "Wipe Data" or "Refresh All")
export const clearFundCache = async () => {
  const db = await initDB();
  return db.clear(STORE_NAME);
};