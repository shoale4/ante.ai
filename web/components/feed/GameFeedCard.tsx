"use client";

import { useState } from "react";
import { GameOdds } from "@/lib/types";
import { GameWeather } from "@/lib/weather";
import { NewsItem } from "@/lib/news";
import { GameDetailModal } from "../GameDetailModal";
import { TeamLogo } from "../TeamLogo";
import { WeatherBadge } from "../WeatherBadge";
import { AIAnalysis } from "../AIAnalysis";
import { Sport } from "@/lib/types";

const SPORT_EMOJI: Record<Sport, string> = {
  NFL: "🏈",
  NBA: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  MMA: "🥊",
  Soccer: "⚽",
};

interface Props {
  game: GameOdds;
  weather?: GameWeather;
  relatedNews?: NewsItem[];
}

export function GameFeedCard({ game, weather, relatedNews = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

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
  const homeML = game.markets.moneyline.filter((o) => o.outcome === "home");
  const awayML = game.markets.moneyline.filter((o) => o.outcome === "away");
  const bestHomeML = findBest(homeML);
  const bestAwayML = findBest(awayML);

  // Get spread
  const homeSpread = game.markets.spread.find((o) => o.outcome === "home");
  const awaySpread = game.markets.spread.find((o) => o.outcome === "away");

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="glass-card glass-card-hover w-full p-4 text-left cursor-pointer"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{SPORT_EMOJI[game.sport as Sport] || "🏆"}</span>
            <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full bg-gradient-to-r from-gray-700 to-gray-600">
              GAME
            </span>
            <span className="text-xs font-medium text-[--text-secondary]">{game.sport}</span>
          </div>
          <div className="flex items-center gap-2">
            {weather && <WeatherBadge weather={weather} />}
            <span
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                isToday ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {dateLabel}
            </span>
            <span className="text-xs text-[--text-secondary]">{timeLabel}</span>
          </div>
        </div>

        {/* Matchup */}
        <div className="flex items-center justify-between">
          {/* Teams */}
          <div className="flex items-center gap-4">
            {/* Away Team */}
            <div className="flex items-center gap-2">
              <TeamLogo
                teamName={game.awayTeam}
                sport={game.sport as Sport}
                fallbackClass="team-avatar-1"
              />
              <div>
                <div className="font-semibold text-sm">{game.awayTeam}</div>
                {awaySpread && (
                  <div className="text-xs text-[--text-secondary]">
                    {formatSpread(awaySpread.currentLine)}
                  </div>
                )}
              </div>
            </div>

            <span className="text-xs font-bold text-[--text-secondary] px-2">@</span>

            {/* Home Team */}
            <div className="flex items-center gap-2">
              <TeamLogo
                teamName={game.homeTeam}
                sport={game.sport as Sport}
                fallbackClass="team-avatar-2"
              />
              <div>
                <div className="font-semibold text-sm">{game.homeTeam}</div>
                {homeSpread && (
                  <div className="text-xs text-[--text-secondary]">
                    {formatSpread(homeSpread.currentLine)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Best Odds */}
          <div className="flex items-center gap-4">
            {bestAwayML && (
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${
                    bestAwayML.price > 0 ? "odds-positive" : "odds-negative"
                  }`}
                >
                  {formatPrice(bestAwayML.price)}
                </div>
                <div className="text-[10px] text-[--text-secondary] capitalize">
                  {bestAwayML.book}
                </div>
              </div>
            )}
            {bestHomeML && (
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${
                    bestHomeML.price > 0 ? "odds-positive" : "odds-negative"
                  }`}
                >
                  {formatPrice(bestHomeML.price)}
                </div>
                <div className="text-[10px] text-[--text-secondary] capitalize">
                  {bestHomeML.book}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAnalysis(!showAnalysis);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
          >
            <span>🤖</span>
            {showAnalysis ? "Hide" : "AI Pick"}
          </button>
          <div className="flex items-center gap-1 text-xs text-[--accent]">
            <span>All odds</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {showAnalysis && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <AIAnalysis game={game} weather={weather} relatedNews={relatedNews} />
        </div>
      )}

      <GameDetailModal game={game} isOpen={isOpen} onClose={() => setIsOpen(false)} />
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
      current.currentPrice > best.price ? { book: current.book, price: current.currentPrice } : best,
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
