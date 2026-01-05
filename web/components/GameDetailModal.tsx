"use client";

import { useEffect, useState } from "react";
import { GameOdds } from "@/lib/types";
import { LineMovementChart } from "./LineMovementChart";
import { PlayerPropsSection } from "./PlayerPropsSection";
import { BookName } from "./BookLink";

interface Props {
  game: GameOdds;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "odds" | "spread" | "ml" | "total" | "props";

const tabs: { id: TabType; label: string }[] = [
  { id: "odds", label: "All" },
  { id: "spread", label: "Spread" },
  { id: "ml", label: "ML" },
  { id: "total", label: "O/U" },
  { id: "props", label: "Props" },
];

export function GameDetailModal({ game, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("odds");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const gameTime = new Date(game.eventStartTime);
  const dateStr = gameTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = gameTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
        {/* Handle bar */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-8 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header - Compact */}
        <div className="flex-shrink-0 border-b border-gray-100 px-4 pt-2 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span>{game.sport}</span>
                <span>·</span>
                <span>{dateStr} {timeStr}</span>
              </div>
              <h2 className="text-[15px] font-semibold text-gray-900 mt-0.5 truncate">
                {game.awayTeam} @ {game.homeTeam}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs - Compact pills */}
          <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap active:scale-95 ${
                  activeTab === tab.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "odds" && (
            <>
              <CompactMarket
                title="Moneyline"
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                homeOdds={game.markets.moneyline.filter(o => o.outcome === "home")}
                awayOdds={game.markets.moneyline.filter(o => o.outcome === "away")}
              />
              <CompactMarket
                title="Spread"
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                homeOdds={game.markets.spread.filter(o => o.outcome === "home")}
                awayOdds={game.markets.spread.filter(o => o.outcome === "away")}
                showLine
              />
              <CompactTotal
                overOdds={game.markets.total.filter(o => o.outcome === "over")}
                underOdds={game.markets.total.filter(o => o.outcome === "under")}
              />
            </>
          )}

          {activeTab === "spread" && (
            <>
              <CompactMarket
                title="Spread"
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                homeOdds={game.markets.spread.filter(o => o.outcome === "home")}
                awayOdds={game.markets.spread.filter(o => o.outcome === "away")}
                showLine
              />
              <ChartSection eventId={game.eventId} marketType="spread" homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
            </>
          )}

          {activeTab === "ml" && (
            <>
              <CompactMarket
                title="Moneyline"
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                homeOdds={game.markets.moneyline.filter(o => o.outcome === "home")}
                awayOdds={game.markets.moneyline.filter(o => o.outcome === "away")}
              />
              <ChartSection eventId={game.eventId} marketType="moneyline" homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
            </>
          )}

          {activeTab === "total" && (
            <>
              <CompactTotal
                overOdds={game.markets.total.filter(o => o.outcome === "over")}
                underOdds={game.markets.total.filter(o => o.outcome === "under")}
              />
              <ChartSection eventId={game.eventId} marketType="total" homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
            </>
          )}

          {activeTab === "props" && (
            <PlayerPropsSection eventId={game.eventId} />
          )}
        </div>
      </div>
    </div>
  );
}

// Chart section wrapper
function ChartSection({ eventId, marketType, homeTeam, awayTeam }: {
  eventId: string;
  marketType: string;
  homeTeam: string;
  awayTeam: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <h4 className="text-[11px] font-medium text-gray-500 mb-2">LINE MOVEMENT</h4>
      <LineMovementChart eventId={eventId} marketType={marketType} homeTeam={homeTeam} awayTeam={awayTeam} />
    </div>
  );
}

