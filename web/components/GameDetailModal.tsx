"use client";

import { useEffect } from "react";
import { GameOdds } from "@/lib/types";

interface Props {
  game: GameOdds;
  isOpen: boolean;
  onClose: () => void;
}

export function GameDetailModal({ game, isOpen, onClose }: Props) {
  // Close on escape key
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-[#f5f5f7] rounded-t-3xl sm:rounded-3xl shadow-2xl">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-gray-200/60 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-[--text-secondary]">{game.sport}</div>
            <h2 className="text-xl font-semibold">
              {game.awayTeam} @ {game.homeTeam}
            </h2>
            <div className="text-sm text-[--text-secondary]">
              {gameTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {gameTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Moneyline */}
          <MarketSection
            title="Moneyline"
            description="Pick the winner"
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            homeOdds={game.markets.moneyline.filter(o => o.outcome === "home")}
            awayOdds={game.markets.moneyline.filter(o => o.outcome === "away")}
          />

          {/* Spread */}
          <MarketSection
            title="Spread"
            description="Point spread betting"
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            homeOdds={game.markets.spread.filter(o => o.outcome === "home")}
            awayOdds={game.markets.spread.filter(o => o.outcome === "away")}
            showLine
          />

          {/* Total */}
          <TotalSection
            title="Total"
            description="Over/Under points"
            overOdds={game.markets.total.filter(o => o.outcome === "over")}
            underOdds={game.markets.total.filter(o => o.outcome === "under")}
          />
        </div>
      </div>
    </div>
  );
}

interface MarketSectionProps {
  title: string;
  description: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: Array<{
    book: string;
    currentPrice: number;
    currentLine: number | null;
    openingPrice: number;
    priceMovement: number;
  }>;
  awayOdds: Array<{
    book: string;
    currentPrice: number;
    currentLine: number | null;
    openingPrice: number;
    priceMovement: number;
  }>;
  showLine?: boolean;
}

function MarketSection({ title, description, homeTeam, awayTeam, homeOdds, awayOdds, showLine }: MarketSectionProps) {
  // Get all unique books
  const books = [...new Set([...homeOdds.map(o => o.book), ...awayOdds.map(o => o.book)])].sort();

  // Find best odds
  const bestHome = homeOdds.reduce((best, o) => o.currentPrice > best ? o.currentPrice : best, -9999);
  const bestAway = awayOdds.reduce((best, o) => o.currentPrice > best ? o.currentPrice : best, -9999);

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-[--text-secondary]">{description}</p>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="text-sm text-[--text-secondary]">
              <th className="text-left font-medium pb-3">Sportsbook</th>
              <th className="text-right font-medium pb-3">{awayTeam}</th>
              <th className="text-right font-medium pb-3">{homeTeam}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60">
            {books.map(book => {
              const home = homeOdds.find(o => o.book === book);
              const away = awayOdds.find(o => o.book === book);
              return (
                <tr key={book}>
                  <td className="py-3">
                    <span className="font-medium capitalize">{book}</span>
                  </td>
                  <td className="py-3 text-right">
                    {away ? (
                      <OddsCell
                        price={away.currentPrice}
                        line={showLine ? away.currentLine : null}
                        isBest={away.currentPrice === bestAway}
                        movement={away.priceMovement}
                      />
                    ) : (
                      <span className="text-[--text-secondary]">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {home ? (
                      <OddsCell
                        price={home.currentPrice}
                        line={showLine ? home.currentLine : null}
                        isBest={home.currentPrice === bestHome}
                        movement={home.priceMovement}
                      />
                    ) : (
                      <span className="text-[--text-secondary]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TotalSectionProps {
  title: string;
  description: string;
  overOdds: Array<{
    book: string;
    currentPrice: number;
    currentLine: number | null;
    openingPrice: number;
    priceMovement: number;
  }>;
  underOdds: Array<{
    book: string;
    currentPrice: number;
    currentLine: number | null;
    openingPrice: number;
    priceMovement: number;
  }>;
}

function TotalSection({ title, description, overOdds, underOdds }: TotalSectionProps) {
  const books = [...new Set([...overOdds.map(o => o.book), ...underOdds.map(o => o.book)])].sort();
  const bestOver = overOdds.reduce((best, o) => o.currentPrice > best ? o.currentPrice : best, -9999);
  const bestUnder = underOdds.reduce((best, o) => o.currentPrice > best ? o.currentPrice : best, -9999);

  // Get the total line (should be same across books)
  const totalLine = overOdds[0]?.currentLine ?? underOdds[0]?.currentLine;

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-[--text-secondary]">{description}</p>
        </div>
        {totalLine && (
          <div className="pill pill-blue text-base font-semibold">
            {totalLine}
          </div>
        )}
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="text-sm text-[--text-secondary]">
              <th className="text-left font-medium pb-3">Sportsbook</th>
              <th className="text-right font-medium pb-3">Over</th>
              <th className="text-right font-medium pb-3">Under</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60">
            {books.map(book => {
              const over = overOdds.find(o => o.book === book);
              const under = underOdds.find(o => o.book === book);
              return (
                <tr key={book}>
                  <td className="py-3">
                    <span className="font-medium capitalize">{book}</span>
                  </td>
                  <td className="py-3 text-right">
                    {over ? (
                      <OddsCell
                        price={over.currentPrice}
                        isBest={over.currentPrice === bestOver}
                        movement={over.priceMovement}
                      />
                    ) : (
                      <span className="text-[--text-secondary]">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {under ? (
                      <OddsCell
                        price={under.currentPrice}
                        isBest={under.currentPrice === bestUnder}
                        movement={under.priceMovement}
                      />
                    ) : (
                      <span className="text-[--text-secondary]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OddsCell({
  price,
  line,
  isBest,
  movement,
}: {
  price: number;
  line?: number | null;
  isBest: boolean;
  movement: number;
}) {
  const priceStr = price > 0 ? `+${price}` : `${price}`;
  const lineStr = line !== null && line !== undefined ? (line > 0 ? `+${line}` : `${line}`) : null;

  return (
    <div className="inline-flex flex-col items-end">
      <div className="flex items-center gap-2">
        {lineStr && <span className="text-[--text-secondary]">{lineStr}</span>}
        <span className={`font-semibold ${isBest ? 'text-[--accent-green]' : ''}`}>
          {priceStr}
        </span>
        {isBest && (
          <span className="text-xs text-[--accent-green]">★</span>
        )}
      </div>
      {movement !== 0 && (
        <span className={`text-xs ${movement > 0 ? 'text-[--accent-green]' : 'text-[--accent-red]'}`}>
          {movement > 0 ? `↑${movement}` : `↓${Math.abs(movement)}`}
        </span>
      )}
    </div>
  );
}
