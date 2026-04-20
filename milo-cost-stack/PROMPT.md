# Build: Milo — Carried Cost & Exposure

## The brief in one paragraph

A one-page tool I fill in live on sales calls. Prospect watches me type five costs they're already carrying — a hiring gap, unused tools, data engineering debt, AI exposure, governance gap. The total climbs into six figures. Milo's £18k sits beside it. The ratio is the pitch.

This tool has no visitors, no funnel, no CTAs. It lives to be looked at in silence for ten seconds during a meeting. Build it like that's what it's for.

## The feel I want you to chase

Imagine someone handed you a single page torn from the annual report of a Big Four audit firm. Cream paper, a hint of grain. Heavy black ink. Serif numbers set enormous — almost absurdly big, like the front of the Financial Times when something important has happened. Small monospace captions beneath them, disciplined as footnotes. A double hairline above the grand total, the way accountants have drawn it for a century.

Then imagine at the bottom of that page, someone has painted a horizontal tape at full viewport width in matte black — and at the very end of it, where the tape nearly runs out, a single electric-blue sliver. That sliver is Milo.

The prospect's eye travels: numbers → total → tape → sliver → back to the £18k. Three seconds. That is the pitch. Your job is to make that three seconds land.

The reference frame is a published document, not a web app. Think FT weekend, Monocle, Swiss editorial posters, an investment bank's year-end analyst note. Not a dashboard. Not a calculator. Not a form.

## Palette (exact values, non-negotiable)

- Paper: `#F4F1EB` — warm cream, slightly warmer than newsprint
- Ink: `#0A0A0A` — near-black, never pure black
- Muted ink: `#6B6560` — for captions, dates, helper text
- Faint ink: `#B8B3AC` — for placeholders and decorative hairlines
- Milo blue: `#4361EE` — sacred. Used exactly three times on the page: the Milo amount, the tape sliver, and the italicised multiple (`7.5×`). Nowhere else. If you find yourself reaching for it a fourth time, you're wrong.

Apply a paper grain over the body using an inline SVG data URL at ~3–4% opacity. This matters — it's the difference between "digital tool" and "printed document".

## Type (all free on Google Fonts)

- **Instrument Serif**, 400, italics allowed — every title, every number, every total. This is the voice of the document.
- **IBM Plex Mono**, 400/500 — every label, kicker, date, reference number, footer. Uppercase, 0.12em letter-spacing, 10.5–11px.
- **IBM Plex Sans**, 400 — helper text under inputs, nothing else. 13–14px.

Every number on the page uses `font-variant-numeric: tabular-nums`. Every big serif number carries `letter-spacing: -0.025em` or tighter. The grand total should be ≥200px at desktop. The eye should land there first.

## Layout — what the page looks like, top to bottom

Single column. Full viewport width. ~7vw horizontal padding on desktop, ~5vw on mobile.

