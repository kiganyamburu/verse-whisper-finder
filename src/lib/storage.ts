import { MatchResult } from "./matcher";

const FAVORITES_KEY = "versefinder_favorites";
const HISTORY_KEY = "versefinder_history";
const STORAGE_EVENT = "versefinder_storage_change";

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage`, e);
    return fallback;
  }
}

function safeSetItem(key: string, value: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage`, e);
  }
}

// --- Favorites ---
export function getFavorites(): MatchResult[] {
  return safeGetItem<MatchResult[]>(FAVORITES_KEY, []);
}

export function isFavorite(reference: string): boolean {
  const favorites = getFavorites();
  return favorites.some(v => v.reference === reference);
}

export function toggleFavorite(verse: MatchResult): boolean {
  const favorites = getFavorites();
  const exists = favorites.some(v => v.reference === verse.reference);
  if (exists) {
    const updated = favorites.filter(v => v.reference !== verse.reference);
    safeSetItem(FAVORITES_KEY, updated);
    return false; // now removed
  } else {
    const updated = [verse, ...favorites];
    safeSetItem(FAVORITES_KEY, updated);
    return true; // now added
  }
}

export function removeFavorite(reference: string): void {
  const favorites = getFavorites();
  const updated = favorites.filter(v => v.reference !== reference);
  safeSetItem(FAVORITES_KEY, updated);
}

// --- History ---
export function getHistory(): MatchResult[] {
  return safeGetItem<MatchResult[]>(HISTORY_KEY, []);
}

export function addToHistory(verse: MatchResult): void {
  const history = getHistory();
  // Filter out any duplicate occurrence of this verse
  const filtered = history.filter(v => v.reference !== verse.reference);
  // Keep up to 25 items
  const updated = [verse, ...filtered].slice(0, 25);
  safeSetItem(HISTORY_KEY, updated);
}

export function removeFromHistory(reference: string): void {
  const history = getHistory();
  const updated = history.filter(v => v.reference !== reference);
  safeSetItem(HISTORY_KEY, updated);
}

export function clearHistory(): void {
  safeSetItem(HISTORY_KEY, []);
}

export { STORAGE_EVENT };

