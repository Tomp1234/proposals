"use client";

import { useState } from "react";
import type { BrandTokens, Proposal } from "@/types/proposal";
import { PRICING_TIERS } from "@/types/proposal";
import BrandPreview from "./BrandPreview";

function resizeImageToBase64(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}

const STEPS = ["Client Info", "Transcript", "Pricing", "Generate"] as const;
type Step = 0 | 1 | 2 | 3;

interface Props {
  onProposalReady: (proposal: Proposal) => void;
}

export default function ProposalForm({ onProposalReady }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [clientName, setClientName] = useState("");
  const [clientUrl, setClientUrl] = useState("");
  const [clientHtml, setClientHtml] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [transcript, setTranscript] = useState("");
  const [ctaUrl, setCtaUrl] = useState("https://cal.com/milo");
  const [addOns, setAddOns] = useState<string[]>([""]);
  const [brand, setBrand] = useState<BrandTokens | null>(null);
  const [scraping, setScraping] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  async function handleScrape() {
    if (!clientName || !clientHtml) return;
    setScraping(true);
    setError("");
    try {
      let screenshotBase64: string | null = null;
      let screenshotMime: string | null = null;

      if (screenshotFile) {
        screenshotBase64 = await resizeImageToBase64(screenshotFile, 1400, 0.75);
        screenshotMime = "image/jpeg";
      }

      const res = await fetch("/api/scrape-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, clientUrl, html: clientHtml, screenshotBase64, screenshotMime }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setBrand(await res.json());
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract brand");
    } finally {
      setScraping(false);
    }
  }

  async function handleGenerate() {
    if (!brand) return;
    setGenerating(true);
    setError("");
    try {
      const cleanAddOns = addOns.filter((a) => a.trim());
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, brand, customAddOns: cleanAddOns, ctaUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const proposal: Proposal = await res.json();
      onProposalReady(proposal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate proposal");
    } finally {
      setGenerating(false);
    }
  }

  function addAddOn() {
    setAddOns((prev) => [...prev, ""]);
  }

  function updateAddOn(i: number, val: string) {
    setAddOns((prev) => prev.map((a, idx) => (idx === i ? val : a)));
  }

  function removeAddOn(i: number) {
    setAddOns((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 transition-colors ${
              i < step ? "bg-milo-blue border-milo-blue text-white" :
              i === step ? "border-milo-blue text-milo-blue bg-white" :
              "border-gray-200 text-gray-400 bg-white"
            }`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:block ${i === step ? "text-gray-900" : "text-gray-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < step ? "bg-milo-blue" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Step 0 — Client Info */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Client information</h2>
            <p className="text-gray-500 text-sm">Paste their landing page HTML and upload a screenshot — Claude will extract exact colors and fonts.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-milo-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="url"
                value={clientUrl}
                onChange={(e) => setClientUrl(e.target.value)}
                placeholder="https://acmecorp.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-milo-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* Screenshot upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Landing page screenshot <span className="text-gray-400 font-normal">(recommended — gives Claude Vision the exact colors)</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-milo-blue transition-colors overflow-hidden">
              {screenshotPreview ? (
                <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-48 object-cover object-top" />
              ) : (
                <div className="py-8 text-center">
                  <div className="text-3xl mb-2">🖼️</div>
                  <p className="text-sm text-gray-500">Click to upload screenshot</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, or WebP</p>
                </div>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleScreenshotChange} className="hidden" />
            </label>
            {screenshotPreview && (
              <button onClick={() => { setScreenshotFile(null); setScreenshotPreview(""); }} className="text-xs text-gray-400 hover:text-red-500 mt-1">
                Remove screenshot
              </button>
            )}
          </div>

          {/* HTML paste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Landing page HTML <span className="text-gray-400 font-normal">(right-click → View Page Source, select all, paste here)</span>
            </label>
            <textarea
              value={clientHtml}
              onChange={(e) => setClientHtml(e.target.value)}
              placeholder="<!DOCTYPE html>..."
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-milo-blue"
            />
          </div>

          <button
            onClick={handleScrape}
            disabled={!clientName || !clientHtml || scraping}
            className="w-full bg-milo-blue text-white rounded-lg py-3 font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {scraping ? (screenshotFile ? "Analyzing screenshot with Claude Vision…" : "Extracting brand from HTML…") : "Extract brand & continue →"}
          </button>
        </div>
      )}

      {/* Step 1 — Transcript */}
      {step === 1 && brand && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Brand extracted</h2>
            <p className="text-gray-500 text-sm mb-4">Here's what we found from {brand.clientUrl}.</p>
            <BrandPreview brand={brand} onUpdate={setBrand} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Demo transcript</label>
            <p className="text-xs text-gray-400 mb-2">Paste the full transcript from the call.</p>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your demo transcript here…"
              rows={12}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-milo-blue font-mono"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-3 text-sm hover:bg-gray-50 transition-colors">
              ← Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!transcript.trim()}
              className="flex-1 bg-milo-blue text-white rounded-lg py-3 font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Pricing */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Pricing & add-ons</h2>
            <p className="text-gray-500 text-sm">Claude will auto-select the best tier, but you can add custom line items.</p>
          </div>

          {/* Tier overview */}
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(PRICING_TIERS) as [string, typeof PRICING_TIERS[keyof typeof PRICING_TIERS]][]).map(([key, tier]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{tier.label}</div>
                <div className="text-sm font-bold text-gray-900 mt-0.5">{tier.price}</div>
                <ul className="mt-2 space-y-0.5">
                  {tier.features.slice(0, 3).map((f) => (
                    <li key={f} className="text-xs text-gray-500">• {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom add-ons <span className="text-gray-400 font-normal">(optional)</span></label>
            {addOns.map((addOn, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={addOn}
                  onChange={(e) => updateAddOn(i, e.target.value)}
                  placeholder="e.g. Custom Salesforce connector, 90-day onboarding"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-milo-blue"
                />
                {addOns.length > 1 && (
                  <button onClick={() => removeAddOn(i)} className="text-gray-400 hover:text-red-500 transition-colors px-2">✕</button>
                )}
              </div>
            ))}
            <button onClick={addAddOn} className="text-sm text-milo-blue hover:underline">
              + Add another
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA button link</label>
            <input
              type="url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://cal.com/milo/demo"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-milo-blue"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-3 text-sm hover:bg-gray-50 transition-colors">
              ← Back
            </button>
            <button
              onClick={() => { setStep(3); handleGenerate(); }}
              className="flex-1 bg-milo-blue text-white rounded-lg py-3 font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Generate proposal →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Generating */}
      {step === 3 && (
        <div className="text-center py-16 space-y-4">
          {generating ? (
            <>
              <div className="w-12 h-12 border-4 border-milo-blue border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 font-medium">Generating your personalized proposal…</p>
              <p className="text-gray-400 text-sm">Analyzing transcript and crafting content for {clientName}</p>
            </>
          ) : error ? (
            <>
              <div className="text-4xl">⚠️</div>
              <p className="text-red-600 font-medium">{error}</p>
              <button onClick={() => { setStep(2); setError(""); }} className="text-milo-blue hover:underline text-sm">
                ← Go back and retry
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
