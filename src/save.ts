// Penyimpanan lokal berbasis IndexedDB (sesuai GDD bagian 23).
const DB = 'life-from-zero'
const STORE = 'kv'
const KEY = 'save'

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  try {
    const db = await open()
    return await new Promise<T>((res, rej) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
  } catch {
    return null
  }
}

export const loadSave = <T,>() => run<T>('readonly', (s) => s.get(KEY) as IDBRequest<T>)
export const writeSave = (v: unknown) => run('readwrite', (s) => s.put(v, KEY))
export const clearSave = () => run('readwrite', (s) => s.delete(KEY))
