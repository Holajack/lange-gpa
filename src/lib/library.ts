"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LangCode, PhaseId } from "./types";

/**
 * THE LISTENING LIBRARY — the connective tissue of GPA Phases 2–6.
 *
 * Every phase after the first runs on the same loop: record real speech,
 * negotiate what you missed, then listen again (and again) at home. This is
 * the one store all of that lands in.
 *
 * DEVICE-ONLY BY DESIGN: audio lives in this browser's IndexedDB and is never
 * uploaded. That is the consent promise the session room already makes
 * ("recordings stay on this device"), and it is what lets a mentor's life
 * story be captured at all. Erasing is instant and total.
 *
 * Namespaced per signed-in account so two people sharing a device never see
 * each other's recordings.
 */

export type RecordingKind =
  | "primary" // the first, raw telling (a story, a description, a discourse)
  | "retell" // the grower telling it back
  | "expansion" // a follow-up answer that grew out of a primary recording
  | "improved" // a helper's better version of something the grower said
  | "word" // a single word / word–sentence–word recording
  | "description" // the grower describing a picture or a scene
  | "journal" // a spoken journal entry
  | "feedback" // the grower recording themselves to be corrected
  | "imported"; // audio brought in from outside (native-to-native, media)

export type Speaker = "me" | "nurturer" | "native" | "both";

/** A moment on a recording the grower flagged, noted, or pulled a word from. */
export interface Mark {
  id: string;
  /** seconds from the start of the recording */
  t: number;
  kind: "unclear" | "word" | "note";
  note?: string;
  /** phase-specific gap taxonomy id (e.g. Phase 4's six gap types) */
  gap?: string;
  /** the moment has been negotiated and is now understood */
  resolved?: boolean;
}

export interface LibraryItem {
  id: string;
  lang: LangCode;
  phase: PhaseId;
  /** curriculum activity this belongs to, e.g. "p3-bridge" */
  activityId: string;
  kind: RecordingKind;
  title: string;
  note?: string;
  /** threads takes together: a retell/expansion/improved version points at its source */
  parentId?: string;
  speaker?: Speaker;
  mime: string;
  durationSec: number;
  createdAt: string;
  /** ISO timestamps of each completed re-listen */
  relistens: string[];
  /** "I know this one cold" — drops it from the shrinking review copy, never deletes it */
  familiar?: boolean;
  marks: Mark[];
  /** someone else's personal story — shows the confidentiality promise + erase control */
  confidential?: boolean;
  tags?: string[];
}

export interface PictureItem {
  id: string;
  activityId: string;
  title: string;
  createdAt: string;
  mime: string;
}

export type NewRecording = Omit<LibraryItem, "id" | "createdAt" | "relistens" | "marks"> &
  Partial<Pick<LibraryItem, "marks">>;

/* ------------------------------ storage ------------------------------ */

const OWNER_KEY = "lange.profile.owner.v1";
const DB_VERSION = 1;
const META = "meta";
const BLOBS = "blobs";
const PICS = "pictures";

function ownerId(): string {
  try {
    return localStorage.getItem(OWNER_KEY) || "local";
  } catch {
    return "local";
  }
}

const dbName = () => `nuri-library-${ownerId()}`;

/** in-memory fallback for private windows / blocked site data */
const mem = {
  meta: new Map<string, LibraryItem>(),
  blobs: new Map<string, Blob>(),
  pics: new Map<string, PictureItem>(),
};
let idbBroken = false;

function openDb(): Promise<IDBDatabase | null> {
  if (idbBroken || typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(dbName(), DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "id" });
        if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
        if (!db.objectStoreNames.contains(PICS)) db.createObjectStore(PICS, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        idbBroken = true;
        resolve(null);
      };
      req.onblocked = () => resolve(null);
    } catch {
      idbBroken = true;
      resolve(null);
    }
  });
}

