"use client";

import { NewsItem } from "@/lib/news";

interface Props {
  news: NewsItem;
}

export function NewsFeedCard({ news }: Props) {
  const timeAgo = getTimeAgo(news.publishedAt);

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl border border-gray-100 hover:border-gray-200 p-3 cursor-pointer active:scale-[0.99] transition-all"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          news.category === "injury" ? "bg-red-50" :
          news.category === "trade" ? "bg-purple-50" :
          news.category === "lineup" ? "bg-blue-50" :
          "bg-gray-50"
        }`}>
          <span className="text-sm">
            {news.category === "injury" ? "🏥" :
             news.category === "trade" ? "🔄" :
             news.category === "lineup" ? "📋" :
             news.category === "weather" ? "🌦️" : "📰"}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1">
            {news.isBreaking && (
              <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase">
                Breaking
              </span>
            )}
            <span className="text-[10px] text-gray-400">{news.sport}</span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className="text-[10px] text-gray-400">{timeAgo}</span>
          </div>

          {/* Title */}
          <h3 className="text-[13px] font-medium text-gray-900 leading-snug line-clamp-2">
            {news.title}
          </h3>

          {/* Footer */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-gray-400">
              {news.sourceIcon} {news.source}
            </span>
            {news.teams.length > 0 && (
              <>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px] text-gray-400 truncate">
                  {news.teams.slice(0, 2).join(", ")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
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

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}
