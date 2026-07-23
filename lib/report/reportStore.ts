/* Browser-local store for generated test reports.

   Reports are kept ONLY in the user's browser (IndexedDB) — nothing is
   written to the database or R2. Records are keyed by the route testId, so
   re-taking a test overwrites the previous report and only the most recent
   one is ever kept. */

import type { StoredReport } from "./types";

const DB_NAME = "gpedge_reports";
const STORE = "reports";
const DB_VERSION = 1;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

/* Ask the browser to mark this origin's storage as persistent so it is NOT
   auto-evicted under disk pressure or time-based clearing. Only the user
   explicitly clearing site data can remove it after this. Best-effort: the
   browser may decline, and it only protects the current browser/device.
   Safe to call repeatedly — we skip the request once already granted. */
export async function ensurePersistentStorage(): Promise<boolean> {
  try {
    if (!isBrowser() || !navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "testId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Persist (or overwrite) the report for a test. Keeps only the most recent. */
export async function saveReport(record: StoredReport): Promise<void> {
  if (!isBrowser()) return;
  // Request durable storage so the browser won't silently evict saved reports.
  void ensurePersistentStorage();
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Read one stored report, or null when none exists for the test. */
export async function getReport(testId: string): Promise<StoredReport | null> {
  if (!isBrowser()) return null;
  const db = await openDb();
  try {
    return await new Promise<StoredReport | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(testId);
      req.onsuccess = () => resolve((req.result as StoredReport) ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** The set of testIds that currently have a stored report. */
export async function getReportIds(): Promise<Set<string>> {
  if (!isBrowser()) return new Set();
  const db = await openDb();
  try {
    return await new Promise<Set<string>>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAllKeys();
      req.onsuccess = () => resolve(new Set((req.result as string[]) ?? []));
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** Whether a report exists for the given test. */
export async function hasReport(testId: string): Promise<boolean> {
  const ids = await getReportIds();
  return ids.has(testId);
}

/** Open the stored report in a new browser tab for viewing. */
export async function viewReport(testId: string): Promise<boolean> {
  const record = await getReport(testId);
  if (!record) return false;
  const url = URL.createObjectURL(record.blob);
  const win = window.open(url, "_blank");
  // Revoke once the new tab has had time to load; keep a fallback timer even
  // if the popup was blocked so we don't leak the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return win != null;
}
