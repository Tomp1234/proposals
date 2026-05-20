"use client";

import { useState } from "react";
import type { BrandTokens } from "@/types/proposal";

interface Props {
  brand: BrandTokens;
  onUpdate: (brand: BrandTokens) => void;
}

export default function BrandPreview({ brand, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(brand);

  function save() {
    onUpdate(local);
    setEditing(false);
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Extracted Brand</span>
        <button
          onClick={() => setEditing((e) => !e)}
          className="text-xs text-milo-blue hover:underline"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing ? (
        <div className="space-y-3">
          {(["primaryColor", "secondaryColor", "accentColor"] as const).map((field) => (
            <div key={field} className="flex items-center gap-3">
              <input
                type="color"
                value={local[field]}
                onChange={(e) => setLocal({ ...local, [field]: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={local[field]}
                onChange={(e) => setLocal({ ...local, [field]: e.target.value })}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-milo-blue"
              />
              <span className="text-xs text-gray-400 w-28">
                {field === "primaryColor" ? "Primary" : field === "secondaryColor" ? "Secondary" : "Accent"}
              </span>
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Client logo URL</label>
            <input
              type="url"
              value={local.logoUrl}
              onChange={(e) => setLocal({ ...local, logoUrl: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-milo-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Font family</label>
            <input
              type="text"
              value={local.fontFamily}
              onChange={(e) => setLocal({ ...local, fontFamily: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-milo-blue"
            />
          </div>
          <button
            onClick={save}
            className="w-full bg-milo-blue text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save overrides
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[brand.primaryColor, brand.secondaryColor, brand.accentColor].map((color, i) => (
              <div key={i} className="flex-1">
                <div className="h-10 rounded-lg border border-gray-200" style={{ backgroundColor: color }} />
                <p className="text-xs text-gray-500 mt-1 text-center font-mono">{color}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt="Client logo" className="h-8 max-w-[120px] object-contain" />
            ) : (
              <span className="text-xs text-gray-400 italic">No logo found — add URL above</span>
            )}
            <span className="text-xs text-gray-500 font-mono ml-auto">{brand.fontFamily}</span>
          </div>
        </div>
      )}
    </div>
  );
}
