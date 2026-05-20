import { notFound } from "next/navigation";
import { redis } from "@/lib/redis";
import type { Proposal } from "@/types/proposal";
import ProposalView from "@/components/ProposalView";

export default async function ProposalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proposal = await redis.get<Proposal>(`proposal:${slug}`);
  if (!proposal) notFound();
  return <ProposalView proposal={proposal} />;
}
