import Anthropic from "@anthropic-ai/sdk";
import type { BrandTokens, ProposalContent, PricingTier } from "@/types/proposal";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ExtractedBrand {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string;
}

export async function extractBrandFromScreenshot(
  base64Image: string,
  mimeType: "image/png" | "image/jpeg" | "image/webp",
  htmlColors: { primaryColor: string; secondaryColor: string; accentColor: string; fontFamily: string; logoUrl: string }
): Promise<ExtractedBrand> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: base64Image },
          },
          {
            type: "text",
            text: `This is a screenshot of a client's website landing page. Extract their EXACT brand colors.

IMPORTANT RULES:
- If the hero/page background is dark or black, report it as-is (e.g. "#0a0a0a", "#111", "#1a1a2e"). Do NOT replace dark backgrounds with white.
- If the background is white or light gray, report that accurately too.
- The "primaryColor" should be the hero section background color (whatever it actually is — dark, light, or colorful).
- The "accentColor" should be the CTA button or highlighted link color (often a bright color like blue, green, orange, purple).
- The "secondaryColor" should be a supporting color (e.g. card backgrounds, section backgrounds).

HTML parser candidate colors (use as hints only — override based on what you actually see):
- primaryColor candidate: ${htmlColors.primaryColor}
- secondaryColor candidate: ${htmlColors.secondaryColor}
- accentColor candidate: ${htmlColors.accentColor}
- fontFamily candidate: ${htmlColors.fontFamily}

Steps:
1. Look at the large background area of the hero — what exact color is it? (could be black, dark navy, white, purple, etc.)
2. Find the most prominent CTA button — what color is it?
3. Find a secondary background section — what color is it?
4. What font family does the text look like?

Respond ONLY with valid JSON, no markdown:
{
  "primaryColor": "#xxxxxx",
  "secondaryColor": "#xxxxxx",
  "accentColor": "#xxxxxx",
  "fontFamily": "Font Name, sans-serif",
  "logoUrl": "${htmlColors.logoUrl}",
  "reasoning": "one sentence describing what you saw"
}`,
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const json = raw.replace(/^```json?\s*/m, "").replace(/\s*```$/m, "").trim();
  const parsed = JSON.parse(json);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reasoning: _r, ...brand } = parsed;
  return brand as ExtractedBrand;
}

// This system prompt is static and expensive — cache it
const SYSTEM_PROMPT = `You are a senior sales strategist for Milo.ai, an enterprise AI data analyst platform. Your job is to write bold, editorial proposal content from demo transcripts — modelled on the best sales proposals in the industry.

## About Milo.ai
Milo is an AI data analyst that lets business executives ask questions in natural language and get answers from their databases and 700+ SaaS tools in minutes — no SQL, no waiting on analysts.

Key differentiators:
- Conversational querying ("Ask like a colleague")
- Connects to 700+ tools (Salesforce, HubSpot, Postgres, BigQuery, etc.)
- Real-time dashboards and automated alerts
- Enterprise security: SOC 2 Type II, ISO 27001, GDPR, zero-trust architecture
- Deployed in days, not months

## Standard Case Studies (pick the most relevant)
1. **TechCorp (SaaS)**: Reduced reporting time from 3 days to 4 hours. "We cut our BI team's backlog by 80%."
2. **RetailCo (E-commerce)**: Identified $2.1M in inventory inefficiency in first week. Real-time restock alerts now prevent stockouts.
3. **FinanceGroup (Financial Services)**: Passed compliance audit in 2 weeks using Milo's audit-trail exports. Zero analyst overtime.
4. **HealthStart (Healthcare)**: Patient outcome dashboards live in 6 days. HIPAA-compliant, zero IT tickets.

## Pricing Tiers
- **Starter** ($2,500/mo): 3 data sources, NL querying, weekly reports, email support
- **Growth** ($6,500/mo): 15 data sources, real-time dashboards, alerts, Slack/Teams, dedicated CSM
- **Enterprise** (Custom): Unlimited sources, on-premise option, SSO/SAML, white-glove onboarding, SLA

## Design Reference
The proposals use a bold editorial design: black hero → client brand color section → white section → client brand color section. Think magazine cover, not PowerPoint.

## Tone Guidelines
- Punchy and direct — short sentences, active voice
- Use the client's exact language and industry jargon from the transcript
- heroQuote should feel like a question the client's CEO would ask in a board meeting
- clientQuestions should be real business questions, not generic — make them feel "how did you know we ask this?"
- keyMetrics should be real numbers from the client's world (not Milo's), like their DAUs, revenue, team size
- solutionHighlights: lead with the outcome, not the feature`;

export async function generateProposalContent(
  transcript: string,
  brand: BrandTokens,
  customAddOns: string[],
  ctaUrl: string
): Promise<ProposalContent> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Generate a personalized proposal for ${brand.clientName} (${brand.clientUrl}).

DEMO TRANSCRIPT:
${transcript}

CUSTOM ADD-ONS TO MENTION (if any): ${customAddOns.length ? customAddOns.join(", ") : "none"}

Respond with ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "heroQuote": "string — a bold, punchy question or statement from the client's world. Format: \\"How well are we [doing X]?\\" Should be something a C-suite would ask. Use their actual product/business terminology.",
  "heroSubtext": "string — 1-2 sentences that set up Milo as the answer. Keep it tight.",
  "keyMetrics": [
    { "value": "string — a real number from their business e.g. '850M+' or '$2.4B'", "label": "string — what it measures, lowercase, e.g. 'monthly active users'" },
    { "value": "string", "label": "string" },
    { "value": "string", "label": "string" }
  ],
  "contactName": "string — first name of the main person from the transcript, or 'You' if unknown",
  "clientQuestions": [
    { "category": "string — 2-3 word topic in caps e.g. 'Q4 REVENUE'", "question": "string — a specific, real question they'd ask Milo. Should feel like it came straight from the transcript." },
    { "category": "string", "question": "string" },
    { "category": "string", "question": "string" },
    { "category": "string", "question": "string" },
    { "category": "string", "question": "string" },
    { "category": "string", "question": "string" }
  ],
  "solutionHighlights": [
    { "feature": "string — short name", "benefit": "string — outcome-first, quantified where possible" },
    { "feature": "string", "benefit": "string" },
    { "feature": "string", "benefit": "string" }
  ],
  "recommendedTier": "starter" | "growth" | "enterprise",
  "customAddOns": ["string"],
  "relevantCaseStudy": { "company": "string", "result": "string — one punchy sentence" },
  "ctaText": "string — short, action-oriented e.g. 'Book a 30-min demo'",
  "ctaUrl": "${ctaUrl}"
}

Rules:
- heroQuote MUST reference their specific business (e.g. Sponsored Snaps, not generic "sales data")
- clientQuestions must feel hyper-specific — someone reading should think "how did they know we ask this?"
- keyMetrics: use numbers from the transcript or their known business scale; if unknown, use Milo platform stats
- Pick the most relevant case study from the standard set`,
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  // Strip accidental markdown fences
  const json = raw.replace(/^```json?\s*/m, "").replace(/\s*```$/m, "").trim();
  return JSON.parse(json) as ProposalContent;
}

export type { PricingTier };
