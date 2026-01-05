"use client";

import { useEffect, useState } from "react";
import { PlayerProp } from "@/lib/types";
import { getAffiliateUrl, getBookDisplayName } from "@/lib/sportsbooks";

interface Props {
  eventId: string;
}

function formatOdds(price: number): string {
  if (price === 0) return "-";
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
  };
  return mapping[propType] || propType.replace("player_", "").replace(/_/g, " ");
}

export function PlayerPropsSection({ eventId }: Props) {
  const [props, setProps] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProps() {
      setLoading(true);
      try {
        const response = await fetch(`/api/props?eventId=${eventId}`);
        if (!response.ok) throw new Error("Failed to fetch props");

        const result = await response.json();
        setProps(result.data || []);
        setPlayers(result.meta?.players || []);

        // Auto-select first player if available
        if (result.meta?.players?.length > 0 && !selectedPlayer) {
          setSelectedPlayer(result.meta.players[0]);
        }
      } catch (err) {
        console.error("Error fetching props:", err);
        setProps([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProps();
  }, [eventId, selectedPlayer]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (props.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="font-semibold text-lg">No Player Props Available</h3>
        <p className="text-sm text-[--text-secondary] mt-2">
          Player props data will appear here when available
        </p>
      </div>
    );
  }

  // Filter props by selected player
  const filteredProps = selectedPlayer
    ? props.filter((p) => p.playerName === selectedPlayer)
    : props;

  // Group props by player
  const propsByPlayer = new Map<string, PlayerProp[]>();
  for (const prop of filteredProps) {
    if (!propsByPlayer.has(prop.playerName)) {
      propsByPlayer.set(prop.playerName, []);
    }
    propsByPlayer.get(prop.playerName)!.push(prop);
  }

  return (
    <div className="space-y-4">
      {/* Player Filter */}
      {players.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPlayer(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedPlayer === null
                ? "bg-blue-500 text-white"
                : "bg-gray-200/80 text-gray-600 hover:bg-gray-300"
            }`}
          >
            All Players
          </button>
          {players.map((player) => (
            <button
              key={player}
              onClick={() => setSelectedPlayer(player)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedPlayer === player
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200/80 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {player}
            </button>
          ))}
        </div>
      )}

      {/* Props by Player */}
      {Array.from(propsByPlayer.entries()).map(([playerName, playerProps]) => (
        <div key={playerName} className="glass-card p-4">
          <h3 className="font-semibold text-lg mb-3">{playerName}</h3>
          <div className="space-y-3">
            {playerProps.map((prop, idx) => (
              <div
                key={`${prop.propType}-${prop.line}-${idx}`}
                className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {formatPropType(prop.propType)}
                  </span>
                  <span className="pill pill-blue font-semibold">
                    {prop.line}
                  </span>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {prop.books.map((book) => {
                    // Find best odds
                    const bestOver = Math.max(...prop.books.map((b) => b.overPrice));
                    const bestUnder = Math.max(...prop.books.map((b) => b.underPrice));

                    return (
                      <a
                        key={book.book}
                        href={getAffiliateUrl(book.book)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-50 rounded-lg p-2 text-center hover:bg-gray-100 transition-colors block"
                      >
                        <div className="text-xs text-[--text-secondary] mb-1">
                          {getBookDisplayName(book.book)}
                        </div>
                        <div className="flex justify-center gap-2 text-sm">
                          <span
                            className={`font-medium ${
                              book.overPrice === bestOver && book.overPrice > 0
                                ? "text-[--accent-green]"
                                : ""
                            }`}
                          >
                            O {formatOdds(book.overPrice)}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span
                            className={`font-medium ${
                              book.underPrice === bestUnder && book.underPrice > 0
                                ? "text-[--accent-green]"
                                : ""
                            }`}
                          >
                            U {formatOdds(book.underPrice)}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
