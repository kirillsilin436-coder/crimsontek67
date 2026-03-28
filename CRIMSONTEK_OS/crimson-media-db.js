/**
 * Официальная медиа-лента (только владелец пишет через admin_media.html).
 * Хранение в IndexedDB — допускает ролики больше, чем localStorage.
 */
const CRIMSON_MEDIA_DB = 'crimson_official_media_v1';
const CRIMSON_MEDIA_STORE = 'items';

function crimsonMediaOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CRIMSON_MEDIA_DB, 1);
    req.onupgradeneeded = function () {
      const db = req.result;
      if (!db.objectStoreNames.contains(CRIMSON_MEDIA_STORE)) {
        db.createObjectStore(CRIMSON_MEDIA_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

function crimsonMediaAdd(record) {
  return crimsonMediaOpen().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(CRIMSON_MEDIA_STORE, 'readwrite');
      tx.objectStore(CRIMSON_MEDIA_STORE).put(record);
      tx.oncomplete = function () { resolve(record.id); };
      tx.onerror = function () { reject(tx.error); };
    });
  });
}

function crimsonMediaList() {
  return crimsonMediaOpen().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(CRIMSON_MEDIA_STORE, 'readonly');
      const r = tx.objectStore(CRIMSON_MEDIA_STORE).getAll();
      r.onsuccess = function () {
        const arr = r.result || [];
        arr.sort(function (a, b) { return b.t - a.t; });
        resolve(arr);
      };
      r.onerror = function () { reject(r.error); };
    });
  });
}

function crimsonMediaDelete(id) {
  return crimsonMediaOpen().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(CRIMSON_MEDIA_STORE, 'readwrite');
      tx.objectStore(CRIMSON_MEDIA_STORE).delete(id);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  });
}
