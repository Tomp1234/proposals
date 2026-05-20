"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Proposal } from "@/types/proposal";

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/proposals")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProposals(data);
        else setError(data.error ?? "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="https://framerusercontent.com/images/6CxE8i0ipM3Kf86VeCuaSMk9dU.png" alt="Milo" className="h-7 object-contain" />
          <span className="text-gray-300 text-sm">|</span>
          <span className="text-sm font-semibold text-gray-700">Proposal Generator</span>
        </div>
        <Link href="/" className="text-sm text-milo-blue hover:underline">+ New proposal</Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Past proposals</h1>

        {loading && (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {!loading && !error && proposals.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No proposals yet</p>
            <Link href="/" className="text-milo-blue hover:underline text-sm">Generate your first one →</Link>
          </div>
        )}

        <div className="space-y-3">
          {proposals.map((p) => (
            <Link
              key={p.id}
              href={`/preview/${p.id}`}
              className="block bg-white border border-gray-200 rounded-xl px-6 py-4 hover:border-milo-blue hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Brand color swatch */}
                  <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: p.brand.primaryColor }} />
                  <div>
                    <p className="font-semibold text-gray-900">{p.brand.clientName}</p>
                    <p className="text-sm text-gray-400">{p.brand.clientUrl}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {p.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              {p.webflowUrl && (
                <p className="text-xs text-milo-blue mt-2 truncate">{p.webflowUrl}</p>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
