"use client";

import { useState } from "react";
import Link from "next/link";
import ProposalForm from "@/components/ProposalForm";
import ProposalPreview from "@/components/ProposalPreview";
import type { Proposal } from "@/types/proposal";

export default function Home() {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [publishedUrl, setPublishedUrl] = useState("");

  function reset() {
    setProposal(null);
    setPublishedUrl("");
  }

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="https://framerusercontent.com/images/6CxE8i0ipM3Kf86VeCuaSMk9dU.png" alt="Milo" className="h-7 object-contain" />
          <span className="text-gray-300 text-sm">|</span>
          <span className="text-sm font-semibold text-gray-700">Proposal Generator</span>
        </div>
        <div className="flex items-center gap-4">
          {proposal && (
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← New proposal
            </button>
          )}
          <Link href="/proposals" className="text-sm text-milo-blue hover:underline">
            Past proposals
          </Link>
        </div>
      </nav>

      {!proposal ? (
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">New proposal</h1>
            <p className="text-gray-500">Paste a transcript, get a personalized Webflow proposal in their brand. Takes ~60 seconds.</p>
          </div>
          <ProposalForm onProposalReady={setProposal} />
        </main>
      ) : (
        <main>
          <ProposalPreview
            proposal={proposal}
            onPublished={(url) => setPublishedUrl(url)}
          />
          {publishedUrl && (
            <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-4 flex items-center gap-3 max-w-sm">
              <span className="text-xl">🎉</span>
              <div>
                <p className="font-semibold text-sm">Published!</p>
                <button
                  onClick={() => navigator.clipboard.writeText(publishedUrl)}
                  className="text-green-200 hover:text-white text-xs underline"
                >
                  Copy client link
                </button>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
