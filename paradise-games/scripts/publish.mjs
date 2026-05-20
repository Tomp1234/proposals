#!/usr/bin/env node
/**
 * Composed Oasis — Proposal Publisher
 *
 * Usage (Claude runs this):
 *   node --env-file=.env.local scripts/publish.mjs < proposal.json
 *
 * Input: JSON on stdin with shape { slug, brand, content }
 * Output: { url, slug, file } — the live proposal URL
 *
 * If the proposal already has a `slug` that exists in proposals/, it UPDATES.
 * Otherwise it CREATES a new entry.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Redis } from "@upstash/redis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PROPOSALS_DIR = join(ROOT, "proposals");

// ── Redis (Upstash) ──────────────────────────────────────────────────────────
const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = (REDIS_URL && !REDIS_URL.includes("..."))
  ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
  : null;

async function redisSet(key, value, exSeconds = 60 * 60 * 24 * 365) {
  if (!redis) {
    console.warn("[redis] No Upstash config — skipping Redis, saving locally only");
    return;
  }
  await redis.set(key, value, { ex: exSeconds });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

const PRICING_TIERS = {
  starter:    { label: "Starter",    price: "$2,500/mo", features: ["Up to 3 data sources","Natural language querying","Weekly automated reports","Email support"] },
  growth:     { label: "Growth",     price: "$6,500/mo", features: ["Up to 15 data sources","Real-time dashboards","Custom alert rules","Slack/Teams integration","Dedicated success manager"] },
  enterprise: { label: "Enterprise", price: "Custom",    features: ["Unlimited data sources","On-premise deployment option","SOC 2 + ISO 27001 compliant","SSO / SAML","SLA guarantee","White-glove onboarding"] },
};

// ── Main ─────────────────────────────────────────────────────────────────────
const input = readFileSync("/dev/stdin", "utf-8").trim();
const proposal = JSON.parse(input);

const { brand, content } = proposal;
const slug = proposal.slug || slugify(brand.clientName) + "-" + Date.now().toString(36);

// Build the full proposal object
const full = {
  id: slug,
  slug,
  createdAt: proposal.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "published",
  brand,
  content,
  transcript: proposal.transcript || "",
};

// Determine the base URL
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const proposalUrl = `${baseUrl}/${slug}`;

// Save to Redis
await redisSet(`proposal:${slug}`, full);

// Save locally as JSON backup
mkdirSync(PROPOSALS_DIR, { recursive: true });
const localFile = join(PROPOSALS_DIR, `${slug}.json`);
writeFileSync(localFile, JSON.stringify({ ...full, proposalUrl }, null, 2));

console.log(JSON.stringify({ url: proposalUrl, slug, file: localFile }, null, 2));