function reqP<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* ---------------------------- change events --------------------------- */

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((fn) => fn());
}
export function subscribeLibrary(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/* ------------------------------ recordings ---------------------------- */

export async function saveRecording(input: NewRecording, blob: Blob): Promise<LibraryItem> {
  const item: LibraryItem = {
    ...input,
    id: uid("rec"),
    createdAt: new Date().toISOString(),
    relistens: [],
    marks: input.marks ?? [],
    durationSec: Math.max(0, Math.round(input.durationSec)),
  };
  const db = await openDb();
  if (!db) {
    mem.meta.set(item.id, item);
    mem.blobs.set(item.id, blob);
  } else {
    const tx = db.transaction([META, BLOBS], "readwrite");
    tx.objectStore(META).put(item);
    tx.objectStore(BLOBS).put(blob, item.id);
    await txDone(tx);
    db.close();
  }
  emit();
  return item;
}

export async function listRecordings(): Promise<LibraryItem[]> {
  const db = await openDb();
  let all: LibraryItem[];
  if (!db) all = [...mem.meta.values()];
  else {
    all = await reqP(db.transaction(META).objectStore(META).getAll() as IDBRequest<LibraryItem[]>);
    db.close();
  }
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRecordingBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return mem.blobs.get(id) ?? null;
  const blob = await reqP(db.transaction(BLOBS).objectStore(BLOBS).get(id) as IDBRequest<Blob | undefined>);
  db.close();
  return blob ?? null;
}

export async function updateRecording(
  id: string,
  patch: Partial<Omit<LibraryItem, "id">> | ((prev: LibraryItem) => Partial<Omit<LibraryItem, "id">>)
): Promise<LibraryItem | null> {
  const db = await openDb();
  if (!db) {
    const prev = mem.meta.get(id);
    if (!prev) return null;
    const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
    mem.meta.set(id, next);
    emit();
    return next;
  }
  const tx = db.transaction(META, "readwrite");
  const store = tx.objectStore(META);
  const prev = await reqP(store.get(id) as IDBRequest<LibraryItem | undefined>);
  if (!prev) {
    db.close();
    return null;
  }
  const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
  store.put(next);
  await txDone(tx);
  db.close();
  emit();
  return next;
}

/** Delete one recording AND every take threaded under it. Instant, irreversible. */
export async function deleteRecording(id: string): Promise<void> {
  const all = await listRecordings();
  const doomed = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const it of all) {
      if (it.parentId && doomed.has(it.parentId) && !doomed.has(it.id)) {
        doomed.add(it.id);
        grew = true;
      }
    }
  }
  const db = await openDb();
  if (!db) {
    doomed.forEach((d) => {
      mem.meta.delete(d);
      mem.blobs.delete(d);
    });
  } else {
    const tx = db.transaction([META, BLOBS], "readwrite");
    doomed.forEach((d) => {
      tx.objectStore(META).delete(d);
      tx.objectStore(BLOBS).delete(d);
    });
    await txDone(tx);
    db.close();
  }
  emit();
}

export function logRelisten(id: string): Promise<LibraryItem | null> {
  return updateRecording(id, (prev) => ({ relistens: [...prev.relistens, new Date().toISOString()] }));
}

/** Wipe every recording and picture on this device for this account. */
export async function eraseLibrary(): Promise<void> {
  mem.meta.clear();
  mem.blobs.clear();
  mem.pics.clear();
  if (typeof indexedDB !== "undefined" && !idbBroken) {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(dbName());
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  }
  emit();
}

/* ------------------------------- pictures ------------------------------ */
/* Growers bring their own pictures (a page of a wordless book they own, a
   family photo, a snapshot of the street) — the guide's own materials model,
   and the reason nothing copyrighted ever has to ship inside the app. */

export async function savePicture(
  input: Pick<PictureItem, "activityId" | "title">,
  blob: Blob
): Promise<PictureItem> {
  const pic: PictureItem = {
    ...input,
    id: uid("pic"),
    createdAt: new Date().toISOString(),
    mime: blob.type || "image/jpeg",
  };
  const db = await openDb();
  if (!db) {
    mem.pics.set(pic.id, pic);
    mem.blobs.set(pic.id, blob);
  } else {
    const tx = db.transaction([PICS, BLOBS], "readwrite");
    tx.objectStore(PICS).put(pic);
    tx.objectStore(BLOBS).put(blob, pic.id);
    await txDone(tx);
    db.close();
  }
  emit();
  return pic;
}

