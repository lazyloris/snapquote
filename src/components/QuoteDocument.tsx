import { Acceptance, Quote, lineTotal, money, prettyDate, totals } from "../lib/quote";
import { useCountUp } from "../lib/useCountUp";

interface Props {
  quote: Quote;
  selected: Set<string>;
  onToggle?: (id: string) => void;
  acceptance?: Acceptance | null;
  compact?: boolean;
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "SQ"
  );
}

export default function QuoteDocument({ quote: q, selected, onToggle, acceptance, compact }: Props) {
  const t = totals(q, selected);
  const total = useCountUp(t.total);
  const deposit = useCountUp(t.deposit);
  const required = q.items.filter((i) => !i.optional);
  const optional = q.items.filter((i) => i.optional);
  const locked = !!acceptance || !onToggle;
  const expired = q.validUntil && new Date(q.validUntil + "T23:59:59") < new Date() && !acceptance;

  return (
    <article className={`doc${compact ? " doc--compact" : ""}`} style={{ ["--brand" as string]: q.business.color || "#4f46e5" }}>
      <header className="doc__head">
        <div className="doc__brand">
          <div className="doc__logo" aria-hidden>
            {initials(q.business.name)}
          </div>
          <div>
            <div className="doc__biz">{q.business.name || "Your business"}</div>
            {q.business.tagline && <div className="doc__tag">{q.business.tagline}</div>}
          </div>
        </div>
        <div className="doc__meta">
          <div className="doc__label">Quote</div>
          <div>#{q.id.slice(0, 6).toUpperCase()}</div>
          <div className="muted">{prettyDate(q.createdAt)}</div>
        </div>
      </header>

      <section className="doc__intro">
        <div className="muted small">Prepared for</div>
        <div className="doc__client">{q.client.name || "Your client"}</div>
        <h1 className="doc__title">{q.title || "Untitled quote"}</h1>
        {q.intro && <p className="doc__p">{q.intro}</p>}
        <div className="doc__chips">
          {q.timeline && <span className="chip">Timeline: {q.timeline}</span>}
          {q.validUntil && <span className={`chip${expired ? " chip--warn" : ""}`}>{expired ? "Expired" : "Valid until"} {prettyDate(q.validUntil)}</span>}
        </div>
      </section>

      <section>
        <div className="doc__section">What's included</div>
        <ul className="items">
          {required.length === 0 && <li className="items__empty muted">Add line items to see them here.</li>}
          {required.map((i) => (
            <li key={i.id} className="item">
              <div className="item__main">
                <div className="item__name">{i.name || "Item"}</div>
                {i.detail && <div className="item__detail">{i.detail}</div>}
              </div>
              <div className="item__qty">{i.qty !== 1 && `${i.qty} × ${money(i.price, q.currency)}`}</div>
              <div className="item__amt">{money(lineTotal(i), q.currency)}</div>
            </li>
          ))}
        </ul>
      </section>

      {optional.length > 0 && (
        <section>
          <div className="doc__section">
            Optional add-ons {!locked && <span className="muted small">· tap to add or remove</span>}
          </div>
          <ul className="items">
            {optional.map((i) => {
              const on = selected.has(i.id);
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    className={`addon${on ? " addon--on" : ""}`}
                    onClick={() => onToggle?.(i.id)}
                    disabled={locked}
                    aria-pressed={on}
                  >
                    <span className="addon__check" aria-hidden>
                      <svg viewBox="0 0 20 20" width="14" height="14">
                        <path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="item__main">
                      <span className="item__name">{i.name}</span>
                      {i.detail && <span className="item__detail">{i.detail}</span>}
                    </span>
                    <span className="item__amt">+{money(lineTotal(i), q.currency)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="sum">
        <div className="sum__row">
          <span>Subtotal</span>
          <span>{money(t.subtotal, q.currency)}</span>
        </div>
        {q.taxRate > 0 && (
          <div className="sum__row">
            <span>Tax ({q.taxRate}%)</span>
            <span>{money(t.tax, q.currency)}</span>
          </div>
        )}
        <div className="sum__row sum__total">
          <span>Total</span>
          <span>{money(total, q.currency)}</span>
        </div>
        {q.depositPct > 0 && (
          <div className="sum__row sum__deposit">
            <span>Deposit to start ({q.depositPct}%)</span>
            <span>{money(deposit, q.currency)}</span>
          </div>
        )}
      </section>

      {q.terms && (
        <section>
          <div className="doc__section">Terms</div>
          <p className="doc__p small">{q.terms}</p>
        </section>
      )}

      {acceptance && (
        <section className="signed">
          <div className="signed__sig">{acceptance.name}</div>
          <div className="small">
            Accepted by <b>{acceptance.name}</b> on {new Date(acceptance.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} for{" "}
            <b>{money(acceptance.total, q.currency)}</b>
          </div>
        </section>
      )}

      <footer className="doc__foot muted small">
        {q.business.email && <span>Questions? {q.business.email}</span>}
        <span>Made with Snapquote</span>
      </footer>
    </article>
  );
}
