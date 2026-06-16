// IndexedDB video database store to survive page reloads for sandbox mock uploads
export function saveVideoToDb(key: string, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VideoStore", 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("videos")) {
        db.createObjectStore("videos");
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction("videos", "readwrite");
      const store = tx.objectStore("videos");
      store.put(file, key);
      tx.oncomplete = () => resolve();
      tx.onerror = (err: any) => reject(err);
    };
    request.onerror = (err) => reject(err);
  });
}

export function getVideoFromDb(key: string): Promise<File | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VideoStore", 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("videos")) {
        db.createObjectStore("videos");
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction("videos", "readonly");
      const store = tx.objectStore("videos");
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = (err: any) => reject(err);
    };
    request.onerror = (err) => reject(err);
  });
}

export function deleteVideoFromDb(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VideoStore", 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("videos")) {
        db.createObjectStore("videos");
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction("videos", "readwrite");
      const store = tx.objectStore("videos");
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = (err: any) => reject(err);
    };
    request.onerror = (err) => reject(err);
  });
}
