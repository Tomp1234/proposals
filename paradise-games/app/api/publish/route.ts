import { NextRequest, NextResponse } from "next/server";
import { publishToWebflow } from "@/lib/webflow";
import { redis } from "@/lib/redis";
import type { Proposal } from "@/types/proposal";

export async function POST(req: NextRequest) {
  try {
    const { proposalId } = await req.json();

    if (!proposalId) {
      return NextResponse.json({ error: "proposalId is required" }, { status: 400 });
    }

    const proposal = await redis.get<Proposal>(`proposal:${proposalId}`);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const webflowUrl = await publishToWebflow(proposal);

    const updated: Proposal = { ...proposal, status: "published", webflowUrl };
    await redis.set(`proposal:${proposalId}`, updated, { ex: 60 * 60 * 24 * 90 });

    return NextResponse.json({ webflowUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish to Webflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
