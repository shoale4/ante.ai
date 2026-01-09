"use client";

import { useState, useEffect } from "react";
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

interface BookOdds {
  book: string;
  overPrice: number;
  underPrice: number;
}

interface PlayerProp {
  eventId: string;
  playerName: string;
  propType: string;
  line: number;
  books: BookOdds[];
}

interface PropsResponse {
  data: PlayerProp[];
  meta: {
    eventId?: string;
    totalProps: number;
    players: string[];
    propTypes: { key: string; label: string }[];
  };
}

function formatOdds(price: number): string {
  if (price === 0) return "—";
  return price > 0 ? `+${price}` : `${price}`;
}

function formatPropType(propType: string): string {
  const mapping: Record<string, string> = {
    player_points: "Points",
    player_rebounds: "Rebounds",
    player_assists: "Assists",
    player_threes: "3-Pointers",
    player_pass_yds: "Pass Yards",
    player_pass_tds: "Pass TDs",
    player_rush_yds: "Rush Yards",
    player_receptions: "Receptions",
    player_reception_yds: "Rec Yards",
    player_goals: "Goals",
    player_shots_on_goal: "SOG",
    player_power_play_points: "PP Points",
  };
  return mapping[propType] || propType.replace("player_", "").replace(/_/g, " ");
}

function formatBookName(book: string): string {
  const nameMap: Record<string, string> = {
    draftkings: "DK",
    fanduel: "FD",
    betmgm: "MGM",
    caesars: "CZR",
    pointsbetus: "PB",
    bet365: "365",
    betonlineag: "BOL",
  };
  return nameMap[book.toLowerCase()] || book.slice(0, 4).toUpperCase();
}

interface Props {
  eventId: string;
  isPro?: boolean;
  onWaitlist?: () => void;
}

export function PlayerPropsSection({ eventId, isPro = false, onWaitlist }: Props) {
  const [props, setProps] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPropType, setSelectedPropType] = useState<string | null>(null);
  const [propTypes, setPropTypes] = useState<{ key: string; label: string }[]>([]);

  useEffect(() => {
    if (!isPro) return;

    async function fetchProps() {
      setLoading(true);
      try {
        const res = await fetch(`/api/props?eventId=${eventId}`);
        const data: PropsResponse = await res.json();
        setProps(data.data);
        setPropTypes(data.meta.propTypes || []);
        if (data.meta.propTypes?.length > 0) {
          setSelectedPropType(data.meta.propTypes[0].key);
        }
      } catch (error) {
        console.error("Error fetching props:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProps();
  }, [isPro, eventId]);

  // Locked state for non-Pro users
  if (!isPro) {
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // No props available
  if (props.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No player props available for this game yet</p>
        <p className="text-xs text-gray-400 mt-1">Props typically become available closer to game time</p>
      </div>
    );
  }

  // Filter props by selected type
  const filteredProps = selectedPropType
    ? props.filter(p => p.propType === selectedPropType)
    : props;

  return (
    <div className="space-y-3">
      {/* Prop Type Filter */}
      {propTypes.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {propTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setSelectedPropType(type.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap active:scale-95 ${
                selectedPropType === type.key
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      {/* Props List */}
      <div className="space-y-2">
        {filteredProps.map((prop, idx) => {
          const bestOver = Math.max(...prop.books.map(b => b.overPrice).filter(p => p !== 0));
          const bestUnder = Math.max(...prop.books.map(b => b.underPrice).filter(p => p !== 0));

          return (
            <div key={idx} className="bg-gray-50 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-900">{prop.playerName}</span>
                  <span className="text-[11px] text-gray-400">·</span>
                  <span className="text-[11px] text-gray-500">{formatPropType(prop.propType)}</span>
                </div>
                <span className="text-[12px] font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                  {prop.line}
                </span>
              </div>

              {/* Books Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-[10px] text-gray-400 uppercase">
                      <th className="text-left font-medium py-2 px-3 w-20">Book</th>
                      <th className="text-center font-medium py-2 px-2">Over</th>
                      <th className="text-center font-medium py-2 px-2">Under</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prop.books.slice(0, 5).map((book, bookIdx) => (
                      <tr key={book.book} className={bookIdx % 2 === 0 ? "bg-white" : ""}>
                        <td className="py-1.5 px-3">
                          <span className="text-[11px] text-gray-600 font-medium">{formatBookName(book.book)}</span>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={`font-semibold ${book.overPrice === bestOver && book.overPrice !== 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {formatOdds(book.overPrice)}
                            {book.overPrice === bestOver && book.overPrice !== 0 && <span className="text-green-500 ml-0.5">★</span>}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={`font-semibold ${book.underPrice === bestUnder && book.underPrice !== 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {formatOdds(book.underPrice)}
                            {book.underPrice === bestUnder && book.underPrice !== 0 && <span className="text-green-500 ml-0.5">★</span>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {prop.books.length > 5 && (
                <div className="px-3 py-1.5 text-center border-t border-gray-100">
                  <span className="text-[10px] text-gray-400">+{prop.books.length - 5} more books</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredProps.length === 0 && selectedPropType && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No {formatPropType(selectedPropType)} props available</p>
        </div>
      )}
    </div>
  );
}
