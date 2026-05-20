# Composed Oasis — Proposal Generator

This project generates personalized sales proposal pages for Milo.ai. There is no UI. Anu (anu@milo.ai) brings inputs here and I handle the full workflow.

---

## My workflow every time Anu provides a new client

### Inputs Anu provides (she pastes/uploads directly in chat):
1. **Screenshot** of the client's landing page (I analyze it visually)
2. **HTML** of the client's landing page (View Source → paste)
3. **Client name** and **website URL**
4. **Transcript** of the demo call (paste as text)
5. **CTA URL** — the calendar/contact link to put on the proposal (default: ask her)
6. **Custom add-ons** — any specific pricing extras to mention (optional)

### What I do:

**Step 1 — Extract brand**
Look at the screenshot directly. Identify:
- `primaryColor`: the dominant hero/page background color (exact hex — could be black, dark, or colorful)
- `accentColor`: the CTA button or highlight color (the "pop" color)
- `secondaryColor`: secondary section background
- `fontFamily`: use the client's font IF it's distinctive/premium (check `<link>` Google Fonts tags in HTML). If the client uses a generic/boring font (Arial, Helvetica, system-ui, sans-serif, Times, Georgia, Roboto, Open Sans) — ignore it and leave `fontFamily` blank so the proposal falls back to Instrument Serif + DM Sans. The goal: proposals always look premium.
- `logoUrl`: find `<img>` with "logo" in header/nav, or `og:image` meta tag

Also parse the HTML with the existing `lib/scraper.ts` logic for additional color hints.

**Step 2 — Generate proposal content**
Using the transcript and brand context, generate this exact JSON:

```json
{
  "heroQuote": "Bold hook question from their world — e.g. 'How well are we selling Sponsored Snaps?'",
  "heroSubtext": "1-2 sentences. Sets up Milo as the answer.",
  "keyMetrics": [
    { "value": "850M+", "label": "monthly active users" },
    { "value": "$5.49", "label": "average CPM" },
    { "value": "4M+", "label": "active advertisers" }
  ],
  "contactName": "First name of the main person from the transcript",
  "clientQuestions": [
    { "category": "Q4 REVENUE", "question": "How well are we selling Sponsored Snaps this quarter? Which reps are lagging?" },
    { "category": "ADVERTISER HEALTH", "question": "Which of our top 50 advertiser accounts showed early warning signs of declining spend this week?" }
  ],
  "solutionHighlights": [
    { "feature": "Pace by product, gap by team", "benefit": "See the gap against target in real time. No analyst in the middle." },
    { "feature": "Activity is fast. Quality isn't.", "benefit": "Call counts are the easy number. Milo tells you which calls are actually moving deals." },
    { "feature": "Catch the leak before the quarter", "benefit": "When a deal slips in the top 10, Milo flags it in Slack before it hits the pipeline dashboard." }
  ],
  "recommendedTier": "growth",
  "customAddOns": [],
  "relevantCaseStudy": {
    "company": "TechCorp (SaaS)",
    "result": "Reduced reporting time from 3 days to 4 hours. BI team backlog down 80%."
  },
  "ctaText": "Book a 30-min demo",
  "ctaUrl": "https://cal.com/milo"
}
```

**Tone rules:**
- heroQuote must reference their specific business (not generic)
- clientQuestions must feel hyper-specific — 6 questions, each grounded in the transcript
- keyMetrics: use numbers from the client's world; if unknown, use Milo's platform stats
- solutionHighlights: 3, outcome-first, quantified

**Step 3 — Publish**
Run this command from the project root:

```bash
echo '<PROPOSAL_JSON>' | node --env-file=.env.local scripts/publish.mjs
```

Where `<PROPOSAL_JSON>` is:
```json
{
  "brand": { "primaryColor": "...", "accentColor": "...", "secondaryColor": "...", "fontFamily": "...", "logoUrl": "...", "clientName": "...", "clientUrl": "..." },
  "content": { ...the generated content JSON... }
}
```

**Step 4 — Return URL**
The script prints the URL. Give it to Anu. Done.

---

## Updating an existing proposal

If Anu says "change the headline" or "update the pricing" on an existing proposal:

1. Read `proposals/<slug>.json`
2. Apply the changes to the JSON
3. Re-run the publish script with the updated JSON (include the `slug` field so it updates in place):
   ```bash
   echo '<UPDATED_JSON_WITH_SLUG>' | node --env-file=.env.local scripts/publish.mjs
   ```
4. The same URL is preserved — no new link needed.

---

## Deploying to Vercel (one-time, CTO does this)

1. Push this repo to GitHub
2. Connect GitHub repo to Vercel at vercel.com
3. Add these environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_BASE_URL=https://proposals.milo.ai` (or Vercel URL)
4. Add Upstash Redis from Vercel Marketplace (free tier)
5. Optional: connect `proposals.milo.ai` domain in Vercel settings

After deploy, every proposal URL will be: `https://milo-proposal.vercel.app/<slug>`

---

## Key files

| File | Purpose |
|---|---|
| `components/ProposalView.tsx` | Client-facing proposal page (what clients see) |
| `app/proposals/[slug]/page.tsx` | Next.js route that serves the proposal |
| `scripts/publish.mjs` | Script I run to save + publish a proposal |
| `proposals/*.json` | Local backup of every proposal |
| `lib/redis.ts` | Redis client (falls back to in-memory if not configured) |
| `.env.local` | API keys — never commit this |
