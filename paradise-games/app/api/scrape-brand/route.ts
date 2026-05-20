import { NextRequest, NextResponse } from "next/server";
import { extractBrandFromHtml } from "@/lib/scraper";
import { extractBrandFromScreenshot } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { clientName, clientUrl, html, screenshotBase64, screenshotMime } = await req.json();

    if (!clientName || !html) {
      return NextResponse.json({ error: "clientName and html are required" }, { status: 400 });
    }

    // Extract what we can from the raw HTML
    const htmlBrand = extractBrandFromHtml(html, clientName, clientUrl ?? "");

    // If a screenshot was provided, use Claude Vision to refine the colors
    if (screenshotBase64) {
      const mime = screenshotMime ?? "image/png";
      const visionBrand = await extractBrandFromScreenshot(screenshotBase64, mime, htmlBrand);
      return NextResponse.json({ ...htmlBrand, ...visionBrand });
    }

    return NextResponse.json(htmlBrand);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract brand";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
