"use client";

import { useState } from "react";
import { GameOdds } from "@/lib/types";
import { GameCard } from "./GameCard";
import { GameWeather } from "@/lib/weather";

interface Props {
  nflGames: GameOdds[];
  nbaGames: GameOdds[];
  weatherData: Record<string, GameWeather>;
}

type Sport = "NBA" | "NFL";

export function SportTabs({ nflGames, nbaGames, weatherData }: Props) {
  const [activeSport, setActiveSport] = useState<Sport>(
    nbaGames.length > 0 ? "NBA" : "NFL"
  );

  const games = activeSport === "NFL" ? nflGames : nbaGames;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveSport("NBA")}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all
            ${activeSport === "NBA"
              ? "gradient-nba text-white shadow-lg shadow-red-500/25"
              : "tab-inactive hover:shadow-md"
            }
          `}
        >
          <span className="text-lg">🏀</span>
          NBA
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-bold
            ${activeSport === "NBA" ? "bg-white/20" : "bg-gray-100 text-gray-600"}
          `}>
            {nbaGames.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSport("NFL")}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all
            ${activeSport === "NFL"
              ? "bg-[#013369] text-white shadow-lg shadow-blue-900/40"
              : "tab-inactive hover:shadow-md"
            }
          `}
        >
          <span className="text-lg">🏈</span>
          NFL
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-bold
            ${activeSport === "NFL" ? "bg-white/20" : "bg-gray-100 text-gray-600"}
          `}>
            {nflGames.length}
          </span>
        </button>
      </div>

      {/* Games Grid */}
      {games.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {games.map((game, index) => (
            <GameCard
              key={game.eventId}
              game={game}
              colorIndex={index}
              weather={activeSport === "NFL" ? weatherData[game.homeTeam] : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-10 text-center">
          <div className="text-4xl mb-3">{activeSport === "NBA" ? "🏀" : "🏈"}</div>
          <p className="text-[--text-secondary] font-medium">
            No {activeSport} games available right now
          </p>
        </div>
      )}
    </div>
  );
}
