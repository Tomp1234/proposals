export interface BrandTokens {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string;
  clientName: string;
  clientUrl: string;
}

export interface SolutionHighlight {
  feature: string;
  benefit: string;
}

export interface CaseStudy {
  company: string;
  result: string;
}

export interface KeyMetric {
  value: string;   // e.g. "850M+"
  label: string;   // e.g. "monthly active users"
}

export interface ClientQuestion {
  category: string; // e.g. "Q4 REVENUE"
  question: string;
}

export type PricingTier = "starter" | "growth" | "enterprise";

export interface DemoResponse {
  type: "bar" | "gap" | "line" | "table" | "funnel" | "status";
  text: string;
  barData?:    { label: string; pct: number; delta: string; positive: boolean }[];
  gapData?:    { label: string; ship: number; sell: number }[];
  linePoints?: number[];
  tableData?:  { a: string; b: string; overlap: string; action: string }[];
  funnelData?: { label: string; value: string; pct: number }[];
  statusData?: { source: string; status: "ready" | "warning"; detail: string }[];
}

export interface ProposalContent {
  heroQuote: string;               // Bold hook — a question from their world
  heroSubtext: string;             // 1-2 sentences below the quote
  keyMetrics: KeyMetric[];         // 3 stats relevant to the client's business
  contactName: string;             // First name of the main person from the transcript
  clientQuestions: ClientQuestion[]; // 6 questions they'd want answered instantly with Milo
  solutionHighlights: SolutionHighlight[];
  recommendedTier: PricingTier;
  customPrice?: string;
  customAddOns: string[];
  relevantCaseStudy: CaseStudy;
  ctaText: string;
  ctaUrl: string;
  demoResponses?: DemoResponse[];  // Per-client demo data for the interactive laptop section
}

export interface Proposal {
  id: string;
  createdAt: string;
  status: "draft" | "published";
  webflowUrl?: string;
  brand: BrandTokens;
  content: ProposalContent;
  transcript: string;
}

export const PRICING_TIERS: Record<PricingTier, { label: string; price: string; features: string[] }> = {
  starter: {
    label: "Starter",
    price: "$2,500/mo",
    features: [
      "Up to 3 data sources",
      "Natural language querying",
      "Weekly automated reports",
      "Email support",
    ],
  },
  growth: {
    label: "Growth",
    price: "$6,500/mo",
    features: [
      "Up to 15 data sources",
      "Real-time dashboards",
      "Custom alert rules",
      "Slack/Teams integration",
      "Dedicated success manager",
    ],
  },
  enterprise: {
    label: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited data sources",
      "On-premise deployment option",
      "SOC 2 + ISO 27001 compliant",
      "SSO / SAML",
      "SLA guarantee",
      "White-glove onboarding",
    ],
  },
};
