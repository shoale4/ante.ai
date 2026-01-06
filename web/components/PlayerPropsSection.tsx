"use client";

import { ProBadge } from "./ProTeaser";

// Mock preview data for the locked state
const PREVIEW_PROPS = [
  { player: "J. Allen", prop: "Pass Yards", line: 275.5, over: -115, under: -105, bestOver: true },
  { player: "J. Allen", prop: "Pass TDs", line: 2.5, over: +125, under: -145, bestUnder: true },
  { player: "S. Diggs", prop: "Rec Yards", line: 72.5, over: -110, under: -110, bestOver: false },
  { player: "D. Henry", prop: "Rush Yards", line: 85.5, over: -120, under: +100, bestUnder: true },
  { player: "L. Jackson", prop: "Pass Yards", line: 195.5, over: -108, under: -112, bestOver: true },
  { player: "L. Jackson", prop: "Rush Yards", line: 65.5, over: -115, under: -105, bestUnder: false },
];

function formatOdds(price: number): string {
  return price > 0 ? `+${price}` : `${price}`;
}

interface Props {
  eventId: string;
  onWaitlist?: () => void;
}

export function PlayerPropsSection({ eventId, onWaitlist }: Props) {
  return (
    <div className="relative">
      {/* Blurred Preview Content */}
      <div className="blur-[6px] pointer-events-none select-none opacity-60">
        <div className="space-y-2">
          {PREVIEW_PROPS.slice(0, 4).map((prop, idx) => (
            <div
              key={idx}
              className="py-2 px-3 bg-gray-50 rounded-xl"
            >
              {/* Top row: Player & Line */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[13px] font-semibold text-gray-900">
                    {prop.player}
                  </span>
                  <span className="text-[11px] text-gray-400">·</span>
                  <span className="text-[11px] text-gray-500">{prop.prop}</span>
                </div>
                <span className="text-[12px] font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200 flex-shrink-0">
                  {prop.line}
                </span>
              </div>

              {/* Bottom row: Over/Under */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">O</span>
                  <span className={`text-xs font-semibold ${prop.bestOver ? 'text-green-600' : 'text-gray-700'}`}>
                    {formatOdds(prop.over)}
                    {prop.bestOver && <span className="text-green-500 ml-0.5">★</span>}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">U</span>
                  <span className={`text-xs font-semibold ${prop.bestUnder ? 'text-green-600' : 'text-gray-700'}`}>
                    {formatOdds(prop.under)}
                    {prop.bestUnder && <span className="text-green-500 ml-0.5">★</span>}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/80 via-white/90 to-white/80 rounded-xl">
        <div className="text-center px-4 py-4 sm:py-6">
          {/* Lock Icon */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-2.5 sm:mb-3 shadow-lg shadow-orange-500/25">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Title */}
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Player Props</h3>
            <ProBadge />
          </div>

          {/* Description */}
          <p className="text-[11px] sm:text-xs text-gray-500 mb-3 sm:mb-4 max-w-[200px] sm:max-w-[220px] mx-auto leading-relaxed">
            Compare lines across 7+ sportsbooks with best odds highlighted
          </p>

          {/* CTA Button */}
          <button
            onClick={onWaitlist}
            className="px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold text-xs sm:text-[13px] shadow-md shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Unlock with Pro
          </button>

          {/* Subtext */}
          <p className="text-[9px] sm:text-[10px] text-gray-400 mt-2">
            Join 2,400+ bettors on the waitlist
          </p>
        </div>
      </div>
    </div>
  );
}
