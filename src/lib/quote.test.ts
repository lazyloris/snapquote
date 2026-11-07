import { describe, expect, it } from "vitest";
import { blankQuote, parseShareHash, shareHash, totals, defaultSelection } from "./quote";
import { smartDraft, detectTrade } from "./draft";

describe("totals", () => {
  it("adds required items, selected add-ons, tax and deposit", () => {
    const q = blankQuote();
    q.taxRate = 10;
    q.depositPct = 50;
    q.items = [
      { id: "a", name: "A", detail: "", qty: 2, price: 100, optional: false, selected: false },
      { id: "b", name: "B", detail: "", qty: 1, price: 50, optional: true, selected: true },
      { id: "c", name: "C", detail: "", qty: 1, price: 999, optional: true, selected: false },
    ];
    const t = totals(q, defaultSelection(q));
    expect(t).toEqual({ subtotal: 250, tax: 25, total: 275, deposit: 137.5, balance: 137.5 });
    expect(totals(q, new Set(["c"])).subtotal).toBe(1199);
  });
});

describe("share links", () => {
  it("round-trips a quote and an acceptance", () => {
    const q = blankQuote();
    q.title = "Ñandú café — 5 pages & SEO";
    const a = { name: "Rosa", at: new Date().toISOString(), selected: ["x"], total: 12 };
    const out = parseShareHash("#" + shareHash(q, a));
    expect(out.quote).toEqual(q);
    expect(out.acceptance).toEqual(a);
    expect(parseShareHash("#garbage").quote).toBeNull();
  });
});

describe("smartDraft", () => {
  it("drafts a website job with page counts and timeline", () => {
    const d = smartDraft("Redo the homepage for a taco shop, 5 pages, contact form and SEO, 2 weeks");
    expect(d.trade).toBe("Website");
    expect(d.timeline).toBe("2 weeks");
    const names = d.items.map((i) => i.name);
    expect(names).toContain("Homepage design and build");
    expect(names).toContain("Contact form");
    expect(names).toContain("SEO foundations");
    expect(d.items.find((i) => i.name === "Inner pages")?.qty).toBe(4);
    expect(d.items.some((i) => i.optional)).toBe(true);
  });
  it("detects other trades and counts", () => {
    expect(detectTrade("Deep clean 3 bedroom house, 12 windows").label).toBe("Cleaning");
    const d = smartDraft("Deep clean 3 bedroom house, 12 windows");
    expect(d.items.find((i) => i.name === "Window cleaning")?.qty).toBe(12);
    expect(smartDraft("Wedding photography 8 hours").items[0]?.qty).toBe(8);
    expect(smartDraft("fix my thing").items[0]?.name).toBe("Project work");
  });
});
