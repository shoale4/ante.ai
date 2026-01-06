"use client";

import { useState, useMemo } from "react";
import { GameOdds, LineMovement, Sport } from "@/lib/types";
import { NewsItem } from "@/lib/news";
import { GameWeather } from "@/lib/weather";
import { GameFeedCard, MovementFeedCard, NewsFeedCard } from "./feed";

type SportFilter = Sport | "all";
type TabType = "games" | "news" | "movements";

const SPORT_OPTIONS: { value: SportFilter; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "🎯" },
  { value: "NFL", label: "NFL", emoji: "🏈" },
  { value: "NBA", label: "NBA", emoji: "🏀" },
  { value: "MLB", label: "MLB", emoji: "⚾" },
  { value: "NHL", label: "NHL", emoji: "🏒" },
  { value: "MMA", label: "MMA", emoji: "🥊" },
  { value: "Soccer", label: "Soccer", emoji: "⚽" },
];

interface Props {
  games: GameOdds[];
  movements: LineMovement[];
  news: NewsItem[];
  weatherData: Record<string, GameWeather>;
  onWaitlist?: () => void;
}

export function UnifiedFeed({ games, movements, news, weatherData, onWaitlist }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("games");
  const [sportFilter, setSportFilter] = useState<SportFilter>("all");

  // Filter data by sport
  const filteredGames = useMemo(() => {
    if (sportFilter === "all") return games;
    return games.filter((g) => g.sport === sportFilter);
  }, [games, sportFilter]);

  const filteredMovements = useMemo(() => {
    if (sportFilter === "all") return movements;
    return movements.filter((m) => m.sport === sportFilter);
  }, [movements, sportFilter]);

  const filteredNews = useMemo(() => {
    if (sportFilter === "all") return news;
    return news.filter((n) => n.sport === sportFilter || n.sport === "General");
  }, [news, sportFilter]);

  // Get counts for tabs
  const counts = {
    games: filteredGames.length,
    news: filteredNews.length,
    movements: filteredMovements.length,
  };

  // Available sports based on data
  const availableSports = useMemo(() => {
    const sports = new Set<string>();
    games.forEach((g) => sports.add(g.sport));
    movements.forEach((m) => sports.add(m.sport));
    news.forEach((n) => n.sport !== "General" && sports.add(n.sport));
    return SPORT_OPTIONS.filter((s) => s.value === "all" || sports.has(s.value));
  }, [games, movements, news]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">Feed</h3>
            <p className="text-[11px] text-gray-500">Games, news & line moves</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            {counts.games + counts.news + counts.movements} items
          </span>
        </div>
      </div>

      {/* Sport Filter - Horizontal scroll on mobile */}
      {availableSports.length > 2 && (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <div className="flex gap-1.5 pb-1">
            {availableSports.map((sport) => (
              <button
                key={sport.value}
                onClick={() => setSportFilter(sport.value)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-1 ${
                  sportFilter === sport.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="text-[10px]">{sport.emoji}</span>
                <span>{sport.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        <TabButton
          active={activeTab === "games"}
          onClick={() => setActiveTab("games")}
          label="Games"
          count={counts.games}
        />
        <TabButton
          active={activeTab === "news"}
          onClick={() => setActiveTab("news")}
          label="News"
          count={counts.news}
        />
        <TabButton
          active={activeTab === "movements"}
          onClick={() => setActiveTab("movements")}
          label="Moves"
          count={counts.movements}
        />
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === "games" && (
          <GamesTab games={filteredGames} weatherData={weatherData} news={news} onWaitlist={onWaitlist} />
        )}
        {activeTab === "news" && <NewsTab news={filteredNews} />}
        {activeTab === "movements" && <MovementsTab movements={filteredMovements} />}
      </div>
    </div>
  );
}

// Tab button component
function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all active:scale-[0.98] ${
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-md ${
          active ? "bg-gray-100 text-gray-600" : "bg-gray-200/50 text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// Games Tab
function GamesTab({
  games,
  weatherData,
  news,
  onWaitlist,
}: {
  games: GameOdds[];
  weatherData: Record<string, GameWeather>;
  news: NewsItem[];
  onWaitlist?: () => void;
}) {
  if (games.length === 0) {
    return <EmptyState emoji="🏟️" title="No games" subtitle="Check back later for upcoming games" />;
  }

  // Sort by game time
  const sortedGames = [...games].sort(
    (a, b) => new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime()
  );

  // Find related news for each game
  const getRelatedNews = (game: GameOdds) => {
    return news.filter((n) => {
      if (n.sport !== game.sport && n.sport !== "General") return false;
      const text = (n.title + " " + n.summary).toLowerCase();
      const homeWords = game.homeTeam.toLowerCase().split(" ");
      const awayWords = game.awayTeam.toLowerCase().split(" ");
      return homeWords.some((w) => w.length > 3 && text.includes(w)) ||
        awayWords.some((w) => w.length > 3 && text.includes(w));
    }).slice(0, 2);
  };

  return (
    <div className="space-y-3">
      {sortedGames.map((game) => (
        <GameFeedCard
          key={game.eventId}
          game={game}
          weather={weatherData[game.homeTeam]}
          relatedNews={getRelatedNews(game)}
          onWaitlist={onWaitlist}
        />
      ))}
    </div>
  );
}

// News Tab
function NewsTab({ news }: { news: NewsItem[] }) {
  if (news.length === 0) {
    return <EmptyState emoji="📰" title="No news" subtitle="Check back later for updates" />;
  }

  return (
    <div className="space-y-2">
      {news.map((item) => (
        <NewsFeedCard key={item.id} news={item} />
      ))}
    </div>
  );
}

// Movements Tab
function MovementsTab({ movements }: { movements: LineMovement[] }) {
  if (movements.length === 0) {
    return <EmptyState emoji="📊" title="No line movements" subtitle="Lines are stable right now" />;
  }

  // Group by game
  const groupedMovements = movements.reduce((acc, m) => {
    const key = `${m.homeTeam}-${m.awayTeam}`;
    if (!acc[key]) {
      acc[key] = {
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        sport: m.sport,
        eventStartTime: m.eventStartTime,
        movements: [],
      };
    }
    acc[key].movements.push(m);
    return acc;
  }, {} as Record<string, { homeTeam: string; awayTeam: string; sport: string; eventStartTime: string; movements: LineMovement[] }>);

  return (
    <div className="space-y-3">
      {Object.values(groupedMovements).map((group, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Game Header */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-900">
                  {group.awayTeam.split(" ").pop()} @ {group.homeTeam.split(" ").pop()}
                </span>
                <span className="text-[10px] text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
                  {group.sport}
                </span>
              </div>
              <span className="text-[10px] text-gray-400">
                {group.movements.length} move{group.movements.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {/* Movements */}
          <div className="divide-y divide-gray-50">
            {group.movements.slice(0, 5).map((movement, mIdx) => (
              <MovementFeedCard key={mIdx} movement={movement} compact />
            ))}
          </div>
          {group.movements.length > 5 && (
            <div className="px-3 py-2 text-center border-t border-gray-100">
              <span className="text-[10px] text-gray-400">+{group.movements.length - 5} more</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Empty state component
function EmptyState({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-8 text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{title}</h3>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
