// NFL Stadium data with coordinates and dome status
export interface Stadium {
  name: string;
  city: string;
  lat: number;
  lon: number;
  isDome: boolean; // Dome stadiums don't need weather
}

export const NFL_STADIUMS: Record<string, Stadium> = {
  "Arizona Cardinals": {
    name: "State Farm Stadium",
    city: "Glendale, AZ",
    lat: 33.5276,
    lon: -112.2626,
    isDome: true,
  },
  "Atlanta Falcons": {
    name: "Mercedes-Benz Stadium",
    city: "Atlanta, GA",
    lat: 33.7554,
    lon: -84.4010,
    isDome: true,
  },
  "Baltimore Ravens": {
    name: "M&T Bank Stadium",
    city: "Baltimore, MD",
    lat: 39.2780,
    lon: -76.6227,
    isDome: false,
  },
  "Buffalo Bills": {
    name: "Highmark Stadium",
    city: "Orchard Park, NY",
    lat: 42.7738,
    lon: -78.7870,
    isDome: false,
  },
  "Carolina Panthers": {
    name: "Bank of America Stadium",
    city: "Charlotte, NC",
    lat: 35.2258,
    lon: -80.8528,
    isDome: false,
  },
  "Chicago Bears": {
    name: "Soldier Field",
    city: "Chicago, IL",
    lat: 41.8623,
    lon: -87.6167,
    isDome: false,
  },
  "Cincinnati Bengals": {
    name: "Paycor Stadium",
    city: "Cincinnati, OH",
    lat: 39.0954,
    lon: -84.5160,
    isDome: false,
  },
  "Cleveland Browns": {
    name: "Cleveland Browns Stadium",
    city: "Cleveland, OH",
    lat: 41.5061,
    lon: -81.6995,
    isDome: false,
  },
  "Dallas Cowboys": {
    name: "AT&T Stadium",
    city: "Arlington, TX",
    lat: 32.7473,
    lon: -97.0945,
    isDome: true,
  },
  "Denver Broncos": {
    name: "Empower Field at Mile High",
    city: "Denver, CO",
    lat: 39.7439,
    lon: -105.0201,
    isDome: false,
  },
  "Detroit Lions": {
    name: "Ford Field",
    city: "Detroit, MI",
    lat: 42.3400,
    lon: -83.0456,
    isDome: true,
  },
  "Green Bay Packers": {
    name: "Lambeau Field",
    city: "Green Bay, WI",
    lat: 44.5013,
    lon: -88.0622,
    isDome: false,
  },
  "Houston Texans": {
    name: "NRG Stadium",
    city: "Houston, TX",
    lat: 29.6847,
    lon: -95.4107,
    isDome: true,
  },
  "Indianapolis Colts": {
    name: "Lucas Oil Stadium",
    city: "Indianapolis, IN",
    lat: 39.7601,
    lon: -86.1639,
    isDome: true,
  },
  "Jacksonville Jaguars": {
    name: "EverBank Stadium",
    city: "Jacksonville, FL",
    lat: 30.3239,
    lon: -81.6373,
    isDome: false,
  },
  "Kansas City Chiefs": {
    name: "Arrowhead Stadium",
    city: "Kansas City, MO",
    lat: 39.0489,
    lon: -94.4839,
    isDome: false,
  },
  "Las Vegas Raiders": {
    name: "Allegiant Stadium",
    city: "Las Vegas, NV",
    lat: 36.0909,
    lon: -115.1833,
    isDome: true,
  },
  "Los Angeles Chargers": {
    name: "SoFi Stadium",
    city: "Inglewood, CA",
    lat: 33.9535,
    lon: -118.3392,
    isDome: true, // Covered but open-air concept
  },
  "Los Angeles Rams": {
    name: "SoFi Stadium",
    city: "Inglewood, CA",
    lat: 33.9535,
    lon: -118.3392,
    isDome: true,
  },
  "Miami Dolphins": {
    name: "Hard Rock Stadium",
    city: "Miami Gardens, FL",
    lat: 25.9580,
    lon: -80.2389,
    isDome: false,
  },
  "Minnesota Vikings": {
    name: "U.S. Bank Stadium",
    city: "Minneapolis, MN",
    lat: 44.9736,
    lon: -93.2575,
    isDome: true,
  },
  "New England Patriots": {
    name: "Gillette Stadium",
    city: "Foxborough, MA",
    lat: 42.0909,
    lon: -71.2643,
    isDome: false,
  },
  "New Orleans Saints": {
    name: "Caesars Superdome",
    city: "New Orleans, LA",
    lat: 29.9511,
    lon: -90.0812,
    isDome: true,
  },
  "New York Giants": {
    name: "MetLife Stadium",
    city: "East Rutherford, NJ",
    lat: 40.8128,
    lon: -74.0742,
    isDome: false,
  },
  "New York Jets": {
    name: "MetLife Stadium",
    city: "East Rutherford, NJ",
    lat: 40.8128,
    lon: -74.0742,
    isDome: false,
  },
  "Philadelphia Eagles": {
    name: "Lincoln Financial Field",
    city: "Philadelphia, PA",
    lat: 39.9008,
    lon: -75.1675,
    isDome: false,
  },
  "Pittsburgh Steelers": {
    name: "Acrisure Stadium",
    city: "Pittsburgh, PA",
    lat: 40.4468,
    lon: -80.0158,
    isDome: false,
  },
  "San Francisco 49ers": {
    name: "Levi's Stadium",
    city: "Santa Clara, CA",
    lat: 37.4033,
    lon: -121.9694,
    isDome: false,
  },
  "Seattle Seahawks": {
    name: "Lumen Field",
    city: "Seattle, WA",
    lat: 47.5952,
    lon: -122.3316,
    isDome: false,
  },
  "Tampa Bay Buccaneers": {
    name: "Raymond James Stadium",
    city: "Tampa, FL",
    lat: 27.9759,
    lon: -82.5033,
    isDome: false,
  },
  "Tennessee Titans": {
    name: "Nissan Stadium",
    city: "Nashville, TN",
    lat: 36.1665,
    lon: -86.7713,
    isDome: false,
  },
  "Washington Commanders": {
    name: "Commanders Field",
    city: "Landover, MD",
    lat: 38.9076,
    lon: -76.8645,
    isDome: false,
  },
};

export function getStadiumForTeam(teamName: string): Stadium | null {
  return NFL_STADIUMS[teamName] || null;
}

export function isOutdoorStadium(teamName: string): boolean {
  const stadium = NFL_STADIUMS[teamName];
  return stadium ? !stadium.isDome : true;
}
