import { openDB, type IDBPDatabase } from "idb";

export interface SyncRecord {
  id: string;
  url: string;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  payload: Record<string, unknown>;
  queued_at: string;
  retries: number;
  status: "pending" | "in_flight" | "dead_letter";
}

const DB_NAME = "constructiq-offline";
const DB_VERSION = 1;
const STORE_NAME = "sync-queue";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("by-status", "status");
          store.createIndex("by-queued", "queued_at");
        }
      },
      blocked() {
        console.warn("[IDB] Database blocked — close other tabs");
      },
      blocking() {
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

export async function enqueueItem(
  url: string,
  method: SyncRecord["method"],
  payload: Record<string, unknown>,
): Promise<SyncRecord> {
  const record: SyncRecord = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `temp-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    url,
    method,
    payload,
    queued_at: new Date().toISOString(),
    retries: 0,
    status: "pending",
  };
  const db = await getDB();
  await db.put(STORE_NAME, record);
  return record;
}

export async function getPendingItems(): Promise<SyncRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex(STORE_NAME, "by-status", "pending");
  return all.sort((a, b) => a.queued_at.localeCompare(b.queued_at));
}

export async function getDeadLetterItems(): Promise<SyncRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, "by-status", "dead_letter");
}

export async function countPending(): Promise<number> {
  const db = await getDB();
  return db.countFromIndex(STORE_NAME, "by-status", "pending");
}

export async function markInFlight(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get(STORE_NAME, id);
  if (record) {
    record.status = "in_flight";
    await db.put(STORE_NAME, record);
  }
}

export async function incrementRetry(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get(STORE_NAME, id);
  if (record) {
    record.retries += 1;
    record.status = "pending";
    await db.put(STORE_NAME, record);
  }
}

export async function deadLetter(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get(STORE_NAME, id);
  if (record) {
    record.status = "dead_letter";
    await db.put(STORE_NAME, record);
  }
}

export async function removeItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function getQueueStats(): Promise<{
  pending: number;
  inFlight: number;
  deadLetter: number;
}> {
  const db = await getDB();
  const [pending, inFlight, deadLetter] = await Promise.all([
    db.countFromIndex(STORE_NAME, "by-status", "pending"),
    db.countFromIndex(STORE_NAME, "by-status", "in_flight"),
    db.countFromIndex(STORE_NAME, "by-status", "dead_letter"),
  ]);
  return { pending, inFlight, deadLetter };
}