**1. Meta strip.** A thin top bar with the Milo logo on the left (28px tall, inverted to black with `filter: invert(1) brightness(0.1)` since the source is white), a small monospace reference code in the middle (`REF · 2026-04-20 · 0001` — generate from today's date), and on the right two editable mono fields: a company name input (placeholder "Company name · optional") and today's date auto-populated ("20 April 2026", editable). Full-width thin black hairline below the strip.

**2. Document head.** Sits 10vh below the meta strip. A mono kicker in caps: `CONFIDENTIAL · PREPARED FOR [company or "REVIEW"]`. Below it, the title in Instrument Serif, 84–108px: **Carried cost and exposure**. Below that, italic serif subtitle at 22–28px: *"As carried today, against Milo's annual cost."*

**3. Five line items.** Each a grid row `[number | title + helper | amount input]` with a 1px black hairline above. Row padding ~3.4vh top and bottom.
- Number: mono caps, faint, e.g. `01`
- Title: Instrument Serif at 36–42px
- Helper: IBM Plex Sans at 13px in muted ink, below the title
- Amount: right-aligned text input, no border, just a bottom hairline that darkens on focus. Serif 56–72px. Tabular nums. Placeholder is a tiny italic mono `£0` so empty state doesn't collapse visually.

The five items in order:
  01 — **The hire you can't make** · "Fully-loaded annual cost of the open analyst role."
  02 — **The tools your team doesn't use** · "Annual spend on Power BI, Tableau, Metabase — including seats nobody logs into."
  03 — **The data work that never gets done** · "What a consultancy would charge to connect your stack properly."
  04 — **The AI exposure nobody's tracking** · "ICO fines, SOC 2 remediation, failed AI policy questionnaires."
  05 — **The governance gap the board will ask about** · "EU AI Act, audit findings, enterprise deals blocked by missing AI policy."

**4. Grand total — the monument.** A 3px double black rule above (genuine double rule, not two singles — use `border-top: 3px double #0A0A0A`). A small mono kicker on the left: `TOTAL CARRIED`. The value on the right, 200px+ Instrument Serif, line-height 0.92, letter-spacing -0.035em, tabular nums. This number dominates the page. Everything else is in service to this.

**5. Milo counterweight.** Thin Milo-blue hairline above. Mono kicker on the left: `MILO ANNUAL COST` in Milo blue. Value on the right: `£18,000` in Instrument Serif at 72px, in Milo blue.

**6. The multiple.** Only appears when total > £18,000. Italic Instrument Serif at 24–28px, right-aligned: *"You're carrying **7.5×** Milo's cost."* The number is in Milo blue. Reserve the vertical space with `min-height` so the layout doesn't jump when it appears.

**7. The tape — the moment.** Full-bleed section that extends past the body padding to the viewport edges. Dark background (use `#0A0A0A`), subtle paper grain overlay. Inside:
   - Top left, a tiny mono kicker in cream: `THE RATIO · AT SCALE`
   - Below, a horizontal bar 72–140px tall spanning the full viewport. Three segments, flex layout:
     - Cream/off-white bar, flex-basis proportional to `carried / (carried + 18000)` × 100%
     - Milo-blue bar, flex-basis proportional to `18000 / (carried + 18000)` × 100%, min-width 3px so it's always visible
     - Remaining space, diagonal hatching at low opacity (repeating-linear-gradient), represents the empty canvas before values are entered
   - 2px gap between the cream and blue segments — a seam, not a join
   - Below the bar: mono labels, cream on the left `CARRIED · £150,000`, Milo-blue on the right `MILO · £18,000`
   - Bars animate their flex-basis over 360ms with `cubic-bezier(0.22, 1, 0.36, 1)`. No bounce, no spring, no delay.

**8. Forcing-function line.** Thin black hairline above, only appears when total > £100,000. Mono kicker on left `COST OF DELAY`. Right-aligned italic Instrument Serif at 24–28px: *"Delaying three months adds **£37,500** to carried cost."* Number in Milo blue.

**9. Footer.** Single mono strip, thin black hairline above: `MILO · CONFIDENTIAL · NOT FOR DISTRIBUTION`. One line. Done.

## Behaviour

- Every keystroke in an amount field reformats live to `£70,000`. Use `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })`. Strip commas, pound signs, and spaces on input so pasting `£70,000` or `70,000` or `70000 ` all parse correctly.
- Every keystroke recalculates: total, multiple (`total / 18000`, 1 decimal, shown when total > 18000), tape widths, forcing-function (shown when total > 100000, value is `total / 4` rounded).
- Every keystroke updates the URL using `history.replaceState` with short query keys: `?c=Acme&d=2026-04-20&v1=70000&v2=18000&v3=35000&v4=12000&v5=15000`. Omit empty fields. On page load, parse the URL and populate all fields — this is how the tool is shared in follow-up emails.
- Company name input prepends to the kicker. Date input accepts either `20 April 2026` or `2026-04-20`. Default date is today.
- The multiple and forcing lines fade in (opacity 0 → 1, 200ms) when their conditions are first met. No other animations beyond this and the tape bars.

## Print

A proper `@media print` stylesheet. Keep the cream paper background (use `-webkit-print-color-adjust: exact`). Keep the tape section (it's essential). Remove input hairlines so the printed page reads as finished. A4 portrait, 12mm margins. One page if possible — let things compress naturally.

## Technical constraints

- Single file: `/Users/tompickett/milo-gtm/tools/cost-stack/index.html`
- Vanilla HTML, vanilla CSS in one `<style>` block, vanilla JS in one `<script>` block
- No frameworks, no Tailwind, no libraries, no build step
- Google Fonts via preconnect + single stylesheet link
- CSS custom properties for the full palette
- Target under 500 lines total
- Copy the logo from `/Users/tompickett/milo-gtm/White_Logo.png` into `./assets/logo.png`. Apply `filter: invert(1) brightness(0.1)` to make it black on cream.

## Three rules for staying out of the Claude-default trap

1. **Cream, not dark.** If your first instinct is to go dark-mode-editorial, stop. That's every AI-built tool from the last eighteen months. This is a printed financial document.
2. **No decoration, no corners, no shadows.** No `border-radius`, no `box-shadow`, no gradients, no icons, no emojis, no illustrations, no marketing copy, no "Get started" buttons. Every decorative impulse is wrong for this piece.
3. **Typography is the design.** The page should have almost no UI. Just type set beautifully on paper, with one moment of visual drama (the tape). If you catch yourself designing a component, you've lost the plot.

## How I'll know it worked

Fill in these test values after the build: `v1=70000, v2=18000, v3=35000, v4=12000, v5=15000`. Expected state:

- Total: £150,000
- Multiple: 8.3×
- Forcing line: £37,500
- Tape: cream segment ~89% of viewport, Milo sliver ~11%

The real test: if a stranger glanced at the page at that state for one second, they should be able to describe what they saw as "a huge number, a small blue amount below it, and a long black bar at the bottom ending in a tiny blue tip." If they can't, iterate the visual hierarchy.

## Build order

1. Copy the logo into `./assets/logo.png`
2. Scaffold the HTML structure
3. Write the CSS — palette, type, grid, the tape, print styles
4. Wire up the JS — formatting, totals, URL state, fade-ins
5. Fill in the test values above, look at it, adjust until the monument-total and the tape both land

Report back when done with the path. Do not push anywhere. I'll open the file and decide.
