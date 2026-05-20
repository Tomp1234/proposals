# Composed Oasis

Personalized proposal website generator for Milo.ai sales calls.

Paste a transcript + client URL → get a Webflow-published proposal page in the client's brand in ~60 seconds.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in your keys
cp .env.example .env.local

# 3. Follow WEBFLOW_SETUP.md (one-time)

# 4. Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
npx vercel deploy
```

Then add all env vars from `.env.example` in the Vercel project settings, and add Vercel KV storage.

## How it works

1. **Step 1 — Client info**: Enter client name + website URL. The app fetches their site and extracts primary/secondary/accent colors, logo URL, and font.
2. **Step 2 — Transcript**: Paste the demo call transcript.
3. **Step 3 — Pricing**: Confirm base tier and add any custom line items.
4. **Generate**: Claude (claude-sonnet-4-6) analyzes the transcript and writes personalized content — headline, pain points, solution highlights, case study, CTA.
5. **Preview**: See the full proposal rendered in the client's brand.
6. **Publish**: One click pushes to Webflow and returns a shareable URL.

## Stack

- **Next.js 14** (App Router) — web app and API routes
- **Vercel** — hosting and KV storage
- **Anthropic SDK** — transcript analysis and content generation (with prompt caching)
- **Webflow Data API v2** — CMS item creation and publishing
- **cheerio** — serverless-safe brand color and logo extraction
- **Tailwind CSS** — internal app styling

## Webflow setup

See [WEBFLOW_SETUP.md](./WEBFLOW_SETUP.md) for the one-time Webflow configuration.
