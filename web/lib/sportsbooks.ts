// Sportsbook affiliate links and branding
// Replace placeholder URLs with your actual affiliate links

export interface Sportsbook {
  name: string;
  displayName: string;
  affiliateUrl: string;
  color: string;
  logo?: string;
}

// TODO: Replace these with your actual affiliate/referral links
// Sign up for affiliate programs at:
// - FanDuel: https://www.fanduel.com/affiliates
// - DraftKings: https://www.draftkings.com/affiliates
// - BetMGM: https://promo.betmgm.com/en/affiliates
// - Caesars: https://www.caesars.com/sportsbook/affiliates
// - bet365: https://www.bet365affiliates.com
// - PointsBet: https://www.pointsbet.com/affiliates
// - BetOnline: https://affiliates.betonline.ag

export const SPORTSBOOKS: Record<string, Sportsbook> = {
  fanduel: {
    name: "fanduel",
    displayName: "FanDuel",
    affiliateUrl: "https://www.fanduel.com/", // Add ?ref=YOUR_ID
    color: "#1493ff",
  },
  draftkings: {
    name: "draftkings",
    displayName: "DraftKings",
    affiliateUrl: "https://www.draftkings.com/", // Add ?ref=YOUR_ID
    color: "#53d337",
  },
  betmgm: {
    name: "betmgm",
    displayName: "BetMGM",
    affiliateUrl: "https://www.betmgm.com/", // Add ?ref=YOUR_ID
    color: "#c4a962",
  },
  caesars: {
    name: "caesars",
    displayName: "Caesars",
    affiliateUrl: "https://www.caesars.com/sportsbook/", // Add ?ref=YOUR_ID
    color: "#0a3d2d",
  },
  pointsbetus: {
    name: "pointsbetus",
    displayName: "PointsBet",
    affiliateUrl: "https://www.pointsbet.com/", // Add ?ref=YOUR_ID
    color: "#ed1c24",
  },
  bet365: {
    name: "bet365",
    displayName: "bet365",
    affiliateUrl: "https://www.bet365.com/", // Add ?ref=YOUR_ID
    color: "#027b5b",
  },
  betonlineag: {
    name: "betonlineag",
    displayName: "BetOnline",
    affiliateUrl: "https://www.betonline.ag/", // Add ?ref=YOUR_ID
    color: "#8b0000",
  },
  bovada: {
    name: "bovada",
    displayName: "Bovada",
    affiliateUrl: "https://www.bovada.lv/", // Add ?ref=YOUR_ID
    color: "#cc0000",
  },
  williamhill_us: {
    name: "williamhill_us",
    displayName: "William Hill",
    affiliateUrl: "https://www.williamhill.com/us/", // Add ?ref=YOUR_ID
    color: "#00205b",
  },
  unibet_us: {
    name: "unibet_us",
    displayName: "Unibet",
    affiliateUrl: "https://www.unibet.com/", // Add ?ref=YOUR_ID
    color: "#147b45",
  },
  wynnbet: {
    name: "wynnbet",
    displayName: "WynnBET",
    affiliateUrl: "https://www.wynnbet.com/", // Add ?ref=YOUR_ID
    color: "#c5a572",
  },
  superbook: {
    name: "superbook",
    displayName: "SuperBook",
    affiliateUrl: "https://www.superbook.com/", // Add ?ref=YOUR_ID
    color: "#1a1a1a",
  },
  betrivers: {
    name: "betrivers",
    displayName: "BetRivers",
    affiliateUrl: "https://www.betrivers.com/", // Add ?ref=YOUR_ID
    color: "#003da5",
  },
  foxbet: {
    name: "foxbet",
    displayName: "FOX Bet",
    affiliateUrl: "https://www.foxbet.com/", // Add ?ref=YOUR_ID
    color: "#003087",
  },
  barstool: {
    name: "barstool",
    displayName: "Barstool",
    affiliateUrl: "https://www.barstoolsportsbook.com/", // Add ?ref=YOUR_ID
    color: "#000000",
  },
};

export function getSportsbook(bookName: string): Sportsbook {
  const normalized = bookName.toLowerCase().replace(/[\s-]/g, "");
  return (
    SPORTSBOOKS[normalized] || {
      name: bookName,
      displayName: bookName.charAt(0).toUpperCase() + bookName.slice(1),
      affiliateUrl: "#",
      color: "#666666",
    }
  );
}

export function getAffiliateUrl(bookName: string): string {
  return getSportsbook(bookName).affiliateUrl;
}

export function getBookColor(bookName: string): string {
  return getSportsbook(bookName).color;
}

export function getBookDisplayName(bookName: string): string {
  return getSportsbook(bookName).displayName;
}
