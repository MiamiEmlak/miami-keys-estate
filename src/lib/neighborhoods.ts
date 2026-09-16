// Static neighborhood intelligence. Live pricing comes from the MLS feed at runtime.
export type Neighborhood = {
  slug: string;
  name: string;
  city: string;
  overview: string;
  lifestyle: string;
  walkScore: number;
  transitScore: number;
  schools: { name: string; level: string; rating: number }[];
  investmentPotential: string;
  strZones: string[];
  strFriendly: boolean;
  hotspots: string[];
  center: { lat: number; lng: number };
};

export const NEIGHBORHOOD_LIST: Neighborhood[] = [
  {
    slug: "brickell",
    name: "Brickell",
    city: "Miami",
    overview:
      "Miami's financial district and its densest luxury condo market, stacked along Brickell Avenue between the river and Simpson Park.",
    lifestyle:
      "Walk-everywhere urban living: Brickell City Centre, Mary Brickell Village, the Metromover loop and a restaurant scene that turns over constantly.",
    walkScore: 96,
    transitScore: 82,
    schools: [
      { name: "Southside Elementary", level: "Elementary", rating: 8 },
      { name: "Ada Merritt K-8", level: "K-8", rating: 9 },
      { name: "Miami Senior High", level: "High", rating: 6 },
    ],
    investmentPotential:
      "Deepest rental pool in Miami with year-round corporate demand. Cap rates typically land in the 4–5.5% range, with the strongest yields in flexible-leasing towers.",
    strZones: ["Icon Brickell", "SLS LUX", "Brickell Heights"],
    strFriendly: true,
    hotspots: ["Brickell City Centre", "Mary Brickell Village", "Miami River Walk", "Simpson Park"],
    center: { lat: 25.7617, lng: -80.1918 },
  },
  {
    slug: "edgewater",
    name: "Edgewater",
    city: "Miami",
    overview:
      "A bayfront strip north of Downtown that has turned into Miami's most active new-condo corridor, with direct Biscayne Bay frontage.",
    lifestyle:
      "Quieter than Brickell, with Margaret Pace Park, the bay walk and a five-minute drive to the Design District and Wynwood.",
    walkScore: 83,
    transitScore: 63,
    schools: [
      { name: "Phillis Wheatley Elementary", level: "Elementary", rating: 6 },
      { name: "iPrep Academy", level: "K-12", rating: 9 },
      { name: "Design & Architecture Senior High", level: "High", rating: 10 },
    ],
    investmentPotential:
      "Newer inventory and bay views support above-average rent growth. Appreciation has outpaced Downtown over the past cycle.",
    strZones: ["Opera Tower", "Quantum on the Bay"],
    strFriendly: true,
    hotspots: ["Margaret Pace Park", "Design District", "Biscayne Bay walk", "Arsht Center"],
    center: { lat: 25.7967, lng: -80.1873 },
  },
  {
    slug: "downtown",
    name: "Downtown Miami",
    city: "Miami",
    overview:
      "The civic and cultural core — Museum Park, Kaseya Center, Bayfront Park and the Miami Worldcenter build-out.",
    lifestyle:
      "Transit-rich and event-driven, with the widest price range in the market from entry condos to full-floor penthouses.",
    walkScore: 94,
    transitScore: 86,
    schools: [
      { name: "Downtown Doral Charter", level: "K-8", rating: 8 },
      { name: "Booker T. Washington Senior High", level: "High", rating: 6 },
    ],
    investmentPotential:
      "Entry pricing per square foot is the lowest of the urban core, which keeps gross yields competitive for buy-and-hold investors.",
    strZones: ["Vizcayne"],
    strFriendly: true,
    hotspots: ["Bayfront Park", "Museum Park", "Miami Worldcenter", "Kaseya Center"],
    center: { lat: 25.7743, lng: -80.1937 },
  },
  {
    slug: "midtown",
    name: "Midtown Miami",
    city: "Miami",
    overview:
      "A walkable grid of mid-rise residences and street retail wedged between Wynwood and the Design District.",
    lifestyle: "Gallery walks, boutique fitness and a street-level retail scene you can live without a car in.",
    walkScore: 92,
    transitScore: 60,
    schools: [
      { name: "Design & Architecture Senior High", level: "High", rating: 10 },
      { name: "Morningside K-8 Academy", level: "K-8", rating: 7 },
    ],
    investmentPotential:
      "Short-term-rental friendly buildings and steady creative-sector tenancy make this one of the better cash-flow pockets.",
    strZones: ["Midtown 2", "Midtown 4"],
    strFriendly: true,
    hotspots: ["Wynwood Walls", "Design District", "Midtown shops"],
    center: { lat: 25.8076, lng: -80.1918 },
  },
  {
    slug: "miami-beach",
    name: "Miami Beach",
    city: "Miami Beach",
    overview:
      "The barrier island market — South of Fifth, South Beach, Mid-Beach and the oceanfront estate corridor.",
    lifestyle: "Beach-first living with Lincoln Road, Ocean Drive and the Miami Beach Convention Center district.",
    walkScore: 88,
    transitScore: 58,
    schools: [
      { name: "South Pointe Elementary", level: "Elementary", rating: 9 },
      { name: "Nautilus Middle", level: "Middle", rating: 7 },
      { name: "Miami Beach Senior High", level: "High", rating: 7 },
    ],
    investmentPotential:
      "Highest price per square foot in the county. Appreciation-led rather than yield-led; short-term rental rules vary block by block.",
    strZones: ["Designated MXE district along Collins Avenue"],
    strFriendly: false,
    hotspots: ["South Pointe Park", "Lincoln Road", "Ocean Drive", "Faena District"],
    center: { lat: 25.7907, lng: -80.13 },
  },
  {
    slug: "sunny-isles",
    name: "Sunny Isles Beach",
    city: "Sunny Isles Beach",
    overview:
      "A two-mile oceanfront corridor of branded towers between Haulover Park and Golden Beach.",
    lifestyle: "Resort-style beachfront living with Bal Harbour Shops and Aventura Mall minutes away.",
    walkScore: 71,
    transitScore: 45,
    schools: [
      { name: "Norman S. Edelcup K-8", level: "K-8", rating: 9 },
      { name: "Alonzo & Tracy Mourning Senior High", level: "High", rating: 7 },
    ],
    investmentPotential:
      "International buyer demand and limited oceanfront land support long-run appreciation; most towers restrict short-term rentals.",
    strZones: [],
    strFriendly: false,
    hotspots: ["Sunny Isles beachwalk", "Bal Harbour Shops", "Haulover Park", "Aventura Mall"],
    center: { lat: 25.9462, lng: -80.1228 },
  },
  {
    slug: "coral-gables",
    name: "Coral Gables",
    city: "Coral Gables",
    overview:
      "The City Beautiful — Mediterranean-revival estates, tree-canopied streets and a low-rise single-family core.",
    lifestyle: "Miracle Mile, Venetian Pool, the Biltmore and the best public school zoning in the county.",
    walkScore: 74,
    transitScore: 48,
    schools: [
      { name: "Sunset Elementary", level: "Elementary", rating: 10 },
      { name: "Ponce de Leon Middle", level: "Middle", rating: 8 },
      { name: "Coral Gables Senior High", level: "High", rating: 8 },
    ],
    investmentPotential:
      "Single-family land value drives returns here. Rental yields are modest, but price stability through downturns is the strongest in Miami-Dade.",
    strZones: [],
    strFriendly: false,
    hotspots: ["Miracle Mile", "Venetian Pool", "Biltmore Hotel", "Merrick Park"],
    center: { lat: 25.7215, lng: -80.2684 },
  },
  {
    slug: "coconut-grove",
    name: "Coconut Grove",
    city: "Miami",
    overview:
      "Miami's oldest neighborhood — waterfront estates, sailing clubs and a shaded village center.",
    lifestyle: "Marinas, farmers markets, CocoWalk and a family-heavy residential feel minutes from Brickell.",
    walkScore: 79,
    transitScore: 52,
    schools: [
      { name: "Coconut Grove Elementary", level: "Elementary", rating: 9 },
      { name: "Ransom Everglades", level: "Private 6-12", rating: 10 },
      { name: "Carrollton School", level: "Private K-12", rating: 10 },
    ],
    investmentPotential:
      "Waterfront single-family and boutique condo product with tight supply; renovation plays remain the highest-return strategy.",
    strZones: [],
    strFriendly: false,
    hotspots: ["CocoWalk", "Dinner Key Marina", "Vizcaya", "Peacock Park"],
    center: { lat: 25.7259, lng: -80.2436 },
  },
];

export const getNeighborhood = (slug: string) =>
  NEIGHBORHOOD_LIST.find((n) => n.slug === slug) ?? null;
