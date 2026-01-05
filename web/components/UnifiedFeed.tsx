"use client";

import { useState, useMemo } from "react";
import { GameOdds, LineMovement, Sport } from "@/lib/types";
import { NewsItem } from "@/lib/news";
import { GameWeather } from "@/lib/weather";
import { GameFeedCard, MovementFeedCard, NewsFeedCard } from "./feed";

type SportFilter = "all" | "nfl" | "nba" | "mlb" | "nhl" | "mma" | "soccer";
type ContentFilter = "games" | "movements" | "news";

interface Props {
  games: GameOdds[];
  movements: LineMovement[];
  news: NewsItem[];
  weatherData: Record<string, GameWeather>;
}

// Helper to check if news is related to a game
function isNewsRelatedToGame(newsItem: NewsItem, game: GameOdds): boolean {
  const newsText = (newsItem.title + " " + newsItem.summary).toLowerCase();
  const homeTeam = game.homeTeam.toLowerCase();
  const awayTeam = game.awayTeam.toLowerCase();

  // Check team names in news
  const homeWords = homeTeam.split(" ");
  const awayWords = awayTeam.split(" ");

  // Match on team city or team name (e.g., "Chiefs" or "Kansas City")
  const homeMatch = homeWords.some(word => word.length > 3 && newsText.includes(word));
  const awayMatch = awayWords.some(word => word.length > 3 && newsText.includes(word));

  // Also check the teams array from news parsing
  const teamsMatch = newsItem.teams.some(team =>
    homeTeam.includes(team.toLowerCase()) ||
    awayTeam.includes(team.toLowerCase()) ||
    team.toLowerCase().split(" ").some(word => word.length > 3 && (homeTeam.includes(word) || awayTeam.includes(word)))
  );

  return homeMatch || awayMatch || teamsMatch;
}

// Helper to check if movement is related to a game
function isMovementRelatedToGame(movement: LineMovement, game: GameOdds): boolean {
  return movement.eventId === game.eventId ||
    (movement.homeTeam === game.homeTeam && movement.awayTeam === game.awayTeam);
}

interface GameGroup {
  game: GameOdds;
  weather?: GameWeather;
  relatedNews: NewsItem[];
  relatedMovements: LineMovement[];
}

