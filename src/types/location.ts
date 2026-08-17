// South Florida location taxonomy: County -> Cities -> Neighborhoods.
export type CountyName = "Miami-Dade" | "Broward" | "Palm Beach";

export type CityEntry = {
  name: string;
  neighborhoods: string[];
};

export type CountyEntry = {
  name: CountyName;
  cities: CityEntry[];
};

export const COUNTIES: CountyEntry[] = [
  {
    name: "Miami-Dade",
    cities: [
      {
        name: "Miami",
        neighborhoods: [
          "Brickell",
          "Downtown Miami",
          "Edgewater",
          "Coconut Grove",
          "Design District",
          "Wynwood",
          "Little Havana",
          "Coral Way",
        ],
      },
      {
        name: "Miami Beach",
        neighborhoods: ["South Beach", "Mid-Beach", "North Beach", "Sunset Islands", "Venetian Islands"],
      },
      { name: "Coral Gables", neighborhoods: ["Gables Estates", "Cocoplum", "Downtown Gables", "Gables By The Sea"] },
      { name: "Aventura", neighborhoods: ["Williams Island", "Porto Vita", "Hallandale Line"] },
      { name: "Sunny Isles Beach", neighborhoods: ["Golden Shores", "Oceanfront Corridor"] },
      { name: "Key Biscayne", neighborhoods: ["Ocean Club", "Village Core"] },
      { name: "Bal Harbour", neighborhoods: ["Bal Harbour Village", "Bay Harbor Islands"] },
      { name: "Doral", neighborhoods: ["Downtown Doral", "Doral Isles"] },
      { name: "Pinecrest", neighborhoods: ["North Pinecrest", "South Pinecrest"] },
    ],
  },
  {
    name: "Broward",
    cities: [
      { name: "Fort Lauderdale", neighborhoods: ["Las Olas", "Victoria Park", "Rio Vista", "Harbor Beach", "Coral Ridge"] },
      { name: "Hollywood", neighborhoods: ["Hollywood Beach", "Emerald Hills", "Lakes Section"] },
      { name: "Hallandale Beach", neighborhoods: ["Golden Isles", "Three Islands", "Beachfront"] },
      { name: "Pompano Beach", neighborhoods: ["Pompano Beach Highlands", "Hillsboro Shores"] },
      { name: "Weston", neighborhoods: ["Weston Hills", "Windmill Ranch Estates"] },
      { name: "Parkland", neighborhoods: ["Heron Bay", "Parkland Golf & Country Club"] },
    ],
  },
  {
    name: "Palm Beach",
    cities: [
      { name: "West Palm Beach", neighborhoods: ["Downtown WPB", "El Cid", "Flamingo Park", "Northwood Shores"] },
      { name: "Palm Beach", neighborhoods: ["Worth Avenue", "North End", "Estate Section"] },
      { name: "Boca Raton", neighborhoods: ["Royal Palm Yacht", "Boca Bridges", "Mizner Park", "The Oaks"] },
      { name: "Delray Beach", neighborhoods: ["Atlantic Avenue", "Seagate", "Lake Ida"] },
      { name: "Jupiter", neighborhoods: ["Admirals Cove", "Abacoa", "Jupiter Island Line"] },
    ],
  },
];

export const COUNTY_NAMES = COUNTIES.map((c) => c.name);

export function citiesForCounty(county: string): CityEntry[] {
  if (!county) return COUNTIES.flatMap((c) => c.cities);
  return COUNTIES.find((c) => c.name === county)?.cities ?? [];
}

export function neighborhoodsFor(county: string, city: string): string[] {
  const cities = citiesForCounty(county);
  if (city) return cities.find((c) => c.name === city)?.neighborhoods ?? [];
  return Array.from(new Set(cities.flatMap((c) => c.neighborhoods)));
}

export type Coords = { lat: number; lon: number; accuracyMeters?: number };

export type LocationSelection = {
  county: string;
  city: string;
  neighborhood: string;
  coords: Coords | null;
  radiusMiles: number;
};

export const MILES_TO_METERS = 1609.344;

/** OData geo filter fragment for a radius search around a point. */
export function geoDistanceFilter(coords: Coords, radiusMiles: number): string {
  const radiusMeters = Math.round(radiusMiles * MILES_TO_METERS);
  return `geo.distance(Coordinates, geography'POINT(${coords.lon} ${coords.lat})') le ${radiusMeters}`;
}