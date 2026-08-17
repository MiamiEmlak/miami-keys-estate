export interface Coords {
  lat: number;
  lon: number;
  accuracyMeters?: number;
}

export interface LocationSelection {
  county: string;
  city: string;
  neighborhood: string;
  coords: Coords | null;
  radiusMiles: number;
}

export interface CityData {
  name: string;
  neighborhoods: string[];
}

export const COUNTY_NAMES = ["Miami-Dade", "Broward", "Palm Beach"] as const;

export const TRI_COUNTY_DATA: Record<string, CityData[]> = {
  "Miami-Dade": [
    {
      name: "Miami",
      neighborhoods: [
        "Brickell",
        "Edgewater",
        "Midtown Miami",
        "Wynwood",
        "The Roads",
        "Little Havana",
        "Coconut Grove",
        "Shenandoah",
      ],
    },
    {
      name: "Miami Beach",
      neighborhoods: ["South of Fifth", "South Beach", "Mid-Beach", "North Beach", "Venetian Islands", "Star Island"],
    },
    { name: "Coral Gables", neighborhoods: ["Cocoplum", "Gables Estates", "Old Cutler Bay", "Downtown Coral Gables"] },
    { name: "Sunny Isles Beach", neighborhoods: ["Collins Ave Strip", "Golden Shores"] },
    { name: "Aventura", neighborhoods: ["Williams Island", "Aventura Lakes", "Country Club Drive"] },
    { name: "Bal Harbour", neighborhoods: ["Bal Harbour Village", "Collins Waterfront"] },
    { name: "Key Biscayne", neighborhoods: ["Grand Bay", "Ocean Lane", "Crandon"] },
    { name: "Doral", neighborhoods: ["Doral Isles", "Downtown Doral"] },
    { name: "Surfside", neighborhoods: ["Harding Ave", "Surfside Waterfront"] },
    { name: "Pinecrest", neighborhoods: ["North Pinecrest", "South Pinecrest"] },
  ],
  Broward: [
    {
      name: "Fort Lauderdale",
      neighborhoods: [
        "Las Olas",
        "Victoria Park",
        "Rio Vista",
        "Coral Ridge",
        "Galt Ocean Mile",
        "Harbor Beach",
        "Colee Hammock",
      ],
    },
    { name: "Boca Raton South", neighborhoods: ["Royal Palm Yacht Club", "South Beach Pavilion"] },
    { name: "Hollywood", neighborhoods: ["Hollywood Beach", "Hollywood Lakes", "Emerald Hills"] },
    { name: "Pompano Beach", neighborhoods: ["Pompano Beach Highlands", "Hillsboro Shores"] },
    { name: "Hallandale Beach", neighborhoods: ["Diplomat Golf Estates", "Golden Isles"] },
    { name: "Weston", neighborhoods: ["Weston Hills", "Windmill Ranches"] },
    { name: "Parkland", neighborhoods: ["Heron Bay", "Parkland Golf & Country Club"] },
    { name: "Lauderdale-by-the-Sea", neighborhoods: ["Bel Air", "Terra Mar"] },
    { name: "Davie", neighborhoods: ["Forest Ridge", "Robins Rest"] },
    { name: "Deerfield Beach", neighborhoods: ["Cove", "Deerfield Beachfront"] },
  ],
  "Palm Beach": [
    {
      name: "Boca Raton",
      neighborhoods: ["Royal Palm Yacht & Country Club", "Boca West", "Boca Falls", "Mizner Park"],
    },
    { name: "Delray Beach", neighborhoods: ["Atlantic Ave Corridor", "Tropic Isle", "Seagate"] },
    { name: "Palm Beach", neighborhoods: ["Estate Section", "North End", "Mid-Town"] },
    { name: "West Palm Beach", neighborhoods: ["El Cid", "Prospect Park", "Downtown WPB", "SoCo"] },
    { name: "Jupiter", neighborhoods: ["Jupiter Inlet Colony", "Abacoa", "Admiral's Cove"] },
    { name: "Palm Beach Gardens", neighborhoods: ["PGA National", "Mirasol", "Old Marsh"] },
    { name: "Wellington", neighborhoods: ["Equestrian Club", "Aero Club", "Palm Beach Point"] },
    { name: "Highland Beach", neighborhoods: ["Byrd Beach", "Bel Lido"] },
    { name: "Manalapan", neighborhoods: ["Point Manalapan", "Ocean Ave Strip"] },
  ],
};

// Helper: Get all cities for a chosen county or all counties combined
export function citiesForCounty(county: string): CityData[] {
  if (!county) {
    return Object.values(TRI_COUNTY_DATA).flat();
  }
  return TRI_COUNTY_DATA[county] || [];
}

// Helper: Get neighborhoods based on active county and city
export function neighborhoodsFor(county: string, city: string): string[] {
  const availableCities = citiesForCounty(county);
  if (!city) {
    return availableCities.flatMap((c) => c.neighborhoods);
  }
  const match = availableCities.find((c) => c.name.toLowerCase() === city.toLowerCase());
  return match ? match.neighborhoods : [];
}

// Helper: Construct OData geo.distance filter string for Trestle RESO API
export function geoDistanceFilter(coords: Coords, radiusMiles: number): string {
  const meters = radiusMiles * 1609.344;
  return `geo.distance(Coordinates, geography'POINT(${coords.lon} ${coords.lat})') le ${meters}`;
}

// Helper: Construct OData city filter string
export function cityFilter(city: string): string | null {
  if (!city) return null;
  return `City eq '${city}'`;
}
