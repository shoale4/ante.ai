"use client";

import { getSportsbook } from "@/lib/sportsbooks";

interface BookLinkProps {
  book: string;
  className?: string;
  showIcon?: boolean;
}

export function BookLink({ book, className = "", showIcon = false }: BookLinkProps) {
  const sportsbook = getSportsbook(book);

  return (
    <a
      href={sportsbook.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 hover:underline transition-colors ${className}`}
      style={{ color: sportsbook.color }}
      title={`Bet on ${sportsbook.displayName}`}
    >
      <span className="capitalize font-medium">{sportsbook.displayName}</span>
      {showIcon && (
        <svg
          className="w-3 h-3 opacity-60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </a>
  );
}

// Simple text version for tables
export function BookName({ book, className = "" }: { book: string; className?: string }) {
  const sportsbook = getSportsbook(book);

  return (
    <a
      href={sportsbook.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`capitalize font-medium hover:underline ${className}`}
      title={`Bet on ${sportsbook.displayName}`}
    >
      {sportsbook.displayName}
    </a>
  );
}
