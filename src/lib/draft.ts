import { LineItem, uid } from "./quote";

/**
 * "Smart draft": turns a rough job description into line items, with no AI call
 * and no cost. It spots the kind of job, pulls out counts ("5 pages", "3 rooms"),
 * prices them from a starter rate card, and suggests add-ons the client can pick.
 * Every price is a starting point the user edits, not market research.
 */

interface Rule {
  match: RegExp;
  name: string;
  detail: string;
  price: number;
  /** Regex whose first capture group is the quantity, e.g. /(\d+)\s*pages?/ */
  qty?: RegExp;
  optional?: boolean;
}

interface Trade {
  key: string;
  label: string;
  detect: RegExp;
  rules: Rule[];
  addons: Omit<Rule, "match">[];
  fallback: Omit<Rule, "match">;
}

const n = String.raw`(\d+(?:\.\d+)?)`;
const num = (word: string) => new RegExp(`${n}\\s*(?:x\\s*)?${word}`, "i");

export const TRADES: Trade[] = [
  {
    key: "web",
    label: "Website",
    detect: /\b(web ?site|homepage|landing page|web ?design|wordpress|shopify|webflow|pages?|seo|redesign)\b/i,
    rules: [
      { match: /redesign|redo|refresh|revamp/i, name: "Design direction", detail: "Moodboard, layout and style options based on your brand", price: 450 },
      { match: /home ?page|landing/i, name: "Homepage design and build", detail: "Custom, mobile-first homepage", price: 600 },
      { match: /pages?/i, name: "Inner pages", detail: "Designed and built to match the homepage", price: 250, qty: num("(?:inner |extra |more |additional )?pages?") },
      { match: /contact|form|booking|quote request/i, name: "Contact form", detail: "Spam-protected form that emails you each lead", price: 150 },
      { match: /online (shop|store)|e-?commerce|sells? (products )?online|checkout|shopify/i, name: "Online store setup", detail: "Product pages, cart and Stripe checkout", price: 900 },
      { match: /blog/i, name: "Blog setup", detail: "Blog layout plus an easy editor", price: 300 },
      { match: /seo|google|search/i, name: "SEO foundations", detail: "Titles, descriptions, sitemap and Google Search Console", price: 350 },
      { match: /logo|brand/i, name: "Logo refresh", detail: "Clean vector logo in all the sizes you need", price: 400 },
      { match: /migrat|move|transfer/i, name: "Content migration", detail: "Move existing text and images to the new site", price: 300 },
    ],
    addons: [
      { name: "Hosting and care plan (first year)", detail: "Hosting, updates, backups and small edits", price: 588, optional: true },
      { name: "Copywriting", detail: "Professional copy for every page", price: 400, optional: true },
      { name: "Google Business Profile setup", detail: "Verified listing with photos and hours", price: 150, optional: true },
      { name: "Rush delivery", detail: "Jump the queue and launch in half the time", price: 500, optional: true },
    ],
    fallback: { name: "Website design and build", detail: "Custom, mobile-first website", price: 1500 },
  },
  {
    key: "photo",
    label: "Photography",
    detect: /\b(photo|photos|photography|shoot|headshots?|portraits?|wedding|engagement|photographer)\b/i,
    rules: [
      { match: /wedding/i, name: "Wedding coverage", detail: "Ceremony, portraits and reception", price: 350, qty: num("(?:hours?|hrs?)") },
      { match: /headshot/i, name: "Headshot session", detail: "Per person, 2 retouched favorites each", price: 125, qty: num("(?:people|persons?|headshots?|staff|team members?)") },
      { match: /portrait|family|engagement|session|shoot/i, name: "Photo session", detail: "Up to 1 hour on location", price: 300 },
      { match: /product/i, name: "Product photography", detail: "Clean white-background shots, per product", price: 40, qty: num("products?") },
      { match: /edit|retouch/i, name: "Retouching", detail: "Skin, color and blemish edits, per image", price: 15, qty: num("(?:images?|photos?)") },
    ],
    addons: [
      { name: "Second shooter", detail: "A second angle on every key moment", price: 400, optional: true },
      { name: "Printed album", detail: "20-page lay-flat album", price: 450, optional: true },
      { name: "48-hour sneak peek", detail: "Ten edited favorites within two days", price: 75, optional: true },
    ],
    fallback: { name: "Photography session", detail: "Shoot, edit and online gallery", price: 400 },
  },
  {
    key: "clean",
    label: "Cleaning",
    detect: /\b(clean|cleaning|maid|janitorial|move[- ]out|deep clean|carpets?)\b/i,
    rules: [
      { match: /deep/i, name: "Deep clean", detail: "Baseboards, inside appliances, detail work", price: 280 },
      { match: /move[- ]?(out|in)/i, name: "Move-out clean", detail: "Empty-home clean to get the deposit back", price: 320 },
      { match: /rooms?|bed|bath/i, name: "Room cleaning", detail: "Per room, dust, vacuum and mop", price: 35, qty: num("(?:rooms?|bedrooms?|beds?)") },
      { match: /carpet/i, name: "Carpet shampoo", detail: "Per room", price: 60, qty: num("carpets?") },
      { match: /window/i, name: "Window cleaning", detail: "Inside and out, per window", price: 8, qty: num("windows?") },
    ],
    addons: [
      { name: "Inside the fridge and oven", detail: "", price: 60, optional: true },
      { name: "Eco-friendly products", detail: "Plant-based, scent-free supplies", price: 25, optional: true },
      { name: "Biweekly plan (per visit)", detail: "Lock in this rate for regular visits", price: 140, optional: true },
    ],
    fallback: { name: "Standard home clean", detail: "Kitchen, bathrooms, dusting and floors", price: 180 },
  },
  {
    key: "yard",
    label: "Landscaping",
    detect: /\b(lawn|yard|landscap\w*|garden|mow\w*|trees?|sprinklers?|irrigation|gravel|pavers?|turf)\b/i,
    rules: [
      { match: /mow/i, name: "Mowing and edging", detail: "Per visit", price: 55, qty: num("(?:visits?|weeks?|times?)") },
      { match: /trees?|trim|prun/i, name: "Tree trimming", detail: "Per tree, haul-away included", price: 150, qty: num("trees?") },
      { match: /sprinkler|irrigation|drip/i, name: "Irrigation repair", detail: "Find leaks, replace heads, set timer", price: 220 },
      { match: /gravel|rock/i, name: "Decorative rock", detail: "Per ton, delivered and spread", price: 95, qty: num("tons?") },
      { match: /turf/i, name: "Artificial turf", detail: "Per sq ft, installed", price: 9, qty: num("(?:sq ?ft|square feet|sqft)") },
      { match: /pavers?|patio/i, name: "Paver patio", detail: "Per sq ft, installed on compacted base", price: 18, qty: num("(?:sq ?ft|square feet|sqft)") },
    ],
    addons: [
      { name: "Monthly maintenance plan", detail: "Two visits a month", price: 120, optional: true },
      { name: "Weed barrier and pre-emergent", detail: "", price: 85, optional: true },
      { name: "Landscape lighting", detail: "Six low-voltage LED fixtures", price: 650, optional: true },
    ],
    fallback: { name: "Yard clean-up", detail: "Weeding, trimming and green waste haul-away", price: 250 },
  },
  {
    key: "design",
    label: "Design",
    detect: /\b(logo|brand(ing)?|flyers?|brochure|business cards?|graphic|illustrat\w*|social media (posts?|graphics)|menu design)\b/i,
    rules: [
      { match: /logo/i, name: "Logo design", detail: "3 concepts, 2 revision rounds, all file formats", price: 550 },
      { match: /brand(ing)? (guide|kit)|style guide/i, name: "Brand guide", detail: "Colors, fonts and usage rules", price: 400 },
      { match: /flyer|poster/i, name: "Flyer design", detail: "Print-ready PDF", price: 150, qty: num("(?:flyers?|posters?)") },
      { match: /business cards?/i, name: "Business card design", detail: "Front and back, print-ready", price: 120 },
      { match: /social/i, name: "Social media graphics", detail: "Branded templates, per post", price: 40, qty: num("(?:posts?|graphics?|templates?)") },
      { match: /menu/i, name: "Menu design", detail: "Print and web versions", price: 300 },
    ],
    addons: [
      { name: "Extra revision round", detail: "", price: 120, optional: true },
      { name: "Source files", detail: "Editable Figma / Illustrator files", price: 150, optional: true },
      { name: "Print management", detail: "We handle the printer and proofing", price: 90, optional: true },
    ],
    fallback: { name: "Design project", detail: "Concepts, revisions and final files", price: 600 },
  },
  {
    key: "video",
    label: "Video",
    detect: /\b(video|filming|film|edit(ing)? videos?|reels?|youtube|tiktok|drone)\b/i,
    rules: [
      { match: /film|shoot/i, name: "Filming day", detail: "Crew of one, 4K camera and audio", price: 900, qty: num("days?") },
      { match: /edit/i, name: "Video editing", detail: "Per finished video, color and sound", price: 250, qty: num("(?:videos?|reels?|edits?)") },
      { match: /reels?|tiktok|shorts?/i, name: "Short-form cutdowns", detail: "Vertical clips with captions, per clip", price: 75, qty: num("(?:reels?|clips?|shorts?|tiktoks?)") },
      { match: /drone/i, name: "Drone footage", detail: "Licensed pilot, per location", price: 350 },
    ],
    addons: [
      { name: "Licensed music", detail: "", price: 60, optional: true },
      { name: "Subtitles", detail: "Burned-in captions", price: 50, optional: true },
      { name: "Raw footage hand-off", detail: "", price: 150, optional: true },
    ],
    fallback: { name: "Video production", detail: "Plan, film and edit", price: 1200 },
  },
];

