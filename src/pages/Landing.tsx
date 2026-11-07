import { useMemo, useState } from "react";
import QuoteDocument from "../components/QuoteDocument";
import { EXAMPLES, smartDraft } from "../lib/draft";
import { Quote, addDays, blankQuote, defaultSelection, shareUrl } from "../lib/quote";
import { linkProps, navigate } from "../lib/router";

function demoQuote(): Quote {
  const q = blankQuote();
  const d = smartDraft("New homepage for a taco shop, 4 pages, contact form, 2 weeks");
  return {
    ...q,
    id: "demo7k2q",
    business: { name: "Sonoran Web Co.", email: "hello@example.com", color: "#4f46e5", tagline: "Websites for local shops" },
    client: { name: "Rosa's Tacos", email: "" },
    title: "New website for Rosa's Tacos",
    intro: "",
    timeline: d.timeline,
    validUntil: addDays(14),
    items: d.items,
  };
}

export default function Landing() {
  const demo = useMemo(demoQuote, []);
  const [sel, setSel] = useState(() => defaultSelection(demo));
  const [job, setJob] = useState("");
  const [ph] = useState(() => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]!);

  const go = (text: string) => navigate(`/new?draft=${encodeURIComponent(text)}`);

  return (
    <main>
      <section className="hero wrap">
        <div className="hero__copy">
          <div className="eyebrow">Quotes that close themselves</div>
          <h1 className="hero__h">
            Type the job.
            <br />
            <span className="grad">Send a quote they can sign.</span>
          </h1>
          <p className="hero__p">
            Snapquote turns a one-line job description into a polished quote page. Your client picks add-ons, watches the total update, signs with
            their name, and pays the deposit. No PDFs, no back-and-forth.
          </p>
          <form
            className="hero__form"
            onSubmit={(e) => {
              e.preventDefault();
              go(job || ph);
            }}
          >
            <input value={job} onChange={(e) => setJob(e.target.value)} placeholder={ph} aria-label="Describe the job" />
            <button className="btn btn--brand">Draft my quote →</button>
          </form>
          <div className="muted small">Free while in beta · no sign-up · nothing stored on a server</div>
        </div>

        <div className="hero__demo">
          <div className="demo__hint">
            <span className="dot" /> Live demo. Tap the add-ons.
          </div>
          <div className="demo__frame">
            <QuoteDocument
              quote={demo}
              selected={sel}
              compact
              onToggle={(id) =>
                setSel((s) => {
                  const n = new Set(s);
                  if (n.has(id)) n.delete(id);
                  else n.add(id);
                  return n;
                })
              }
            />
          </div>
          <a className="demo__open small" href={shareUrl(demo)} target="_blank" rel="noopener noreferrer">
            Open it the way a client would ↗
          </a>
        </div>
      </section>

      <section className="wrap how">
        <h2 className="center">From "can you quote this?" to a paid deposit</h2>
        <div className="how__grid">
          <div className="how__step">
            <div className="how__n">1</div>
            <h3>Describe it like a text</h3>
            <p className="muted">"Deep clean 3 bedroom house, 12 windows." Snapquote spots the trade and the counts, then drafts priced line items and add-ons for you to tweak.</p>
          </div>
          <div className="how__step">
            <div className="how__n">2</div>
            <h3>Send one link</h3>
            <p className="muted">The quote is packed into the link itself, so it opens instantly on any phone. Your brand color, your terms, your deposit.</p>
          </div>
          <div className="how__step">
            <div className="how__n">3</div>
            <h3>They choose, sign and pay</h3>
            <p className="muted">Add-ons are tap-to-add, so clients often pick more. They sign by typing their name and pay the deposit through your Stripe link.</p>
          </div>
        </div>
      </section>

      <section className="wrap trades">
        <div className="muted small center">Smart drafts know these trades</div>
        <div className="trades__row">
          {["Websites", "Photography", "Cleaning", "Landscaping", "Design", "Video", "Anything by the hour"].map((t) => (
            <span key={t} className="pill pill--static">
              {t}
            </span>
          ))}
        </div>
        <div className="trades__row">
          {EXAMPLES.slice(1).map((e) => (
            <button key={e} className="pill" onClick={() => go(e)}>
              Try: {e}
            </button>
          ))}
        </div>
      </section>

      <section className="wrap cta">
        <h2>Your next quote takes 60 seconds</h2>
        <a className="btn btn--brand btn--lg" {...linkProps("/new")}>
          Start a quote
        </a>
      </section>
    </main>
  );
}
