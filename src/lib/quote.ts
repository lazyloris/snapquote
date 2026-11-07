import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export interface LineItem {
  id: string;
  name: string;
  detail: string;
  qty: number;
  price: number;
  /** Optional items are add-ons the client can switch on or off. */
  optional: boolean;
  /** For optional items: whether it starts switched on. */
  selected: boolean;
}

export interface Quote {
  v: 1;
  id: string;
  createdAt: string;
  business: { name: string; email: string; color: string; tagline: string };
  client: { name: string; email: string };
  title: string;
  intro: string;
  items: LineItem[];
  taxRate: number; // percent
  depositPct: number; // percent of total
  currency: string;
  validUntil: string; // yyyy-mm-dd
  timeline: string;
  terms: string;
  payLink: string; // e.g. a Stripe Payment Link
}

export interface Acceptance {
  name: string;
  at: string; // ISO time
  selected: string[]; // ids of optional items the client picked
  total: number;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function addDays(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function blankQuote(): Quote {
  return {
    v: 1,
    id: uid(),
    createdAt: new Date().toISOString(),
    business: { name: "", email: "", color: "#4f46e5", tagline: "" },
    client: { name: "", email: "" },
    title: "",
    intro: "",
    items: [],
    taxRate: 0,
    depositPct: 50,
    currency: "USD",
    validUntil: addDays(14),
    timeline: "",
    terms: "Work starts once the deposit is paid. The balance is due on delivery. Includes one round of revisions.",
    payLink: "",
  };
}

export function lineTotal(item: LineItem): number {
  return round2(item.qty * item.price);
}

/** Totals for a quote, given which optional items are switched on. */
export function totals(q: Quote, selected?: Set<string>) {
  const on = (i: LineItem) => !i.optional || (selected ? selected.has(i.id) : i.selected);
  const subtotal = round2(q.items.filter(on).reduce((s, i) => s + lineTotal(i), 0));
  const tax = round2((subtotal * (q.taxRate || 0)) / 100);
  const total = round2(subtotal + tax);
  const deposit = round2((total * (q.depositPct || 0)) / 100);
  return { subtotal, tax, total, deposit, balance: round2(total - deposit) };
}

export function defaultSelection(q: Quote): Set<string> {
  return new Set(q.items.filter((i) => i.optional && i.selected).map((i) => i.id));
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function money(n: number, currency = "USD", cents = true): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    }).format(n);
  } catch {
    return `$${n.toFixed(cents ? 2 : 0)}`;
  }
}

export function prettyDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------- Share links ----------
// The whole quote lives in the URL fragment (#...), which browsers never send to
// the server. So a link works without any database, and nothing is stored by us.

export function encodeQuote(q: Quote): string {
  return compressToEncodedURIComponent(JSON.stringify(q));
}

export function decodeQuote(s: string): Quote | null {
  try {
    const json = decompressFromEncodedURIComponent(s);
    if (!json) return null;
    const q = JSON.parse(json);
    return isQuote(q) ? q : null;
  } catch {
    return null;
  }
}

export function encodeAcceptance(a: Acceptance): string {
  return compressToEncodedURIComponent(JSON.stringify(a));
}

export function decodeAcceptance(s: string): Acceptance | null {
  try {
    const json = decompressFromEncodedURIComponent(s);
    if (!json) return null;
    const a = JSON.parse(json);
    if (typeof a?.name !== "string" || typeof a?.at !== "string" || !Array.isArray(a?.selected)) return null;
    return a;
  } catch {
    return null;
  }
}

export function isQuote(q: unknown): q is Quote {
  const x = q as Quote;
  return !!x && x.v === 1 && typeof x.id === "string" && Array.isArray(x.items) && !!x.business && !!x.client;
}

/** Fragment format: "<quote>" or "<quote>~<acceptance>". lz-string's URI alphabet never uses "~". */
export function shareHash(q: Quote, a?: Acceptance): string {
  return encodeQuote(q) + (a ? "~" + encodeAcceptance(a) : "");
}

export function parseShareHash(hash: string): { quote: Quote | null; acceptance: Acceptance | null } {
  const raw = hash.replace(/^#/, "");
  const [qs, as] = raw.split("~");
  return { quote: qs ? decodeQuote(qs) : null, acceptance: as ? decodeAcceptance(as) : null };
}

export function shareUrl(q: Quote, a?: Acceptance): string {
  return `${window.location.origin}/q#${shareHash(q, a)}`;
}
