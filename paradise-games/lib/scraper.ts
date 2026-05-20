import * as cheerio from "cheerio";
import type { BrandTokens } from "@/types/proposal";

const HEX_RE = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const RGB_RE = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function expandShortHex(hex: string): string {
  if (hex.length === 4) {
    return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

// Keep any color that could realistically be a brand color.
// We allow dark/black (many modern sites use dark backgrounds) but skip pure white and mid-grays.
function isBrandColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1)) / 255;
  // Skip pure whites (lightness > 0.95) and unsaturated mid-grays
  if (lightness > 0.95) return false;
  if (saturation < 0.1 && lightness > 0.15 && lightness < 0.85) return false;
  return true;
}

function extractColors(css: string): string[] {
  const freq: Record<string, number> = {};

  for (const match of css.matchAll(HEX_RE)) {
    const hex = expandShortHex(match[0].toLowerCase());
    if (isBrandColor(hex)) freq[hex] = (freq[hex] ?? 0) + 1;
  }

  const rgb = new RegExp(RGB_RE.source, "g");
  for (const match of css.matchAll(rgb)) {
    const hex = rgbToHex(+match[1], +match[2], +match[3]);
    if (isBrandColor(hex)) freq[hex] = (freq[hex] ?? 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);
}

function extractFontFamily($: cheerio.CheerioAPI, styleText: string): string {
  // Check Google Fonts link hrefs first
  const gfLink = $('link[href*="fonts.googleapis.com"]').attr("href") ?? "";
  const gfMatch = gfLink.match(/family=([^&:+|]+)/);
  if (gfMatch) return gfMatch[1].replace(/\+/g, " ");

  // Fall back to CSS font-family declarations
  const ffMatch = styleText.match(/font-family\s*:\s*['"]?([^'",;{}]+)/);
  if (ffMatch) return ffMatch[1].trim();

  return "Inter, sans-serif";
}

function extractLogo($: cheerio.CheerioAPI, baseUrl: string): string {
  // og:image as last resort
  const og = $('meta[property="og:image"]').attr("content") ?? "";

  // Prefer logo inside header
  const candidates = $('header img, nav img, [class*="logo"] img, [id*="logo"] img, img[alt*="logo" i], img[src*="logo" i]');
  for (const el of candidates.toArray()) {
    const src = $(el).attr("src") ?? "";
    if (src) return resolveUrl(src, baseUrl);
  }

  // SVG logos
  const svgLogo = $('header svg, [class*="logo"] svg').first();
  if (svgLogo.length) {
    // Return a placeholder — SVG inline logos can't be easily extracted as URL
    return og ? resolveUrl(og, baseUrl) : "";
  }

  return og ? resolveUrl(og, baseUrl) : "";
}

function resolveUrl(src: string, base: string): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return "https:" + src;
  if (src.startsWith("/")) {
    const url = new URL(base);
    return url.origin + src;
  }
  return base.replace(/\/$/, "") + "/" + src;
}

export function extractBrandFromHtml(html: string, clientName: string, clientUrl: string): BrandTokens {
  const $ = cheerio.load(html);

  // Collect all CSS: <style> tags + inline style attributes
  const styleBlocks: string[] = [];
  $("style").each((_, el) => { styleBlocks.push($(el).text()); });
  $("[style]").each((_, el) => { styleBlocks.push($(el).attr("style") ?? ""); });
  const allCss = styleBlocks.join("\n");

  const colors = extractColors(allCss);
  const fontFamily = extractFontFamily($, allCss);
  const logoUrl = extractLogo($, clientUrl || "https://example.com");

  return {
    primaryColor: colors[0] ?? "#cccccc",
    secondaryColor: colors[1] ?? "#888888",
    accentColor: colors[2] ?? "#444444",
    fontFamily,
    logoUrl,
    clientName,
    clientUrl,
  };
}
