import { NextRequest, NextResponse } from "next/server";
import { generateProposalContent } from "@/lib/claude";
import { redis } from "@/lib/redis";
import type { BrandTokens, Proposal } from "@/types/proposal";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { transcript, brand, customAddOns = [], ctaUrl = "" } = await req.json() as {
      transcript: string;
      brand: BrandTokens;
      customAddOns: string[];
      ctaUrl: string;
    };

    if (!transcript || !brand) {
      return NextResponse.json({ error: "transcript and brand are required" }, { status: 400 });
    }

    const content = await generateProposalContent(transcript, brand, customAddOns, ctaUrl);

    const proposal: Proposal = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: "draft",
      brand,
      content,
      transcript,
    };

    await redis.set(`proposal:${proposal.id}`, proposal, { ex: 60 * 60 * 24 * 90 }); // 90 days

    return NextResponse.json(proposal);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate proposal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
