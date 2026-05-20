"use client";

import { useState } from "react";
import type { Proposal } from "@/types/proposal";
import { PRICING_TIERS } from "@/types/proposal";

const MILO_LOGO = "https://framerusercontent.com/images/6CxE8i0ipM3Kf86VeCuaSMk9dU.png";

// Decide if text on top of this color should be black or white
function textOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#000000" : "#ffffff";
}

interface Props {
  proposal: Proposal;
  onPublished?: (url: string) => void;
}

export default function ProposalPreview({ proposal, onPublished }: Props) {
  const { brand, content } = proposal;
  const tier = PRICING_TIERS[content.recommendedTier];
  const accent = brand.primaryColor;           // client brand color
  const accentText = textOn(accent);           // black or white on top of accent
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(proposal.webflowUrl ?? "");
  const [error, setError] = useState("");

  async function handlePublish() {
    setPublishing(true);
    setError("");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: proposal.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { webflowUrl } = await res.json();
      setPublishedUrl(webflowUrl);
      onPublished?.(webflowUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="w-full" style={{ fontFamily: brand.fontFamily || "Inter, sans-serif" }}>

      {/* ── Publish bar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Proposal for {brand.clientName}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${publishedUrl ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            {publishedUrl ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {publishedUrl ? (
            <>
              <button onClick={() => navigator.clipboard.writeText(publishedUrl)} className="text-sm text-blue-600 hover:underline">Copy link</button>
              <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Open live page ↗</a>
            </>
          ) : (
            <button onClick={handlePublish} disabled={publishing} className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {publishing ? "Publishing…" : "Publish to Webflow →"}
            </button>
          )}
        </div>
      </div>
      {error && <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* ── SECTION 1: Hero — black bg ── */}
      <section className="bg-black px-10 pt-8 pb-16">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-16">
          <img src={MILO_LOGO} alt="Milo" className="h-6 object-contain brightness-0 invert" />
          <div className="text-gray-500 text-xs uppercase tracking-widest">Prepared for {brand.clientName}</div>
          {brand.logoUrl
            ? <img src={brand.logoUrl} alt={brand.clientName} className="h-6 object-contain brightness-0 invert" />
            : <span className="text-white text-sm font-bold">{brand.clientName}</span>
          }
        </div>

        {/* Tag */}
        <div className="inline-flex items-center gap-2 border px-3 py-1 rounded-full mb-8" style={{ borderColor: accent }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>Milo for {brand.clientName}</span>
        </div>

        {/* Hero quote */}
        <h1 className="text-5xl font-black text-white leading-tight max-w-3xl mb-6" style={{ fontWeight: 900 }}>
          {content.heroQuote.split(/([\w\s]+\?)/).map((part, i) =>
            part.endsWith("?") || i === 1
              ? <span key={i} style={{ color: accent }}>{part}</span>
              : part
          )}
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">{content.heroSubtext}</p>

        {/* CTA */}
        <a href={content.ctaUrl} target="_blank" rel="noopener noreferrer"
          className="inline-block text-sm font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-opacity mb-16"
          style={{ backgroundColor: accent, color: accentText }}>
          {content.ctaText}
        </a>

        {/* Key metrics bar */}
        <div className="border-t border-gray-800 pt-8 grid grid-cols-3 gap-8">
          {content.keyMetrics.map((m, i) => (
            <div key={i}>
              <div className="text-3xl font-black text-white">{m.value}</div>
              <div className="text-gray-500 text-sm mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: Questions — dark bg ── */}
      <section className="bg-gray-950 px-10 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: accent + "22", color: accent }}>With Milo</span>
          </div>
          <h2 className="text-4xl font-black text-white mt-4 mb-2">
            Questions that should take <span style={{ color: accent }}>30 seconds.</span>
          </h2>
          <p className="text-gray-500 mb-10 max-w-xl">
            Every question {brand.clientName} asks, every answer Milo gives. In plain English, in Slack or on mobile. No tickets. No waiting.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {content.clientQuestions.map((q, i) => (
              <div key={i} className="rounded-xl p-5" style={{ backgroundColor: "#111111" }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>{q.category}</div>
                <p className="text-gray-300 text-sm leading-relaxed">{q.question}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: How it works — accent bg ── */}
      <section className="px-10 py-16" style={{ backgroundColor: accent }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: accentText === "#000000" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)", color: accentText }}>The product</span>
          </div>
          <h2 className="text-4xl font-black mb-2" style={{ color: accentText }}>
            Ask the question.<br /><span className="underline decoration-2">Get the answer.</span>
          </h2>
          <p className="mb-12 max-w-lg opacity-70 text-lg" style={{ color: accentText }}>
            {brand.clientName} teams can ask questions in plain English, in Slack or on mobile. No schema. No waiting.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.solutionHighlights.map((s, i) => (
              <div key={i}>
                <div className="text-5xl font-black opacity-20 mb-3" style={{ color: accentText }}>0{i + 1}</div>
                <h3 className="text-xl font-black mb-2" style={{ color: accentText }}>{s.feature}</h3>
                <p className="opacity-70 text-sm leading-relaxed" style={{ color: accentText }}>{s.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: No headcount — white bg ── */}
      <section className="bg-white px-10 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-gray-900 mb-2">
            A 24/7 sales analyst.<br /><span style={{ color: accent }}>Without the headcount.</span>
          </h2>
          <p className="text-gray-500 mb-12 max-w-lg">No BI tickets. No analyst backlog. No waiting for Friday's report.</p>

          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "No BI tickets", body: "Ask the question. Get the answer. No spreadsheet, no Jira ticket, no analyst in the middle." },
              { icon: "🔗", title: "Connects to your stack", body: "Salesforce, HubSpot, Snowflake, BigQuery, Postgres — if you use it, Milo connects to it." },
              { icon: "🔒", title: "Built for regulated platforms", body: "SOC 2 Type II, ISO 27001, GDPR. Zero-trust architecture. Deployed in days." },
            ].map((f, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-6">
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Personalized — accent bg ── */}
      <section className="px-10 py-16" style={{ backgroundColor: accent }}>
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-12">
          <div className="flex-1">
            <h2 className="text-4xl font-black mb-4" style={{ color: accentText }}>
              If you were{" "}
              <span className="px-2 py-0.5 rounded" style={{ backgroundColor: accentText, color: accent }}>
                {content.contactName}
              </span>
              ,<br />what would you want to ask?
            </h2>
            <p className="opacity-70 text-lg mb-6" style={{ color: accentText }}>
              Who and where. What's going right and what's going wrong. What's going to happen in the next 30 days. Milo pushes the questions you'd ask before you've thought to ask.
            </p>
            <p className="opacity-60 text-sm" style={{ color: accentText }}>
              One interface. Every product, every seller, every deal, every advertiser. Ask it anything. It'll answer matters. Milo pushes the next one to you before you've thought to ask.
            </p>
          </div>
          {/* Ghost / client logo as decorative element */}
          <div className="flex-shrink-0 opacity-20">
            {brand.logoUrl
              ? <img src={brand.logoUrl} alt="" className="w-32 h-32 object-contain" style={{ filter: accentText === "#000000" ? "none" : "brightness(0) invert(1)" }} />
              : <div className="w-32 h-32 rounded-full border-4" style={{ borderColor: accentText }} />
            }
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Proof — white bg ── */}
      <section className="bg-white px-10 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-gray-900 mb-10">Built two ways.<br />You choose where data lives.</h2>
          <div className="grid grid-cols-2 gap-6 mb-16">
            {[
              { label: "Direct connect", desc: "Milo connects directly to your data sources. No data leaves your environment. Fastest time to value.", tag: "Most popular" },
              { label: "Hosted", desc: "We manage the infrastructure. Ideal for teams who want zero ops overhead and maximum speed.", tag: null },
            ].map((opt, i) => (
              <div key={i} className="border-2 border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded" style={{ backgroundColor: accent, color: accentText }}>{opt.label}</span>
                  {opt.tag && <span className="text-xs text-gray-400">{opt.tag}</span>}
                </div>
                <p className="text-gray-600 text-sm">{opt.desc}</p>
              </div>
            ))}
          </div>

          {/* Case study */}
          <div className="rounded-2xl p-8 bg-gray-950 text-white">
            <div className="text-gray-500 text-xs uppercase tracking-widest mb-4">Proof it works</div>
            <p className="text-2xl font-bold mb-4">"{content.relevantCaseStudy.result}"</p>
            <p className="text-gray-400 text-sm">— {content.relevantCaseStudy.company}</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Pricing — white bg ── */}
      <section className="bg-gray-50 px-10 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-gray-900 mb-2">The offer for {brand.clientName}.</h2>
          <p className="text-gray-500 mb-10">Recommended based on your team's needs.</p>
          <div className="bg-white border-2 rounded-2xl p-8" style={{ borderColor: accent }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>Recommended</div>
                <h3 className="text-2xl font-black text-gray-900">{tier.label}</h3>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">{tier.price}</div>
                {content.recommendedTier !== "enterprise" && <div className="text-gray-400 text-sm">billed monthly</div>}
              </div>
            </div>
            <ul className="space-y-2 mb-6">
              {tier.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <span style={{ color: accent }}>✓</span> {f}
                </li>
              ))}
            </ul>
            {content.customAddOns.length > 0 && (
              <div className="border-t border-dashed border-gray-200 pt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Custom add-ons for {brand.clientName}</p>
                <ul className="space-y-1">
                  {content.customAddOns.map((a, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span style={{ color: accent }}>+</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: Final CTA — black bg ── */}
      <section className="bg-black px-10 py-20 text-center">
        <img src={MILO_LOGO} alt="Milo" className="h-8 object-contain brightness-0 invert mx-auto mb-8" />
        <h2 className="text-4xl font-black text-white mb-4">Ready to get started?</h2>
        <p className="text-gray-400 mb-8">Book 30 minutes. We'll answer every question {content.contactName} has — live.</p>
        <a href={content.ctaUrl} target="_blank" rel="noopener noreferrer"
          className="inline-block text-sm font-bold px-10 py-4 rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: accent, color: accentText }}>
          {content.ctaText}
        </a>
      </section>
    </div>
  );
}