export async function listPictures(activityId?: string): Promise<PictureItem[]> {
  const db = await openDb();
  let all: PictureItem[];
  if (!db) all = [...mem.pics.values()];
  else {
    all = await reqP(db.transaction(PICS).objectStore(PICS).getAll() as IDBRequest<PictureItem[]>);
    db.close();
  }
  return all
    .filter((p) => !activityId || p.activityId === activityId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function deletePicture(id: string): Promise<void> {
  const db = await openDb();
  if (!db) {
    mem.pics.delete(id);
    mem.blobs.delete(id);
  } else {
    const tx = db.transaction([PICS, BLOBS], "readwrite");
    tx.objectStore(PICS).delete(id);
    tx.objectStore(BLOBS).delete(id);
    await txDone(tx);
    db.close();
  }
  emit();
}

/* -------------------------------- hooks -------------------------------- */

export interface LibraryFilter {
  lang?: LangCode;
  phase?: PhaseId;
  activityId?: string | string[];
  kind?: RecordingKind | RecordingKind[];
  parentId?: string;
  /** only recordings carrying this tag (e.g. one storyteller, one discourse track) */
  tag?: string;
}

function matches(item: LibraryItem, f: LibraryFilter): boolean {
  if (f.lang && item.lang !== f.lang) return false;
  if (f.phase && item.phase !== f.phase) return false;
  if (f.parentId && item.parentId !== f.parentId) return false;
  if (f.tag && !(item.tags ?? []).includes(f.tag)) return false;
  if (f.activityId) {
    const ids = Array.isArray(f.activityId) ? f.activityId : [f.activityId];
    if (!ids.includes(item.activityId)) return false;
  }
  if (f.kind) {
    const kinds = Array.isArray(f.kind) ? f.kind : [f.kind];
    if (!kinds.includes(item.kind)) return false;
  }
  return true;
}

/** Live view of the library. Re-reads whenever anything is saved, changed, or erased. */
export function useLibrary(filter: LibraryFilter = {}) {
  const [all, setAll] = useState<LibraryItem[]>([]);
  const [ready, setReady] = useState(false);
  const key = JSON.stringify(filter);

  useEffect(() => {
    let alive = true;
    const load = () =>
      listRecordings()
        .then((items) => {
          if (alive) {
            setAll(items);
            setReady(true);
          }
        })
        .catch(() => alive && setReady(true));
    load();
    const off = subscribeLibrary(load);
    return () => {
      alive = false;
      off();
    };
  }, []);

  const items = useMemo(
    () => all.filter((it) => matches(it, JSON.parse(key) as LibraryFilter)),
    [all, key]
  );

  return {
    items,
    /** every recording on this device, unfiltered */
    all,
    ready,
    save: saveRecording,
    update: updateRecording,
    remove: deleteRecording,
    logRelisten,
  };
}

/** Object URL for a recording's (or picture's) blob; revoked on unmount / id change. */
export function useBlobUrl(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const current = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    const release = () => {
      if (current.current) URL.revokeObjectURL(current.current);
      current.current = null;
    };
    release();
    setUrl(null);
    if (!id) return;
    getRecordingBlob(id).then((blob) => {
      if (!alive || !blob) return;
      current.current = URL.createObjectURL(blob);
      setUrl(current.current);
    });
    return () => {
      alive = false;
      release();
    };
  }, [id]);

  return url;
}

export function usePictures(activityId?: string) {
  const [pictures, setPictures] = useState<PictureItem[]>([]);
  const load = useCallback(() => {
    listPictures(activityId).then(setPictures).catch(() => {});
  }, [activityId]);
  useEffect(() => {
    load();
    return subscribeLibrary(load);
  }, [load]);
  return { pictures, add: savePicture, remove: deletePicture };
}

/* ------------------------------- helpers ------------------------------- */

export function fmtDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** total listening time banked in the library, in minutes */
export function libraryMinutes(items: LibraryItem[]): number {
  return Math.round(items.reduce((sum, it) => sum + it.durationSec, 0) / 60);
}

/**
 * Tonight's queue — what to re-listen to next. Unfamiliar recordings first,
 * least-recently-heard first: fresh material needs the most encounters, and
 * older material resurfaces before it fades.
 */
export function tonightsQueue(items: LibraryItem[], count = 3): LibraryItem[] {
  const last = (it: LibraryItem) => it.relistens[it.relistens.length - 1] ?? "";
  return items
    .filter((it) => !it.familiar && it.kind !== "word")
    .sort((a, b) => {
      const byHeard = last(a).localeCompare(last(b));
      return byHeard !== 0 ? byHeard : b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, count);
}
