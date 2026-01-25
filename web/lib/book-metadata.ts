/**
 * Book Metadata Loader
 *
 * Loads sportsbook metadata for filtering and risk assessment.
 */

import { readFileSync } from "fs";
import { join } from "path";

export interface BookInfo {
  displayName: string;
  supportsOnline: boolean;
  tier: 1 | 2 | 3;
  states: string[];
  notes?: string;
}

export interface TierInfo {
  description: string;
  trustLevel: string;
  notes: string;
}

export interface BookMetadataDefaults {
  blockedBooks: string[];
  warningBooks: string[];
  freshnessByTier: Record<string, number>;
}

export interface BookMetadata {
  books: Record<string, BookInfo>;
  tiers: Record<string, TierInfo>;
  defaults: BookMetadataDefaults;
  lastUpdated: string;
}

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/shoale4/hedj/main/data/book_metadata.json";

const isDev = process.env.NODE_ENV === "development";

let cachedMetadata: BookMetadata | null = null;

/**
 * Load book metadata from file or GitHub.
 */
export async function loadBookMetadata(): Promise<BookMetadata> {
  if (cachedMetadata) {
    return cachedMetadata;
  }

  try {
    let content: string;

    if (isDev) {
      const localPath = join(process.cwd(), "..", "data", "book_metadata.json");
      content = readFileSync(localPath, "utf-8");
    } else {
      const response = await fetch(GITHUB_RAW_URL, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        console.error("Failed to fetch book metadata:", response.status);
        return getDefaultMetadata();
      }

      content = await response.text();
    }

    cachedMetadata = JSON.parse(content) as BookMetadata;
    return cachedMetadata;
  } catch (error) {
    console.error("Error loading book metadata:", error);
    return getDefaultMetadata();
  }
}

/**
 * Get default metadata if loading fails.
 */
function getDefaultMetadata(): BookMetadata {
  return {
    books: {},
    tiers: {
      "1": { description: "Major books", trustLevel: "high", notes: "" },
      "2": { description: "Secondary books", trustLevel: "medium", notes: "" },
      "3": { description: "Other books", trustLevel: "low", notes: "" },
    },
    defaults: {
      blockedBooks: [],
      warningBooks: [],
      freshnessByTier: { "1": 180, "2": 240, "3": 300 },
    },
    lastUpdated: "",
  };
}

/**
 * Get info for a specific book.
 */
export function getBookInfo(
  metadata: BookMetadata,
  bookName: string
): BookInfo | null {
  const normalized = bookName.toLowerCase().replace(/[\s-]/g, "");
  return metadata.books[normalized] || null;
}

/**
 * Check if a book supports online betting.
 */
export function bookSupportsOnline(
  metadata: BookMetadata,
  bookName: string
): boolean {
  const info = getBookInfo(metadata, bookName);
  return info?.supportsOnline ?? true; // Default to true if unknown
}

/**
 * Check if a book is available in a specific state.
 */
export function bookAvailableInState(
  metadata: BookMetadata,
  bookName: string,
  stateAbbr: string
): boolean {
  const info = getBookInfo(metadata, bookName);
  if (!info) return true; // Unknown books default to available
  if (info.states.length === 0) return false; // Offshore books with no states
  return info.states.includes(stateAbbr.toUpperCase());
}

/**
 * Check if a book is blocked by default.
 */
export function isBookBlocked(
  metadata: BookMetadata,
  bookName: string
): boolean {
  const normalized = bookName.toLowerCase().replace(/[\s-]/g, "");
  return metadata.defaults.blockedBooks.includes(normalized);
}

/**
 * Check if a book should show a warning.
 */
export function shouldWarnBook(
  metadata: BookMetadata,
  bookName: string
): boolean {
  const normalized = bookName.toLowerCase().replace(/[\s-]/g, "");
  return metadata.defaults.warningBooks.includes(normalized);
}

/**
 * Get freshness threshold for a book based on tier.
 */
export function getBookFreshnessThreshold(
  metadata: BookMetadata,
  bookName: string
): number {
  const info = getBookInfo(metadata, bookName);
  const tier = info?.tier?.toString() ?? "2";
  return metadata.defaults.freshnessByTier[tier] ?? 180;
}

/**
 * Get book tier (1 = major, 2 = secondary, 3 = offshore/deprecated).
 */
export function getBookTier(
  metadata: BookMetadata,
  bookName: string
): 1 | 2 | 3 {
  const info = getBookInfo(metadata, bookName);
  return info?.tier ?? 2;
}

/**
 * Filter books by state availability.
 */
export function filterBooksByState(
  metadata: BookMetadata,
  bookNames: string[],
  stateAbbr: string
): string[] {
  return bookNames.filter((book) =>
    bookAvailableInState(metadata, book, stateAbbr)
  );
}

/**
 * Get all blocked and warning books.
 */
export function getProblematicBooks(metadata: BookMetadata): {
  blocked: string[];
  warning: string[];
} {
  return {
    blocked: metadata.defaults.blockedBooks,
    warning: metadata.defaults.warningBooks,
  };
}

/**
 * Convert metadata to ArbitrageConfig format.
 */
export function toArbitrageConfig(
  metadata: BookMetadata,
  userState?: string
): {
  blockedBooks: string[];
  onlineOnly: boolean;
  bookMetadata: Record<string, { supportsOnline: boolean; notes?: string }>;
} {
  const blockedBooks = [...metadata.defaults.blockedBooks];

  // If user state is provided, block books not available there
  if (userState) {
    for (const [bookName, info] of Object.entries(metadata.books)) {
      if (
        info.states.length > 0 &&
        !info.states.includes(userState.toUpperCase())
      ) {
        if (!blockedBooks.includes(bookName)) {
          blockedBooks.push(bookName);
        }
      }
    }
  }

  const bookMetadata: Record<
    string,
    { supportsOnline: boolean; notes?: string }
  > = {};
  for (const [bookName, info] of Object.entries(metadata.books)) {
    bookMetadata[bookName] = {
      supportsOnline: info.supportsOnline,
      notes: info.notes,
    };
  }

  return {
    blockedBooks,
    onlineOnly: true,
    bookMetadata,
  };
}
