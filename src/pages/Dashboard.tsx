import { useState } from "react";
import { defaultSelection, money, prettyDate, shareUrl, totals, uid, addDays } from "../lib/quote";
import { linkProps, navigate } from "../lib/router";
import { SavedQuote, deleteQuote, listQuotes, saveQuote } from "../lib/store";

function status(s: SavedQuote) {
  if (s.acceptance) return { label: "Accepted", cls: "good" };
  if (s.sentAt) return { label: "Sent", cls: "info" };
  return { label: "Draft", cls: "" };
}

export default function Dashboard() {
  const [rows, setRows] = useState(listQuotes);
  const [copied, setCopied] = useState<string | null>(null);
  const refresh = () => setRows(listQuotes());

  const value = (s: SavedQuote) => s.acceptance?.total ?? totals(s.quote, defaultSelection(s.quote)).total;
  const sent = rows.filter((r) => r.sentAt || r.acceptance);
  const won = rows.filter((r) => r.acceptance);
  const pipeline = sent.filter((r) => !r.acceptance).reduce((a, r) => a + value(r), 0);
  const wonValue = won.reduce((a, r) => a + value(r), 0);

  const duplicate = (s: SavedQuote) => {
    const q = { ...structuredClone(s.quote), id: uid(), createdAt: new Date().toISOString(), validUntil: addDays(14), title: `${s.quote.title} (copy)` };
    saveQuote(q);
    navigate(`/edit/${q.id}`);
  };

  return (
    <main className="wrap">
      <div className="dash__head">
        <div>
          <h1>Your quotes</h1>
          <p className="muted small">Stored in this browser. When a client signs, they send you a signed link. Open it here and the quote is marked accepted.</p>
        </div>
        <a className="btn btn--brand" {...linkProps("/new")}>
          + New quote
        </a>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="muted small">Quotes sent</div>
          <div className="stat__n">{sent.length}</div>
        </div>
        <div className="stat">
          <div className="muted small">Waiting on clients</div>
          <div className="stat__n">{money(pipeline, "USD", false)}</div>
        </div>
        <div className="stat">
          <div className="muted small">Won</div>
          <div className="stat__n">{money(wonValue, "USD", false)}</div>
        </div>
        <div className="stat">
          <div className="muted small">Win rate</div>
          <div className="stat__n">{sent.length ? Math.round((won.length / sent.length) * 100) + "%" : "–"}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty card">
          <h2>No quotes yet</h2>
          <p className="muted">Describe a job in one line and Snapquote drafts the rest.</p>
          <a className="btn btn--brand" {...linkProps("/new")}>
            Create your first quote
          </a>
        </div>
      ) : (
        <ul className="qlist">
          {rows.map((s) => {
            const st = status(s);
            return (
              <li key={s.quote.id} className="qrow" style={{ ["--brand" as string]: s.quote.business.color }}>
                <div className="qrow__bar" />
                <div className="qrow__main">
                  <a className="qrow__title" {...linkProps(`/edit/${s.quote.id}`)}>
                    {s.quote.title || "Untitled quote"}
                  </a>
                  <div className="muted small">
                    {s.quote.client.name || "No client"} · {prettyDate(s.quote.createdAt)}
                    {s.acceptance && ` · signed by ${s.acceptance.name} on ${prettyDate(s.acceptance.at)}`}
                  </div>
                </div>
                <span className={`badge ${st.cls}`}>{st.label}</span>
                <div className="qrow__amt">{money(value(s), s.quote.currency)}</div>
                <div className="qrow__actions">
                  <button
                    className="btn btn--sm btn--ghost"
                    onClick={() => {
                      navigator.clipboard?.writeText(shareUrl(s.quote)).then(() => {
                        setCopied(s.quote.id);
                        setTimeout(() => setCopied(null), 1500);
                      }, () => {});
                    }}
                  >
                    {copied === s.quote.id ? "Copied" : "Copy link"}
                  </button>
                  <button className="btn btn--sm btn--ghost" onClick={() => duplicate(s)}>
                    Duplicate
                  </button>
                  <button
                    className="btn btn--sm btn--ghost danger"
                    onClick={() => {
                      deleteQuote(s.quote.id);
                      refresh();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
