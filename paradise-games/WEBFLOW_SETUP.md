# Webflow Setup Guide

One-time setup before Composed Oasis can publish proposals.

---

## 1. Create a Webflow account

Sign up at webflow.com. You need a **CMS plan** or higher to use the CMS API and publish sites.

---

## 2. Create the Proposals site

1. In the Webflow dashboard, click **New site**
2. Name it `Milo Proposals`
3. Choose any blank template — you'll design it in the next steps

---

## 3. Create the CMS collection

1. Open the site in the **Designer**
2. Click **CMS** in the left panel → **+ New Collection**
3. Name it `Proposals`
4. Add the following fields:

| Field name | Type | Notes |
|---|---|---|
| `name` | Plain text | Auto-created as the item name |
| `slug` | Plain text | Auto-created |
| `primary-color` | Plain text | Hex value e.g. `#1A6BFF` |
| `secondary-color` | Plain text | Hex value |
| `accent-color` | Plain text | Hex value |
| `font-family` | Plain text | e.g. `Inter, sans-serif` |
| `client-logo-url` | Plain text | Full URL to client logo |
| `milo-logo-url` | Plain text | Full URL to milo.ai logo |
| `headline` | Plain text | H1 hero text |
| `subheadline` | Plain text | Hero subtitle |
| `pain-points` | Rich text | HTML from API |
| `solution-highlights` | Rich text | HTML from API |
| `pricing` | Rich text | HTML from API |
| `case-study` | Rich text | HTML from API |
| `cta-text` | Plain text | Button label |
| `cta-url` | Plain text | Button link |

---

## 4. Design the CMS template page

In the Designer, go to **Pages → Proposals Template** and build the proposal layout, binding each section to the CMS fields above.

**Critical: Dynamic theming**

In the **Page Settings** of the Proposals Template page, add this to the **Custom Code → Head** section:

```html
<style>
  :root {
    --brand-primary: {{wf{"path":"primary-color","type":"PlainText"}}};
    --brand-secondary: {{wf{"path":"secondary-color","type":"PlainText"}}};
    --brand-accent: {{wf{"path":"accent-color","type":"PlainText"}}};
    --brand-font: {{wf{"path":"font-family","type":"PlainText"}}};
  }
  body { font-family: var(--brand-font); }
</style>
```

Then use `var(--brand-primary)` for button backgrounds, section fills, etc.

**Sections to design (in order):**
1. **Hero** — client logo + milo logo | headline | subheadline | CTA button
2. **The Challenge** — pain-points rich text
3. **How Milo Solves It** — solution-highlights rich text
4. **Proof** — case-study rich text
5. **The Offer** — pricing rich text
6. **Next Steps** — CTA section with cta-text and cta-url

---

## 5. Get your API credentials

### API Token
1. Go to **Account Settings** (top-right avatar)
2. Click **Integrations → API access**
3. Generate a new token with **CMS read/write** and **Publish** scopes
4. Copy it to `WEBFLOW_API_TOKEN` in `.env.local`

### Site ID
1. Inside your site: **Settings → General**
2. Scroll to **Site ID** and copy it
3. Set `WEBFLOW_SITE_ID`

### Collection ID
1. In the Designer: **CMS → Proposals**
2. Open collection settings — the ID is in the URL or shown in the panel
3. Set `WEBFLOW_COLLECTION_ID`

---

## 6. Set a custom domain (optional but recommended)

1. **Settings → Publishing → Custom domain**
2. Add e.g. `proposals.milo.ai`
3. Point your DNS CNAME to `proxy.webflow.com`

Published proposal URLs will then be: `https://proposals.milo.ai/proposals/[client-slug]`

---

## 7. Add Upstash Redis storage

1. In your Vercel project dashboard, go to **Integrations → Browse Marketplace**
2. Search for **Upstash Redis** and install it
3. Create a Redis database and connect it to your project
4. Vercel auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into your env

---

Once all env vars are set, run `npm run dev` and generate your first proposal!
