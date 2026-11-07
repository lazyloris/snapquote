import { Acceptance, Quote } from "./quote";

// Everything is saved in this browser only. No account, no server.
const QUOTES = "snapquote.quotes.v1";
const PROFILE = "snapquote.profile.v1";
const ACCEPTED = "snapquote.accepted.v1"; // acceptances, keyed by quote id

export interface SavedQuote {
  quote: Quote;
  updatedAt: string;
  sentAt?: string;
  acceptance?: Acceptance;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the app still works, it just won't remember */
  }
}

export function listQuotes(): SavedQuote[] {
  const all = read<Record<string, SavedQuote>>(QUOTES, {});
  return Object.values(all).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getQuote(id: string): SavedQuote | undefined {
  return read<Record<string, SavedQuote>>(QUOTES, {})[id];
}

export function saveQuote(quote: Quote, patch: Partial<SavedQuote> = {}) {
  const all = read<Record<string, SavedQuote>>(QUOTES, {});
  all[quote.id] = { ...all[quote.id], ...patch, quote, updatedAt: new Date().toISOString() };
  write(QUOTES, all);
}

export function markQuote(id: string, patch: Partial<SavedQuote>) {
  const all = read<Record<string, SavedQuote>>(QUOTES, {});
  if (!all[id]) return false;
  all[id] = { ...all[id], ...patch };
  write(QUOTES, all);
  return true;
}

export function deleteQuote(id: string) {
  const all = read<Record<string, SavedQuote>>(QUOTES, {});
  delete all[id];
  write(QUOTES, all);
}

export type Profile = Quote["business"] & { payLink: string; taxRate: number; depositPct: number };

export function getProfile(): Profile | null {
  return read<Profile | null>(PROFILE, null);
}

export function saveProfile(p: Profile) {
  write(PROFILE, p);
}

/** The client's side: remember that this browser signed a quote. */
export function getClientAcceptance(id: string): Acceptance | null {
  return read<Record<string, Acceptance>>(ACCEPTED, {})[id] ?? null;
}

export function saveClientAcceptance(id: string, a: Acceptance) {
  const all = read<Record<string, Acceptance>>(ACCEPTED, {});
  all[id] = a;
  write(ACCEPTED, all);
}
