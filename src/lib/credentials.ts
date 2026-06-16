// Client-side storage for Roblox API credentials.
// Default: sessionStorage. Optional 6h persistence: localStorage.
// NEVER stored on server. NEVER logged. NEVER exposed publicly.

import type { RobloxCredentials } from "./validations";

const STORAGE_KEY = "roaudio:credentials";
const SESSION_KEY = "roaudio:session-credentials";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export interface StoredCredentials {
  creatorId: string;
  apiKey: string;
  expiresAt: number;
}

export function getCredentials(): StoredCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    // Prefer sessionStorage for current-session credentials
    const session = window.sessionStorage.getItem(SESSION_KEY);
    if (session) {
      const parsed = JSON.parse(session) as StoredCredentials;
      if (parsed.expiresAt > Date.now()) return parsed;
      window.sessionStorage.removeItem(SESSION_KEY);
    }

    // Fall back to localStorage (only if user opted in to remember)
    const persisted = window.localStorage.getItem(STORAGE_KEY);
    if (persisted) {
      const parsed = JSON.parse(persisted) as StoredCredentials;
      if (parsed.expiresAt > Date.now()) return parsed;
      window.localStorage.removeItem(STORAGE_KEY); // auto-cleanup expired
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function saveCredentials(
  creds: RobloxCredentials,
  remember: boolean,
): void {
  if (typeof window === "undefined") return;
  const payload: StoredCredentials = {
    creatorId: creds.creatorId,
    apiKey: creds.apiKey,
    expiresAt: remember
      ? Date.now() + SIX_HOURS_MS
      : Number.MAX_SAFE_INTEGER, // session-scoped
  };

  try {
    if (remember) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.sessionStorage.removeItem(SESSION_KEY);
    } else {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage may be full or disabled — fail silently
  }
}

export function clearCredentials(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasRememberedCredentials(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// Auto-cleanup on load
if (typeof window !== "undefined") {
  try {
    const persisted = window.localStorage.getItem(STORAGE_KEY);
    if (persisted) {
      const parsed = JSON.parse(persisted) as StoredCredentials;
      if (parsed.expiresAt <= Date.now()) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    // ignore
  }
}
