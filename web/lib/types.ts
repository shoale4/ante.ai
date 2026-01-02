export interface OddsSnapshot {
  book: string;
  sport: string;
  eventId: string;
  eventStartTime: string;
  homeTeam: string;
  awayTeam: string;
  marketType: "moneyline" | "spread" | "total";
  outcome: "home" | "away" | "over" | "under";
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
