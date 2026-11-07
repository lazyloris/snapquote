import { useEffect, useMemo, useState } from "react";
import QuoteDocument from "../components/QuoteDocument";
import { Acceptance, defaultSelection, money, parseShareHash, shareUrl, totals } from "../lib/quote";
import { linkProps } from "../lib/router";
import { getClientAcceptance, getQuote, markQuote, saveClientAcceptance } from "../lib/store";
import Burst from "../components/Burst";

export default function QuoteView({ hash }: { hash: string }) {
  const { quote, acceptance: linkAcceptance } = useMemo(() => parseShareHash(hash), [hash]);
  const [acceptance, setAcceptance] = useState<Acceptance | null>(() => linkAcceptance ?? (quote ? getClientAcceptance(quote.id) : null));
  const [selected, setSelected] = useState<Set<string>>(() =>
    acceptance ? new Set(acceptance.selected) : quote ? defaultSelection(quote) : new Set(),
  );
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const isOwner = !!(quote && getQuote(quote.id));

  // The freelancer opened a signed confirmation link: record it on their dashboard.
  useEffect(() => {
    if (quote && linkAcceptance) markQuote(quote.id, { acceptance: linkAcceptance });
  }, [quote, linkAcceptance]);

  useEffect(() => {
    if (quote) document.title = `${quote.title || "Quote"} · ${quote.business.name || "Snapquote"}`;
  }, [quote]);

  if (!quote) {
    return (
      <main className="wrap narrow center-page">
        <h1>This quote link looks broken</h1>
        <p className="muted">The link may have been cut off when it was copied. Ask the sender for a fresh link.</p>
        <a className="btn" {...linkProps("/")}>
          Go to Snapquote
        </a>
      </main>
    );
  }

  const t = totals(quote, selected);
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const accept = () => {
    const a: Acceptance = { name: name.trim(), at: new Date().toISOString(), selected: [...selected], total: t.total };
    saveClientAcceptance(quote.id, a);
    setAcceptance(a);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2200);
  };

  const confirmLink = acceptance ? shareUrl(quote, acceptance) : "";
  const picked = quote.items.filter((i) => i.optional && selected.has(i.id)).map((i) => `  - ${i.name}`);
  const mailto = acceptance
    ? `mailto:${encodeURIComponent(quote.business.email)}?subject=${encodeURIComponent(
        `Accepted: ${quote.title || "your quote"}`,
      )}&body=${encodeURIComponent(
        `Hi ${quote.business.name},\n\nI've accepted your quote "${quote.title}" for ${money(acceptance.total, quote.currency)}.\n` +
          (picked.length ? `\nAdd-ons I picked:\n${picked.join("\n")}\n` : "") +
          `\nSigned copy: ${confirmLink}\n\nThanks,\n${acceptance.name}`,
      )}`
    : "";

  return (
    <main className="view">
      {celebrate && <Burst color={quote.business.color} />}
      {isOwner && !linkAcceptance && (
        <div className="ownerbar no-print">
          <span>You're seeing what your client sees.</span>
          <a className="btn btn--sm btn--ghost" {...linkProps(`/edit/${quote.id}`)}>
            Edit quote
          </a>
        </div>
      )}
      {linkAcceptance && (
        <div className="ownerbar ownerbar--good no-print">
          <span>
            Signed by <b>{linkAcceptance.name}</b> · {money(linkAcceptance.total, quote.currency)}
          </span>
          <a className="btn btn--sm btn--ghost" {...linkProps("/quotes")}>
            Your quotes
          </a>
        </div>
      )}

      <div className="view__grid">
        <QuoteDocument quote={quote} selected={selected} onToggle={toggle} acceptance={acceptance} />

        <aside className="panel no-print" style={{ ["--brand" as string]: quote.business.color }}>
          {!acceptance ? (
            <>
              <div className="panel__total">
                <div className="muted small">Your total</div>
                <div className="panel__big">{money(t.total, quote.currency)}</div>
                {quote.depositPct > 0 && (
                  <div className="small">
                    {money(t.deposit, quote.currency)} deposit to get started
                  </div>
                )}
              </div>
              <label className="field">
                <span>Type your full name to sign</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Rivera" autoComplete="name" />
              </label>
              {name.trim() && <div className="sigpreview">{name}</div>}
              <label className="check">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>I accept this quote and its terms.</span>
              </label>
              <button className="btn btn--brand btn--block" disabled={!name.trim() || !agree} onClick={accept}>
                Accept quote
              </button>
              <button className="btn btn--ghost btn--block" onClick={() => window.print()}>
                Save as PDF
              </button>
            </>
          ) : (
            <>
              <div className="done">
                <div className="done__tick">✓</div>
                <div className="done__title">Quote accepted</div>
                <div className="muted small">
                  {linkAcceptance ? "This is the signed copy." : `Nice. ${quote.business.name || "They"} will be in touch.`}
                </div>
              </div>
              {!linkAcceptance && quote.payLink && (
                <a className="btn btn--brand btn--block" href={quote.payLink} target="_blank" rel="noopener noreferrer">
                  Pay {money(acceptance.total * (quote.depositPct / 100), quote.currency)} deposit
                </a>
              )}
              {!linkAcceptance && quote.business.email && (
                <a className={`btn btn--block ${quote.payLink ? "btn--ghost" : "btn--brand"}`} href={mailto}>
                  Send signed copy to {quote.business.name || "them"}
                </a>
              )}
              <button className="btn btn--ghost btn--block" onClick={() => window.print()}>
                Save as PDF
              </button>
            </>
          )}
        </aside>
      </div>
      {!acceptance && (
        <div className="mbar no-print">
          <span>{money(t.total, quote.currency)}</span>
          <button className="btn btn--brand" style={{ ["--brand" as string]: quote.business.color }} onClick={() => document.querySelector(".panel input")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
            Review and sign
          </button>
        </div>
      )}
    </main>
  );
}