const GENERIC: Trade = {
  key: "general",
  label: "General",
  detect: /.*/,
  rules: [
    { match: /hours?|hrs?/i, name: "Labor", detail: "Hourly rate", price: 75, qty: num("(?:hours?|hrs?)") },
    { match: /consult|call|meeting|strategy/i, name: "Consultation", detail: "Kick-off call and written plan", price: 150 },
    { match: /materials?|parts?|supplies/i, name: "Materials", detail: "At cost plus handling", price: 200 },
  ],
  addons: [
    { name: "Priority scheduling", detail: "Start within 48 hours", price: 150, optional: true },
    { name: "30-day follow-up check", detail: "", price: 75, optional: true },
  ],
  fallback: { name: "Project work", detail: "Scope as described", price: 500 },
};

function toItem(r: Omit<Rule, "match">, text: string, selected = false): LineItem {
  let qty = 1;
  if (r.qty) {
    const m = text.match(r.qty);
    if (m) qty = Math.max(1, Math.min(9999, parseFloat(m[1])));
  }
  return { id: uid(), name: r.name, detail: r.detail, qty, price: r.price, optional: !!r.optional, selected };
}

export interface Draft {
  trade: string;
  title: string;
  timeline: string;
  items: LineItem[];
}

export function detectTrade(text: string): Trade {
  let best: Trade = GENERIC;
  let bestHits = 0;
  for (const t of TRADES) {
    const hits = (text.match(new RegExp(t.detect.source, "gi")) || []).length;
    if (hits > bestHits) {
      best = t;
      bestHits = hits;
    }
  }
  return best;
}

