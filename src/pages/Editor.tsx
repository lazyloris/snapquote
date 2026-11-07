import { useEffect, useMemo, useRef, useState } from "react";
import QuoteDocument from "../components/QuoteDocument";
import { EXAMPLES, smartDraft } from "../lib/draft";
import { LineItem, Quote, blankQuote, defaultSelection, money, shareUrl, totals, uid } from "../lib/quote";
import { linkProps, navigate } from "../lib/router";
import { getProfile, getQuote, saveProfile, saveQuote } from "../lib/store";

const COLORS = ["#4f46e5", "#0ea5e9", "#059669", "#d97706", "#e11d48", "#7c3aed", "#0f172a"];

function startQuote(id?: string, draftText?: string): Quote {
  if (id) {
    const saved = getQuote(id);
    if (saved) return saved.quote;
  }
  const q = blankQuote();
  const p = getProfile();
  if (p) {
    q.business = { name: p.name, email: p.email, color: p.color, tagline: p.tagline };
    q.payLink = p.payLink;
    q.taxRate = p.taxRate;
    q.depositPct = p.depositPct;
  }
  if (draftText) {
    const d = smartDraft(draftText);
    q.title = d.title;
    q.timeline = d.timeline;
    q.items = d.items;
  }
  return q;
}

export default function Editor({ id, draft }: { id?: string; draft?: string }) {
  const [q, setQ] = useState<Quote>(() => startQuote(id, draft));
  const [job, setJob] = useState(draft ?? "");
  const [flash, setFlash] = useState(false);
  const [share, setShare] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const touched = useRef(!!id || !!draft);

  // Autosave once the user has started.
  useEffect(() => {
    if (!touched.current) return;
    const t = setTimeout(() => {
      saveQuote(q);
      saveProfile({ ...q.business, payLink: q.payLink, taxRate: q.taxRate, depositPct: q.depositPct });
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const update = (patch: Partial<Quote>) => {
    touched.current = true;
    setQ((x) => ({ ...x, ...patch }));
  };
  const setBiz = (patch: Partial<Quote["business"]>) => update({ business: { ...q.business, ...patch } });
  const setItem = (iid: string, patch: Partial<LineItem>) => update({ items: q.items.map((i) => (i.id === iid ? { ...i, ...patch } : i)) });
  const removeItem = (iid: string) => update({ items: q.items.filter((i) => i.id !== iid) });
  const addItem = (optional = false) =>
    update({ items: [...q.items, { id: uid(), name: "", detail: "", qty: 1, price: 0, optional, selected: false }] });
  const move = (iid: string, dir: -1 | 1) => {
    const idx = q.items.findIndex((i) => i.id === iid);
    const j = idx + dir;
    if (j < 0 || j >= q.items.length) return;
    const items = [...q.items];
    [items[idx], items[j]] = [items[j]!, items[idx]!];
    update({ items });
  };

  const runDraft = (text = job) => {
    if (!text.trim()) return;
    const d = smartDraft(text);
    setJob(text);
    update({ title: q.title && q.items.length ? q.title : d.title, timeline: d.timeline || q.timeline, items: d.items });
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
  };

  const selection = useMemo(() => defaultSelection(q), [q]);
  const t = totals(q, selection);

  const missing = [
    !q.business.name && "your business name",
    !q.client.name && "the client's name",
    !q.items.some((i) => !i.optional && i.price > 0) && "at least one priced item",
  ].filter(Boolean) as string[];

  const makeLink = () => {
    saveQuote(q, { sentAt: new Date().toISOString() });
    touched.current = true;
    const url = shareUrl(q);
    setShare(url);
    setCopied(false);
    navigator.clipboard?.writeText(url).then(() => setCopied(true), () => {});
    if (!id) window.history.replaceState({}, "", `/edit/${q.id}`);
  };

  const mailClient = share
    ? `mailto:${encodeURIComponent(q.client.email)}?subject=${encodeURIComponent(`Your quote: ${q.title}`)}&body=${encodeURIComponent(
        `Hi ${q.client.name.split(" ")[0] || "there"},\n\nHere's your quote for "${q.title}". You can pick add-ons, see the total update, and accept it online:\n\n${share}\n\nThanks,\n${q.business.name}`,
      )}`
    : "";

  return (
    <main className="editor">
      <div className="tabs no-desktop">
        <button className={tab === "edit" ? "on" : ""} onClick={() => setTab("edit")}>
          Edit
        </button>
        <button className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>
          Preview · {money(t.total, q.currency, false)}
        </button>
      </div>

      <div className="editor__grid">
        <div className={`editor__form${tab === "preview" ? " hide-mobile" : ""}`}>
          <section className="card card--hero">
            <div className="step">1</div>
            <h2>Describe the job</h2>
            <p className="muted small">Write it the way you'd text it. Snapquote spots the trade, counts, and timeline, then drafts line items and add-ons.</p>
            <textarea
              className="job"
              rows={3}
              value={job}
              onChange={(e) => setJob(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runDraft();
              }}
              placeholder="Redo the homepage for a taco shop, 5 pages, contact form and SEO, 2 weeks"
            />
            <div className="row wrap-gap">
              <button className="btn btn--brand" onClick={() => runDraft()} disabled={!job.trim()}>
                ✦ Draft my quote
              </button>
              <span className="muted small">or try:</span>
              {EXAMPLES.slice(0, 3).map((e) => (
                <button key={e} className="pill" onClick={() => runDraft(e)}>
                  {e.split(",")[0]}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="step">2</div>
            <h2>Your business</h2>
            <div className="grid2">
              <label className="field">
                <span>Business name</span>
                <input value={q.business.name} onChange={(e) => setBiz({ name: e.target.value })} placeholder="Sonoran Web Co." />
              </label>
              <label className="field">
                <span>Your email</span>
                <input type="email" value={q.business.email} onChange={(e) => setBiz({ email: e.target.value })} placeholder="you@business.com" />
              </label>
              <label className="field">
                <span>Tagline (optional)</span>
                <input value={q.business.tagline} onChange={(e) => setBiz({ tagline: e.target.value })} placeholder="Websites for local shops" />
              </label>
              <div className="field">
                <span>Brand color</span>
                <div className="swatches">
                  {COLORS.map((c) => (
                    <button key={c} className={`swatch${q.business.color === c ? " on" : ""}`} style={{ background: c }} onClick={() => setBiz({ color: c })} aria-label={`Color ${c}`} />
                  ))}
                  <input type="color" value={q.business.color} onChange={(e) => setBiz({ color: e.target.value })} aria-label="Custom color" />
                </div>
              </div>
            </div>
            <p className="muted small">Saved in this browser, so your next quote starts filled in.</p>
          </section>

          <section className="card">
            <div className="step">3</div>
            <h2>The client and the job</h2>
            <div className="grid2">
              <label className="field">
                <span>Client name</span>
                <input value={q.client.name} onChange={(e) => update({ client: { ...q.client, name: e.target.value } })} placeholder="Rosa's Tacos" />
              </label>
              <label className="field">
                <span>Client email (optional)</span>
                <input type="email" value={q.client.email} onChange={(e) => update({ client: { ...q.client, email: e.target.value } })} placeholder="rosa@example.com" />
              </label>
              <label className="field span2">
                <span>Quote title</span>
                <input value={q.title} onChange={(e) => update({ title: e.target.value })} placeholder="New website for Rosa's Tacos" />
              </label>
              <label className="field span2">
                <span>A short note to the client (optional)</span>
                <textarea rows={2} value={q.intro} onChange={(e) => update({ intro: e.target.value })} placeholder="Thanks for the chat on Tuesday. Here's what we talked about." />
              </label>
            </div>
          </section>

          <section className={`card${flash ? " card--flash" : ""}`}>
            <div className="step">4</div>
            <h2>Line items</h2>
            {q.items.length === 0 && <p className="muted small">Describe the job above to draft these, or add them by hand.</p>}
            <div className="lines">
              {q.items.map((i, idx) => (
                <div key={i.id} className={`line${i.optional ? " line--opt" : ""}`}>
                  <div className="line__top">
                    <input className="line__name" value={i.name} onChange={(e) => setItem(i.id, { name: e.target.value })} placeholder="Item name" aria-label="Item name" />
                    <div className="line__tools">
                      <button className="icon" onClick={() => move(i.id, -1)} disabled={idx === 0} aria-label="Move up">↑</button>
                      <button className="icon" onClick={() => move(i.id, 1)} disabled={idx === q.items.length - 1} aria-label="Move down">↓</button>
                      <button className="icon icon--x" onClick={() => removeItem(i.id)} aria-label="Remove item">×</button>
                    </div>
                  </div>
                  <input className="line__detail" value={i.detail} onChange={(e) => setItem(i.id, { detail: e.target.value })} placeholder="Details (optional)" aria-label="Details" />
                  <div className="line__nums">
                    <label>
                      Qty
                      <input type="number" min={0} step="any" value={i.qty} onChange={(e) => setItem(i.id, { qty: Number(e.target.value) || 0 })} />
                    </label>
                    <label>
                      Price
                      <input type="number" min={0} step="any" value={i.price} onChange={(e) => setItem(i.id, { price: Number(e.target.value) || 0 })} />
                    </label>
                    <label className="toggle">
                      <input type="checkbox" checked={i.optional} onChange={(e) => setItem(i.id, { optional: e.target.checked })} />
                      Add-on
                    </label>
                    {i.optional && (
                      <label className="toggle">
                        <input type="checkbox" checked={i.selected} onChange={(e) => setItem(i.id, { selected: e.target.checked })} />
                        Pre-selected
                      </label>
                    )}
                    <span className="line__amt">{money(i.qty * i.price, q.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="row">
              <button className="btn btn--ghost btn--sm" onClick={() => addItem(false)}>
                + Item
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => addItem(true)}>
                + Add-on
              </button>
            </div>
          </section>

          <section className="card">
            <div className="step">5</div>
            <h2>Terms and payment</h2>
            <div className="grid2">
              <label className="field">
                <span>Deposit to start (%)</span>
                <input type="number" min={0} max={100} value={q.depositPct} onChange={(e) => update({ depositPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
              </label>
              <label className="field">
                <span>Tax (%)</span>
                <input type="number" min={0} max={50} step="any" value={q.taxRate} onChange={(e) => update({ taxRate: Math.max(0, Number(e.target.value) || 0) })} />
              </label>
              <label className="field">
                <span>Timeline</span>
                <input value={q.timeline} onChange={(e) => update({ timeline: e.target.value })} placeholder="2 weeks" />
              </label>
              <label className="field">
                <span>Valid until</span>
                <input type="date" value={q.validUntil} onChange={(e) => update({ validUntil: e.target.value })} />
              </label>
              <label className="field span2">
                <span>Deposit payment link (optional)</span>
                <input value={q.payLink} onChange={(e) => update({ payLink: e.target.value.trim() })} placeholder="https://buy.stripe.com/..." />
                <small className="muted">Paste a Stripe Payment Link, PayPal.me or Venmo link. A "Pay deposit" button appears once the client signs.</small>
              </label>
              <label className="field span2">
                <span>Terms</span>
                <textarea rows={2} value={q.terms} onChange={(e) => update({ terms: e.target.value })} />
              </label>
            </div>
          </section>

          <div className="sharebar">
            <div>
              <div className="small muted">Total</div>
              <div className="sharebar__total">{money(t.total, q.currency)}</div>
            </div>
            <div className="sharebar__right">
              {missing.length > 0 && <span className="small muted">Add {missing.join(", ")}</span>}
              <button className="btn btn--brand" disabled={missing.length > 0} onClick={makeLink}>
                Get share link
              </button>
            </div>
          </div>
        </div>

        <div className={`editor__preview${tab === "edit" ? " hide-mobile" : ""}`}>
          <div className="sticky">
            <div className="preview__label">
              <span className="dot" /> Live preview
            </div>
            <QuoteDocument quote={q} selected={selection} compact />
          </div>
        </div>
      </div>

      {share && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setShare(null)}>
          <div className="modal__box" onClick={(e) => e.stopPropagation()}>
            <div className="done__tick">✓</div>
            <h2>Your quote is ready to send</h2>
            <p className="muted small">{copied ? "Link copied. " : ""}The whole quote lives inside this link, so there's nothing to log in to and nothing stored on a server.</p>
            <div className="linkbox">
              <input readOnly value={share} onFocus={(e) => e.target.select()} />
              <button
                className="btn btn--sm"
                onClick={() => navigator.clipboard?.writeText(share).then(() => setCopied(true), () => {})}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="row wrap-gap">
              <a className="btn btn--brand" href={share} target="_blank" rel="noopener noreferrer">
                Open client view
              </a>
              {q.client.email && (
                <a className="btn btn--ghost" href={mailClient}>
                  Email it to {q.client.name.split(" ")[0]}
                </a>
              )}
              <a className="btn btn--ghost" {...linkProps("/quotes")} onClick={(e) => { e.preventDefault(); setShare(null); navigate("/quotes"); }}>
                All quotes
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
