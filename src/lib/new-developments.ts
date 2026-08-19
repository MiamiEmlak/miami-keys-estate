// Client-safe types, deposit math and fallback demo data for the New Developments module.

export type Development = {
  id: string;
  slug: string;
  name: string;
  developer_name: string | null;
  city: string | null;
  neighborhood: string | null;
  description: string | null;
  hero_image_url: string | null;
  starting_price: number | null;
  completion_date: string | null;
  str_friendly: boolean;
};

export type BuildingUnit = {
  id: string;
  development_id: string;
  floor_plan_line: string | null;
  unit_number: string | null;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  interior_sqft: number | null;
  balcony_sqft: number | null;
  price: number | null;
  view_description: string | null;
  status: string;
};

export type DepositMilestone = {
  id: string;
  development_id: string;
  milestone: string;
  percent: number;
  due_label: string | null;
  sort_order: number;
};

export type DepositStep = DepositMilestone & {
  amount: number;
  cumulativePercent: number;
  cumulativeAmount: number;
};

/** Builds the cumulative deposit ladder for a given unit price. */
export function depositLadder(schedule: DepositMilestone[], price: number): DepositStep[] {
  let cumulativePercent = 0;
  return [...schedule]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => {
      cumulativePercent += m.percent;
      return {
        ...m,
        amount: (price * m.percent) / 100,
        cumulativePercent,
        cumulativeAmount: (price * cumulativePercent) / 100,
      };
    });
}

export function completionYear(date: string | null): number | null {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

export function groupByLine(units: BuildingUnit[]): [string, BuildingUnit[]][] {
  const map = new Map<string, BuildingUnit[]>();
  for (const u of units) {
    const key = u.floor_plan_line ?? "Unassigned";
    map.set(key, [...(map.get(key) ?? []), u]);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/* ------------------------------------------------------------------ *
 * Fallback demo data — used only when the database has no rows yet.
 * ------------------------------------------------------------------ */

const DEMO_ID = "demo-aurora-edgewater";

export const DEMO_DEVELOPMENTS: Development[] = [
  {
    id: DEMO_ID,
    slug: "aurora-residences-edgewater",
    name: "Aurora Residences",
    developer_name: "Cays Development Group",
    city: "Miami",
    neighborhood: "Edgewater",
    description:
      "A 42-storey bayfront tower with flexible leasing, private marina access and a full Aurora amenity deck. Demo data — publish a development in the admin portal to replace it.",
    hero_image_url: null,
    starting_price: 875_000,
    completion_date: "2028-06-30",
    str_friendly: true,
  },
  {
    id: "demo-solara-brickell",
    slug: "solara-brickell",
    name: "Solara Brickell",
    developer_name: "Solara Partners",
    city: "Miami",
    neighborhood: "Brickell",
    description:
      "Boutique 28-storey residence in the Brickell financial core with hotel-grade services. Demo data.",
    hero_image_url: null,
    starting_price: 1_240_000,
    completion_date: "2027-12-31",
    str_friendly: false,
  },
];

export const DEMO_UNITS: BuildingUnit[] = [
  ["A", "1804", 18, 2, 2, 1180, 210, 985_000, "Bay & city"],
  ["A", "2404", 24, 2, 2, 1180, 210, 1_045_000, "Bay"],
  ["B", "1902", 19, 3, 3, 1620, 320, 1_460_000, "Bay & skyline"],
  ["B", "2902", 29, 3, 3, 1620, 320, 1_615_000, "Direct bay"],
  ["C", "1101", 11, 1, 1, 760, 140, 875_000, "City"],
  ["C", "2101", 21, 1, 1, 760, 140, 930_000, "City & bay glimpse"],
].map(([line, unit, floor, beds, baths, interior, balcony, price, view], i) => ({
  id: `demo-unit-${i}`,
  development_id: DEMO_ID,
  floor_plan_line: `Line ${line as string}`,
  unit_number: unit as string,
  floor: floor as number,
  bedrooms: beds as number,
  bathrooms: baths as number,
  interior_sqft: interior as number,
  balcony_sqft: balcony as number,
  price: price as number,
  view_description: view as string,
  status: "available",
}));

export const DEMO_SCHEDULE: DepositMilestone[] = [
  ["Reservation", 10, "At contract signing", 0],
  ["Second deposit", 10, "30 days after contract", 1],
  ["Groundbreaking", 10, "At groundbreaking", 2],
  ["Top-off", 20, "At structural top-off", 3],
  ["Closing", 50, "At closing / delivery", 4],
].map(([milestone, percent, due, order], i) => ({
  id: `demo-step-${i}`,
  development_id: DEMO_ID,
  milestone: milestone as string,
  percent: percent as number,
  due_label: due as string,
  sort_order: order as number,
}));