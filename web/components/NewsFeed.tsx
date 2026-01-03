"use client";

import { NewsItem } from "@/lib/news";

interface Props {
  news: NewsItem[];
}

export function NewsFeed({ news }: Props) {
  if (news.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-3">📰</div>
        <p className="text-[--text-secondary] font-medium">
          No breaking news right now
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const timeAgo = getTimeAgo(item.publishedAt);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card glass-card-hover block p-4 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Category Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
            item.category === "injury"
              ? "bg-red-100"
              : item.category === "trade"
              ? "bg-purple-100"
              : item.category === "weather"
              ? "bg-blue-100"
              : "bg-gray-100"
          }`}
        >
          {item.category === "injury"
            ? "🏥"
            : item.category === "trade"
            ? "🔄"
            : item.category === "weather"
            ? "🌦️"
            : "📰"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            {item.isBreaking && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded uppercase">
                Breaking
              </span>
            )}
            <span
              className={`text-xs font-medium ${
                item.sport === "NFL"
                  ? "text-blue-600"
                  : item.sport === "NBA"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {item.sport}
            </span>
            {item.teams.length > 0 && (
              <span className="text-xs text-gray-400">
                {item.teams.slice(0, 2).join(", ")}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[--foreground] leading-tight mb-1">
            {item.title}
          </h3>

          {/* Summary */}
          <p className="text-sm text-[--text-secondary] line-clamp-2">
            {item.summary}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              {item.sourceIcon} {item.source}
            </span>
            <span>{timeAgo}</span>
            {item.sentiment !== "neutral" && (
              <span
                className={`px-1.5 py-0.5 rounded ${
                  item.sentiment === "negative"
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {item.sentiment === "negative" ? "📉" : "📈"} {item.sentiment}
              </span>
            )}
          </div>
        </div>
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
