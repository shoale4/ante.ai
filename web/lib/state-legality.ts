// Sports betting legality by US state
// Data as of January 2026 - verify for accuracy

export interface StateInfo {
  name: string;
  abbr: string;
  legal: boolean;
  legalBooks: string[]; // Books available in this state
  notes?: string;
}

// Books we track (lowercase keys)
const ALL_BOOKS = [
  "fanduel", "draftkings", "betmgm", "caesars", "pointsbetus",
  "bet365", "betonlineag", "betrivers", "espnbet", "wynnbet"
];

export const US_STATES: Record<string, StateInfo> = {
  AL: { name: "Alabama", abbr: "AL", legal: false, legalBooks: [], notes: "Not legal" },
  AK: { name: "Alaska", abbr: "AK", legal: false, legalBooks: [], notes: "Not legal" },
  AZ: { name: "Arizona", abbr: "AZ", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "betrivers", "espnbet", "wynnbet"] },
  AR: { name: "Arkansas", abbr: "AR", legal: true, legalBooks: ["betmgm", "draftkings", "fanduel"], notes: "Retail & mobile" },
  CA: { name: "California", abbr: "CA", legal: false, legalBooks: [], notes: "Not legal" },
  CO: { name: "Colorado", abbr: "CO", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet", "wynnbet"] },
  CT: { name: "Connecticut", abbr: "CT", legal: true, legalBooks: ["fanduel", "draftkings"] },
  DE: { name: "Delaware", abbr: "DE", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm"], notes: "Limited options" },
  FL: { name: "Florida", abbr: "FL", legal: false, legalBooks: [], notes: "Legal status uncertain" },
  GA: { name: "Georgia", abbr: "GA", legal: false, legalBooks: [], notes: "Not legal" },
  HI: { name: "Hawaii", abbr: "HI", legal: false, legalBooks: [], notes: "Not legal" },
  ID: { name: "Idaho", abbr: "ID", legal: false, legalBooks: [], notes: "Not legal" },
  IL: { name: "Illinois", abbr: "IL", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet"] },
  IN: { name: "Indiana", abbr: "IN", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet", "wynnbet"] },
  IA: { name: "Iowa", abbr: "IA", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet"] },
  KS: { name: "Kansas", abbr: "KS", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet"] },
  KY: { name: "Kentucky", abbr: "KY", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "espnbet", "betrivers"] },
  LA: { name: "Louisiana", abbr: "LA", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "betrivers", "espnbet"] },
  ME: { name: "Maine", abbr: "ME", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars"] },
  MD: { name: "Maryland", abbr: "MD", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet"] },
  MA: { name: "Massachusetts", abbr: "MA", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "espnbet", "betrivers", "wynnbet"] },
  MI: { name: "Michigan", abbr: "MI", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet", "wynnbet"] },
  MN: { name: "Minnesota", abbr: "MN", legal: false, legalBooks: [], notes: "Not legal" },
  MS: { name: "Mississippi", abbr: "MS", legal: true, legalBooks: ["betmgm", "caesars", "fanduel"], notes: "Retail only, no mobile" },
  MO: { name: "Missouri", abbr: "MO", legal: false, legalBooks: [], notes: "Not legal yet" },
  MT: { name: "Montana", abbr: "MT", legal: true, legalBooks: [], notes: "State-run only" },
  NE: { name: "Nebraska", abbr: "NE", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm"], notes: "Limited options" },
  NV: { name: "Nevada", abbr: "NV", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "betrivers", "wynnbet"], notes: "In-person registration required for most" },
  NH: { name: "New Hampshire", abbr: "NH", legal: true, legalBooks: ["draftkings", "betmgm"] },
  NJ: { name: "New Jersey", abbr: "NJ", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet", "wynnbet"] },
  NM: { name: "New Mexico", abbr: "NM", legal: true, legalBooks: [], notes: "Tribal only" },
  NY: { name: "New York", abbr: "NY", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet", "wynnbet"] },
  NC: { name: "North Carolina", abbr: "NC", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "espnbet", "betrivers"] },
  ND: { name: "North Dakota", abbr: "ND", legal: false, legalBooks: [], notes: "Not legal" },
  OH: { name: "Ohio", abbr: "OH", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet"] },
  OK: { name: "Oklahoma", abbr: "OK", legal: false, legalBooks: [], notes: "Tribal only" },
  OR: { name: "Oregon", abbr: "OR", legal: true, legalBooks: ["draftkings", "betmgm"], notes: "Limited options" },
  PA: { name: "Pennsylvania", abbr: "PA", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet", "wynnbet"] },
  RI: { name: "Rhode Island", abbr: "RI", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm"] },
  SC: { name: "South Carolina", abbr: "SC", legal: false, legalBooks: [], notes: "Not legal" },
  SD: { name: "South Dakota", abbr: "SD", legal: true, legalBooks: [], notes: "Retail only" },
  TN: { name: "Tennessee", abbr: "TN", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "espnbet", "betrivers"] },
  TX: { name: "Texas", abbr: "TX", legal: false, legalBooks: [], notes: "Not legal" },
  UT: { name: "Utah", abbr: "UT", legal: false, legalBooks: [], notes: "Not legal" },
  VT: { name: "Vermont", abbr: "VT", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm"] },
  VA: { name: "Virginia", abbr: "VA", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet"] },
  WA: { name: "Washington", abbr: "WA", legal: true, legalBooks: [], notes: "Tribal only" },
  WV: { name: "West Virginia", abbr: "WV", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "espnbet"] },
  WI: { name: "Wisconsin", abbr: "WI", legal: false, legalBooks: [], notes: "Not legal" },
  WY: { name: "Wyoming", abbr: "WY", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm"] },
  DC: { name: "Washington DC", abbr: "DC", legal: true, legalBooks: ["fanduel", "draftkings", "betmgm", "caesars"] },
};

export function getStateInfo(abbr: string): StateInfo | null {
  return US_STATES[abbr.toUpperCase()] || null;
}

export function isBookAvailable(stateAbbr: string, bookName: string): boolean {
  const state = US_STATES[stateAbbr.toUpperCase()];
  if (!state) return true; // Unknown state, show all
  if (!state.legal) return false;
  if (state.legalBooks.length === 0) return false; // State-run or tribal only
  return state.legalBooks.includes(bookName.toLowerCase());
}

export function getAvailableBooks(stateAbbr: string): string[] {
  const state = US_STATES[stateAbbr.toUpperCase()];
  if (!state || !state.legal) return [];
  return state.legalBooks;
}

export function getLegalStates(): StateInfo[] {
  return Object.values(US_STATES).filter(s => s.legal && s.legalBooks.length > 0);
}

export function getAllStates(): StateInfo[] {
  return Object.values(US_STATES).sort((a, b) => a.name.localeCompare(b.name));
}
