export interface OddsSnapshot {
  book: string;
  sport: string;
  eventId: string;
  eventStartTime: string;
  homeTeam: string;
  awayTeam: string;
  marketType: "moneyline" | "spread" | "total" | "futures";
  outcome: string; // home/away/draw/over/under for games, team name for futures
  openingPrice: number;
  currentPrice: number;
  priceMovement: number;
  openingLine: number | null;
  currentLine: number | null;
  lineMovement: number | null;
  lastUpdated: string;
}

export interface GameOdds {
  eventId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  eventStartTime: string;
  markets: {
    moneyline: BookOdds[];
    spread: BookOdds[];
    total: BookOdds[];
  };
}

export interface BookOdds {
  book: string;
  outcome: string;
  openingPrice: number;
  currentPrice: number;
  priceMovement: number;
  openingLine: number | null;
  currentLine: number | null;
  lineMovement: number | null;
  lastUpdated: string;
}

export interface LineMovement {
  eventId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  eventStartTime: string;
  marketType: string;
  outcome: string;
  book: string;
  openingPrice: number;
  currentPrice: number;
  priceMovement: number;
  openingLine: number | null;
  currentLine: number | null;
  lineMovement: number | null;
  lastUpdated: string;
}

export interface PlayerProp {
  eventId: string;
  playerName: string;
  propType: string;
  line: number;
  books: PlayerPropBook[];
}

export interface PlayerPropBook {
  book: string;
  overPrice: number;
  underPrice: number;
}

// Unified feed item types
import type { NewsItem } from "./news";
import type { GameWeather } from "./weather";

export type FeedItemType = "game" | "movement" | "news";

export type Sport = "NFL" | "NBA" | "NCAAB" | "MLB" | "NHL" | "MMA" | "Soccer";

export interface GameFeedItem {
  type: "game";
  id: string;
  sport: Sport;
  timestamp: Date;
  data: GameOdds;
  weather?: GameWeather;
}

export interface MovementFeedItem {
  type: "movement";
  id: string;
  sport: Sport;
  timestamp: Date;
  data: LineMovement;
}

export interface NewsFeedItem {
  type: "news";
  id: string;
  sport: Sport | "General";
  timestamp: Date;
  data: NewsItem;
}

export type FeedItem = GameFeedItem | MovementFeedItem | NewsFeedItem;
