import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import type { Proposal } from "@/types/proposal";

export async function GET() {
  try {
    const keys = await redis.keys("proposal:*");
    if (!keys.length) return NextResponse.json([]);

    const proposals = await Promise.all(
      keys.map((k) => redis.get<Proposal>(k))
    );

    const sorted = (proposals.filter(Boolean) as Proposal[]).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(sorted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch proposals";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