export function smartDraft(text: string): Draft {
  const clean = text.trim();
  const trade = detectTrade(clean);
  const items: LineItem[] = [];
  const seen = new Set<string>();
  for (const r of trade.rules) {
    if (r.match.test(clean) && !seen.has(r.name)) {
      seen.add(r.name);
      items.push(toItem(r, clean));
    }
  }
  // Inner pages: "5 pages" usually includes the homepage.
  const home = items.find((i) => i.name.startsWith("Homepage"));
  const inner = items.find((i) => i.name === "Inner pages");
  if (home && inner && inner.qty > 1 && !/(inner|extra|more|additional)\s*pages?/i.test(clean)) inner.qty -= 1;
  if (inner && !home && inner.qty === 1 && !num("pages?").test(clean)) items.splice(items.indexOf(inner), 1);

  if (items.length === 0) items.push(toItem(trade.fallback, clean));
  trade.addons.forEach((a, i) => items.push(toItem(a, clean, i === 0)));

  return { trade: trade.label, title: makeTitle(clean, trade), timeline: findTimeline(clean), items };
}

function findTimeline(text: string): string {
  const m = text.match(/(\d+)\s*(day|week|month)s?/i);
  if (m) {
    const k = parseInt(m[1], 10);
    return `${k} ${m[2].toLowerCase()}${k === 1 ? "" : "s"}`;
  }
  if (/asap|rush|urgent/i.test(text)) return "As soon as possible";
  return "";
}

function makeTitle(text: string, trade: Trade): string {
  const first = text.split(/[.,;\n]/)[0].trim();
  if (first.length >= 6 && first.length <= 60) return first.charAt(0).toUpperCase() + first.slice(1);
  return trade.key === "general" ? "Project quote" : `${trade.label} project`;
}

export const EXAMPLES = [
  "Redo the homepage for a taco shop, 5 pages, contact form and SEO, 2 weeks",
  "Wedding photography 8 hours plus engagement shoot",
  "Deep clean 3 bedroom house, carpets in 2 rooms, 12 windows",
  "Trim 4 trees, fix sprinklers, 300 sq ft of turf",
  "Logo and brand guide for a coffee roaster plus 10 social media posts",
];
