import type { Proposal } from "@/types/proposal";
import { PRICING_TIERS } from "@/types/proposal";

const BASE = "https://api.webflow.com/v2";

function headers() {
  return {
    Authorization: `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
    "Content-Type": "application/json",
    accept: "application/json",
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function buildRichText(lines: string[]): string {
  return lines.map((l) => `<p>${l}</p>`).join("");
}

export async function publishToWebflow(proposal: Proposal): Promise<string> {
  const collectionId = process.env.WEBFLOW_COLLECTION_ID!;
  const siteId = process.env.WEBFLOW_SITE_ID!;

  const { brand, content } = proposal;
  const tier = PRICING_TIERS[content.recommendedTier];

  const questionsHtml = buildRichText(
    content.clientQuestions.map((q) => `<strong>${q.category}</strong>: ${q.question}`)
  );

  const solutionHtml = buildRichText(
    content.solutionHighlights.map((s) => `<strong>${s.feature}</strong>: ${s.benefit}`)
  );

  const metricsHtml = buildRichText(
    content.keyMetrics.map((m) => `<strong>${m.value}</strong> ${m.label}`)
  );

  const pricingHtml = [
    `<p><strong>Recommended: ${tier.label} — ${tier.price}</strong></p>`,
    ...tier.features.map((f) => `<p>✓ ${f}</p>`),
    ...(content.customAddOns.length
      ? [`<p><strong>Custom add-ons for ${brand.clientName}:</strong></p>`, ...content.customAddOns.map((a) => `<p>+ ${a}</p>`)]
      : []),
  ].join("");

  const caseStudyHtml = buildRichText([
    `<strong>${content.relevantCaseStudy.company}</strong>`,
    content.relevantCaseStudy.result,
  ]);

  const slug = slugify(brand.clientName) + "-" + Date.now().toString(36);

  const itemBody = {
    isArchived: false,
    isDraft: false,
    fieldData: {
      name: brand.clientName,
      slug,
      "primary-color": brand.primaryColor,
      "secondary-color": brand.secondaryColor,
      "accent-color": brand.accentColor,
      "font-family": brand.fontFamily,
      "client-logo-url": brand.logoUrl,
      "milo-logo-url": process.env.MILO_LOGO_URL ?? "https://framerusercontent.com/images/6CxE8i0ipM3Kf86VeCuaSMk9dU.png",
      headline: content.heroQuote,
      subheadline: content.heroSubtext,
      "contact-name": content.contactName,
      "client-questions": questionsHtml,
      "key-metrics": metricsHtml,
      "solution-highlights": solutionHtml,
      pricing: pricingHtml,
      "case-study": caseStudyHtml,
      "cta-text": content.ctaText,
      "cta-url": content.ctaUrl,
    },
  };

  // Create CMS item
  const createRes = await fetch(`${BASE}/collections/${collectionId}/items`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(itemBody),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Webflow create item failed: ${createRes.status} — ${err}`);
  }

  // Trigger site publish
  await fetch(`${BASE}/sites/${siteId}/publish`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ publishToWebflowSubdomain: true }),
  });

  // Build the expected live URL
  const siteRes = await fetch(`${BASE}/sites/${siteId}`, { headers: headers() });
  const siteData = await siteRes.json();
  const domain: string = siteData.customDomains?.[0]?.url ?? siteData.previewUrl ?? `${siteId}.webflow.io`;

  return `https://${domain}/proposals/${slug}`;
}
