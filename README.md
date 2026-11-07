# Snapquote

Type the job. Send a quote they can sign.

Snapquote turns a one-line job description ("redo the homepage, 5 pages, contact form, 2 weeks") into a polished, branded quote page. The client opens the link, taps optional add-ons and watches the total update, signs by typing their name, and pays the deposit through your payment link.

## How it works

- **Smart draft** (`src/lib/draft.ts`): spots the trade (website, photography, cleaning, landscaping, design, video, or general hourly work), pulls out counts and timelines, and drafts priced line items plus add-ons. No AI call, so it costs nothing per quote. Starter prices are placeholders to edit, not market research.
- **No-database share links** (`src/lib/quote.ts`): the whole quote is compressed into the URL fragment (`/q#...`). Fragments are never sent to the server, so links open instantly and nothing is stored on our side.
- **Signing**: when the client accepts, they get a "Send signed copy" email draft containing a signed link. When the freelancer opens it, their dashboard marks the quote accepted.
- **Your quotes** are saved in the browser (`localStorage`).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests
npm run build    # type-check + production build into dist/
```

Deploys on Vercel as a Vite app with zero config. `vercel.json` rewrites all paths to `index.html`.

## Next

- Supabase: real "opened" tracking and accept notifications without the email step
- Stripe Checkout for the exact deposit amount
- Optional "write it for me" button using Claude
- Pro plan