export function UnifiedFeed({ games, movements, news, weatherData }: Props) {
  const [sportFilter, setSportFilter] = useState<SportFilter>("all");
  const [contentFilters, setContentFilters] = useState<Set<ContentFilter>>(
    new Set(["games", "movements", "news"])
  );

  // Group games with their related news and movements
  const { gameGroups, orphanNews, orphanMovements } = useMemo(() => {
    const usedNewsIds = new Set<string>();
    const usedMovementIds = new Set<string>();

    // Create game groups with related content
    const groups: GameGroup[] = games.map((game) => {
      const relatedNews = news.filter((n) => {
        if (n.sport !== game.sport && n.sport !== "General") return false;
        return isNewsRelatedToGame(n, game);
      });

      const relatedMovements = movements.filter((m) => isMovementRelatedToGame(m, game));

      // Track which news/movements are used
      relatedNews.forEach((n) => usedNewsIds.add(n.id));
      relatedMovements.forEach((m, idx) => usedMovementIds.add(`${m.eventId}-${idx}`));

      return {
        game,
        weather: weatherData[game.homeTeam],
        relatedNews,
        relatedMovements,
      };
    });

    // Get orphan news (not related to any game)
    const orphanNews = news.filter((n) => !usedNewsIds.has(n.id));

    // Get orphan movements (not related to any game - shouldn't happen often)
    const orphanMovements = movements.filter((m, idx) => !usedMovementIds.has(`${m.eventId}-${idx}`));

    return { gameGroups: groups, orphanNews, orphanMovements };
  }, [games, movements, news, weatherData]);

  // Filter and sort game groups
  const filteredGameGroups = useMemo(() => {
    if (!contentFilters.has("games")) return [];

    return gameGroups
      .filter((group) => {
        if (sportFilter === "all") return true;
        return group.game.sport.toLowerCase() === sportFilter;
      })
      .sort((a, b) => {
        // Sort by game start time (earliest first)
        return new Date(a.game.eventStartTime).getTime() - new Date(b.game.eventStartTime).getTime();
      });
  }, [gameGroups, sportFilter, contentFilters]);

  // Filter orphan news
  const filteredOrphanNews = useMemo(() => {
    if (!contentFilters.has("news")) return [];

    return orphanNews.filter((n) => {
      if (sportFilter === "all") return true;
      if (n.sport === "General") return true;
      return n.sport.toLowerCase() === sportFilter;
    });
  }, [orphanNews, sportFilter, contentFilters]);

  // Filter orphan movements
  const filteredOrphanMovements = useMemo(() => {
    if (!contentFilters.has("movements")) return [];

    return orphanMovements.filter((m) => {
      if (sportFilter === "all") return true;
      return m.sport.toLowerCase() === sportFilter;
    });
  }, [orphanMovements, sportFilter, contentFilters]);

  const toggleContentFilter = (filter: ContentFilter) => {
    setContentFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        if (next.size > 1) {
          next.delete(filter);
        }
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  // Count items by type
  const counts = useMemo(() => ({
    games: games.length,
    movements: movements.length,
    news: news.length,
  }), [games, movements, news]);

  const hasContent = filteredGameGroups.length > 0 || filteredOrphanNews.length > 0 || filteredOrphanMovements.length > 0;

  return (
    <div>
      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Sport Filters - horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <div className="flex items-center gap-1.5 pb-1 sm:flex-wrap sm:pb-0">
            {(["all", "nfl", "nba", "mlb", "nhl", "mma", "soccer"] as SportFilter[]).map((sport) => {
              const isActive = sportFilter === sport;
              const emoji = sport === "all" ? "🎯" : sport === "nfl" ? "🏈" : sport === "nba" ? "🏀" : sport === "mlb" ? "⚾" : sport === "nhl" ? "🏒" : sport === "mma" ? "🥊" : "⚽";
              const label = sport === "all" ? "All" : sport.toUpperCase();

              return (
                <button
                  key={sport}
                  onClick={() => setSportFilter(sport)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all active:scale-95 flex items-center gap-1 ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-sm">{emoji}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Type Filters */}
        <div className="flex items-center gap-1.5">
          {(["games", "movements", "news"] as ContentFilter[]).map((filter) => {
            const isActive = contentFilters.has(filter);
            const count = counts[filter];
            const label = filter === "games" ? "Games" : filter === "movements" ? "Moves" : "News";

            return (
              <button
                key={filter}
                onClick={() => toggleContentFilter(filter)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 flex items-center gap-1 ${
                  isActive
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-gray-50 text-gray-400 border border-gray-100"
                }`}
              >
                {label}
                <span className={`text-[10px] px-1 py-0.5 rounded ${isActive ? "bg-purple-100" : "bg-gray-100"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      {hasContent ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Game Groups with related content */}
          {filteredGameGroups.map((group) => (
            <div key={group.game.eventId} className="space-y-2">
              {/* Game Card */}
              <GameFeedCard game={group.game} weather={group.weather} relatedNews={group.relatedNews} />

              {/* Related Movements */}
              {contentFilters.has("movements") && group.relatedMovements.length > 0 && (
                <div className="ml-2 sm:ml-4 pl-3 sm:pl-4 border-l-2 border-purple-200 space-y-2">
                  {group.relatedMovements.slice(0, 3).map((movement, idx) => (
                    <MovementFeedCard key={`${movement.eventId}-${idx}`} movement={movement} />
                  ))}
                </div>
              )}

              {/* Related News */}
              {contentFilters.has("news") && group.relatedNews.length > 0 && (
                <div className="ml-2 sm:ml-4 pl-3 sm:pl-4 border-l-2 border-blue-200 space-y-2">
                  {group.relatedNews.slice(0, 3).map((newsItem) => (
                    <NewsFeedCard key={newsItem.id} news={newsItem} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Orphan Movements (not tied to a game) */}
          {filteredOrphanMovements.length > 0 && (
            <div className="space-y-2">
              {filteredOrphanMovements.map((movement, idx) => (
                <MovementFeedCard key={`orphan-${movement.eventId}-${idx}`} movement={movement} />
              ))}
            </div>
          )}

          {/* Orphan News (general sports news not tied to a specific game) */}
          {filteredOrphanNews.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-[--text-secondary] px-1 pt-4">
                More News
              </div>
              {filteredOrphanNews.map((newsItem) => (
                <NewsFeedCard key={newsItem.id} news={newsItem} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="text-[14px] font-semibold text-gray-900 mb-1">No items found</h3>
          <p className="text-[12px] text-gray-500">
            Try adjusting your filters
          </p>
        </div>
      )}
    </div>
  );
}
