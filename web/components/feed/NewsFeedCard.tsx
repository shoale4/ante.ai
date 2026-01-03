"use client";

import { NewsItem } from "@/lib/news";

interface Props {
  news: NewsItem;
}

export function NewsFeedCard({ news }: Props) {
  const timeAgo = getTimeAgo(news.publishedAt);

  const categoryConfig = {
    injury: { icon: "🏥", bg: "bg-red-100", text: "text-red-700" },
    trade: { icon: "🔄", bg: "bg-purple-100", text: "text-purple-700" },
    lineup: { icon: "📋", bg: "bg-blue-100", text: "text-blue-700" },
    weather: { icon: "🌦️", bg: "bg-cyan-100", text: "text-cyan-700" },
    general: { icon: "📰", bg: "bg-gray-100", text: "text-gray-700" },
  };

  const config = categoryConfig[news.category] || categoryConfig.general;

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card glass-card-hover block p-4 cursor-pointer"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              news.isBreaking
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
            }`}
          >
            {news.isBreaking ? "BREAKING" : "NEWS"}
          </span>
          <span
            className={`text-xs font-medium ${
              news.sport === "NFL"
                ? "text-blue-600"
                : news.sport === "NBA"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {news.sport}
          </span>
          {news.teams.length > 0 && (
            <span className="text-xs text-[--text-secondary]">
              {news.teams.slice(0, 2).join(", ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[--text-secondary]">{timeAgo}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-[--foreground] leading-snug mb-1">
        {news.title}
      </h3>

      {/* Summary */}
      {news.summary && (
        <p className="text-sm text-[--text-secondary] line-clamp-2 mb-2">
          {news.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span>{news.sourceIcon}</span>
          <span>{news.source}</span>
        </span>
        {news.sentiment !== "neutral" && (
          <span
            className={`px-1.5 py-0.5 rounded ${
              news.sentiment === "negative"
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {news.sentiment === "negative" ? "📉" : "📈"} {news.sentiment}
          </span>
        )}
        <span className={`px-1.5 py-0.5 rounded ${config.bg} ${config.text}`}>
          {news.category}
        </span>
      </div>
    </a>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
