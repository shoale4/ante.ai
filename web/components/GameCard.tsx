"use client";

import { useState } from "react";
import { GameOdds } from "@/lib/types";
import { GameDetailModal } from "./GameDetailModal";
import { TeamLogo } from "./TeamLogo";
import { WeatherBadge } from "./WeatherBadge";
import { GameWeather } from "@/lib/weather";

interface Props {
  game: GameOdds;
  colorIndex?: number;
  weather?: GameWeather;
  onWaitlist?: () => void;
}

export function GameCard({ game, colorIndex = 0, weather, onWaitlist }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const gameTime = new Date(game.eventStartTime);
  const isToday = isSameDay(gameTime, new Date());
  const isTomorrow = isSameDay(gameTime, new Date(Date.now() + 24 * 60 * 60 * 1000));

  const dateLabel = isToday
    ? "Today"
    : isTomorrow
    ? "Tomorrow"
    : gameTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const timeLabel = gameTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Get best moneyline odds for each side
  const homeML = game.markets.moneyline.filter(o => o.outcome === "home");
  const awayML = game.markets.moneyline.filter(o => o.outcome === "away");
  const bestHomeML = findBest(homeML);
  const bestAwayML = findBest(awayML);

  // Get spread
  const homeSpread = game.markets.spread.find(o => o.outcome === "home");
  const awaySpread = game.markets.spread.find(o => o.outcome === "away");

  // Avatar colors based on index (fallback if no logo)
  const awayAvatarClass = `team-avatar-${(colorIndex * 2) % 8 + 1}`;
  const homeAvatarClass = `team-avatar-${(colorIndex * 2 + 1) % 8 + 1}`;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="glass-card glass-card-hover w-full p-5 text-left cursor-pointer"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">{game.sport === "NBA" ? "🏀" : "🏈"}</span>
            <span className="text-sm font-medium text-[--text-secondary]">{game.sport}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {weather && <WeatherBadge weather={weather} />}
            <span className={`
              px-2 py-1 rounded-lg text-xs font-semibold
              ${isToday ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
            `}>
              {dateLabel}
            </span>
            <span className="text-[--text-secondary]">{timeLabel}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="space-y-4">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo
                teamName={game.awayTeam}
                sport={game.sport as "NFL" | "NBA"}
                fallbackClass={awayAvatarClass}
              />
              <div>
                <div className="font-semibold text-[--foreground]">{game.awayTeam}</div>
                {awaySpread && (
                  <div className="text-sm text-[--text-secondary]">
                    {formatSpread(awaySpread.currentLine)}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              {bestAwayML && (
                <div className={`text-xl font-bold ${bestAwayML.price > 0 ? 'odds-positive' : 'odds-negative'}`}>
                  {formatPrice(bestAwayML.price)}
                </div>
              )}
              {bestAwayML && (
                <div className="text-xs text-[--text-secondary] capitalize">{bestAwayML.book}</div>
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-xs font-semibold text-[--text-secondary] bg-gray-100 px-2 py-1 rounded-md">VS</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo
                teamName={game.homeTeam}
                sport={game.sport as "NFL" | "NBA"}
                fallbackClass={homeAvatarClass}
              />
              <div>
                <div className="font-semibold text-[--foreground]">{game.homeTeam}</div>
                {homeSpread && (
                  <div className="text-sm text-[--text-secondary]">
                    {formatSpread(homeSpread.currentLine)}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              {bestHomeML && (
                <div className={`text-xl font-bold ${bestHomeML.price > 0 ? 'odds-positive' : 'odds-negative'}`}>
                  {formatPrice(bestHomeML.price)}
                </div>
              )}
              {bestHomeML && (
                <div className="text-xs text-[--text-secondary] capitalize">{bestHomeML.book}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-sm font-medium text-[--accent]">
          <span>Compare all odds</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      <GameDetailModal game={game} isOpen={isOpen} onClose={() => setIsOpen(false)} onWaitlist={onWaitlist} />
    </>
  );
}

function formatPrice(price: number): string {
  return price > 0 ? `+${price}` : `${price}`;
}

function formatSpread(line: number | null): string {
  if (line === null) return "";
  return line > 0 ? `+${line}` : `${line}`;
}

function findBest(
  odds: Array<{ book: string; currentPrice: number }>
): { book: string; price: number } | null {
  if (odds.length === 0) return null;
  return odds.reduce(
    (best, current) =>
      current.currentPrice > best.price
        ? { book: current.book, price: current.currentPrice }
        : best,
    { book: odds[0].book, price: odds[0].currentPrice }
  );
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
