"use client";

import { useState } from "react";
import { usePro } from "@/lib/pro-context";

interface Props {
  onRedeemClick: () => void;
}

export function LaunchBanner({ onRedeemClick }: Props) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { isPro } = usePro();

  // Don't show if user is already Pro or dismissed
  if (isPro || isDismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-black overflow-hidden">
      {/* Animated shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine" />

      <div className="relative max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Content */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex-shrink-0 text-lg">🎉</span>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">
                Launch Special: First 100 users get Pro FREE
              </p>
              <p className="text-xs text-black/70 hidden sm:block">
                Use code <span className="font-mono font-bold bg-black/10 px-1.5 py-0.5 rounded">DABEARSCHAMPS26</span> to unlock all features
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onRedeemClick}
              className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 active:scale-95 transition-all shadow-lg"
            >
              Claim Now
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile: Show code on separate line */}
        <p className="text-xs text-black/70 mt-1 sm:hidden">
          Code: <span className="font-mono font-bold bg-black/10 px-1.5 py-0.5 rounded">DABEARSCHAMPS26</span>
        </p>
      </div>
    </div>
  );
}