// Compact market section
function CompactMarket({
  title,
  homeTeam,
  awayTeam,
  homeOdds,
  awayOdds,
  showLine,
}: {
  title: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: Array<{ book: string; currentPrice: number; currentLine: number | null; priceMovement: number }>;
  awayOdds: Array<{ book: string; currentPrice: number; currentLine: number | null; priceMovement: number }>;
  showLine?: boolean;
}) {
  const books = [...new Set([...homeOdds.map(o => o.book), ...awayOdds.map(o => o.book)])].sort();
  const bestHome = Math.max(...homeOdds.map(o => o.currentPrice));
  const bestAway = Math.max(...awayOdds.map(o => o.currentPrice));

  // Shorten team names
  const shortHome = homeTeam.split(" ").pop() || homeTeam;
  const shortAway = awayTeam.split(" ").pop() || awayTeam;

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase">
              <th className="text-left font-medium py-2 px-3 w-24">Book</th>
              <th className="text-center font-medium py-2 px-2">{shortAway}</th>
              <th className="text-center font-medium py-2 px-2">{shortHome}</th>
            </tr>
          </thead>
          <tbody>
            {books.slice(0, 6).map((book, idx) => {
              const home = homeOdds.find(o => o.book === book);
              const away = awayOdds.find(o => o.book === book);
              return (
                <tr key={book} className={idx % 2 === 0 ? "bg-white" : ""}>
                  <td className="py-1.5 px-3">
                    <span className="text-[11px] text-gray-600 font-medium">{formatBookName(book)}</span>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {away ? (
                      <OddsCell
                        price={away.currentPrice}
                        line={showLine ? away.currentLine : null}
                        isBest={away.currentPrice === bestAway}
                      />
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {home ? (
                      <OddsCell
                        price={home.currentPrice}
                        line={showLine ? home.currentLine : null}
                        isBest={home.currentPrice === bestHome}
                      />
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {books.length > 6 && (
        <div className="px-3 py-1.5 text-center border-t border-gray-100">
          <span className="text-[10px] text-gray-400">+{books.length - 6} more books</span>
        </div>
      )}
    </div>
  );
}

// Compact total section
function CompactTotal({
  overOdds,
  underOdds,
}: {
  overOdds: Array<{ book: string; currentPrice: number; currentLine: number | null; priceMovement: number }>;
  underOdds: Array<{ book: string; currentPrice: number; currentLine: number | null; priceMovement: number }>;
}) {
  const books = [...new Set([...overOdds.map(o => o.book), ...underOdds.map(o => o.book)])].sort();
  const bestOver = Math.max(...overOdds.map(o => o.currentPrice));
  const bestUnder = Math.max(...underOdds.map(o => o.currentPrice));
  const totalLine = overOdds[0]?.currentLine ?? underOdds[0]?.currentLine;

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total</span>
        {totalLine && (
          <span className="text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
            {totalLine}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase">
              <th className="text-left font-medium py-2 px-3 w-24">Book</th>
              <th className="text-center font-medium py-2 px-2">Over</th>
              <th className="text-center font-medium py-2 px-2">Under</th>
            </tr>
          </thead>
          <tbody>
            {books.slice(0, 6).map((book, idx) => {
              const over = overOdds.find(o => o.book === book);
              const under = underOdds.find(o => o.book === book);
              return (
                <tr key={book} className={idx % 2 === 0 ? "bg-white" : ""}>
                  <td className="py-1.5 px-3">
                    <span className="text-[11px] text-gray-600 font-medium">{formatBookName(book)}</span>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {over ? (
                      <OddsCell price={over.currentPrice} isBest={over.currentPrice === bestOver} />
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {under ? (
                      <OddsCell price={under.currentPrice} isBest={under.currentPrice === bestUnder} />
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {books.length > 6 && (
        <div className="px-3 py-1.5 text-center border-t border-gray-100">
          <span className="text-[10px] text-gray-400">+{books.length - 6} more books</span>
        </div>
      )}
    </div>
  );
}

// Compact odds cell
function OddsCell({
  price,
  line,
  isBest,
}: {
  price: number;
  line?: number | null;
  isBest: boolean;
}) {
  const priceStr = price > 0 ? `+${price}` : `${price}`;
  const lineStr = line !== null && line !== undefined ? (line > 0 ? `+${line}` : `${line}`) : null;

  return (
    <span className={`font-semibold ${isBest ? 'text-green-600' : 'text-gray-900'}`}>
      {lineStr && <span className="text-gray-400 font-normal mr-1">{lineStr}</span>}
      {priceStr}
      {isBest && <span className="text-green-500 ml-0.5">★</span>}
    </span>
  );
}

// Format book name to be shorter
function formatBookName(book: string): string {
  const nameMap: Record<string, string> = {
    draftkings: "DK",
    fanduel: "FD",
    betmgm: "MGM",
    caesars: "CZR",
    pointsbet: "PB",
    betonline: "BOL",
    bovada: "BOV",
    mybookie: "MyB",
  };
  return nameMap[book.toLowerCase()] || book.slice(0, 8);
}
