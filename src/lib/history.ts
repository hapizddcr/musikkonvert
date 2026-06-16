// Local upload history — browser-only, stored in localStorage.
// No database, no server. User can clear anytime.

import { generateId } from "./utils";

const HISTORY_KEY = "roaudio:history";
const MAX_HISTORY = 50;

export interface HistoryEntry {
  id: string;
  fileName: string;
  assetId: string;
  assetUrl: string;
  date: string; // ISO
  sizeBytes?: number;
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "date">): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: generateId(),
    date: new Date().toISOString(),
  };
  const list = getHistory();
  list.unshift(full);
  if (list.length > MAX_HISTORY) {
    list.length = MAX_HISTORY;
  }
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  return full;
}

export function removeHistoryEntry(id: string): void {
  const list = getHistory().filter((e) => e.id !== id);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
