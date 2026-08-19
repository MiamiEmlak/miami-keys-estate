// Pure Deal Score math — shared by server scoring and UI rendering. No I/O here.

export type CompStats = {
  activeMedianPpsf: number | null;
  activeCount: number;
  closedMedianPpsf: number | null;
  closedCount: number;
};

export type ScoreFactor = {
  key: string;
  label: string;
  weight: number;
  /** 0-100 sub-score for this factor. */
  score: number;
  detail: string;
};

export type DealScore = {
  score: number;
  verdict: "Exceptional" | "Strong" | "Fair" | "Weak";
  factors: ScoreFactor[];
  ppsf: number | null;
  vsMarketPct: number | null;
  daysOnMarket: number | null;
  priceDropPct: number | null;
};

export function median(values: number[]): number | null {
  const list = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (list.length === 0) return null;
  const mid = Math.floor(list.length / 2);
  return list.length % 2 ? list[mid]! : (list[mid - 1]! + list[mid]!) / 2;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function daysBetween(from: string | null, to = Date.now()): number | null {
  if (!from) return null;
  const t = Date.parse(from);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((to - t) / 86_400_000));
}

export type ScoreInput = {
  listPrice: number | null;
  livingArea: number | null;
  originalListPrice: number | null;
  previousListPrice: number | null;
  listingContractDate: string | null;
  yearBuilt: number | null;
  capRate: number;
  monthlyCashFlow: number;
  comps: CompStats;
};

export function computeDealScore(i: ScoreInput): DealScore {
  const ppsf = i.listPrice && i.livingArea ? i.listPrice / i.livingArea : null;
  const benchmark = i.comps.closedMedianPpsf ?? i.comps.activeMedianPpsf;
  const vsMarketPct = ppsf && benchmark ? ((ppsf - benchmark) / benchmark) * 100 : null;

  const dom = daysBetween(i.listingContractDate);
  const prior = i.previousListPrice ?? i.originalListPrice;
  const priceDropPct =
    prior && i.listPrice && i.listPrice < prior ? ((prior - i.listPrice) / prior) * 100 : null;

  // 1. Price vs comparable price-per-sq-ft (50 = at market, cheaper scores higher).
  const priceScore =
    vsMarketPct === null ? 50 : clamp(50 - vsMarketPct * 2.5);
  const priceDetail =
    vsMarketPct === null
      ? "Not enough comparable sales nearby to benchmark price."
      : `${Math.abs(vsMarketPct).toFixed(1)}% ${vsMarketPct < 0 ? "below" : "above"} the ${
          i.comps.closedMedianPpsf ? "closed-sale" : "active-listing"
        } median of $${Math.round(benchmark!)}/sq ft.`;

  // 2. Rental yield (cap rate): 3% -> 30, 6% -> 75, 8%+ -> 100.
  const yieldScore = clamp((i.capRate - 1.5) * 14);
  const yieldDetail = `${i.capRate.toFixed(1)}% projected cap rate at market rent, ${
    i.monthlyCashFlow >= 0 ? "cash-flow positive" : "negative cash flow"
  } with 25% down.`;

  // 3. Time on market — long DOM means negotiating leverage.
  const domScore = dom === null ? 50 : clamp(35 + dom * 0.45);
  const domDetail =
    dom === null ? "Listing date unavailable." : `${dom} days on market.`;

  // 4. Seller motivation from price reductions.
  const motivationScore = priceDropPct === null ? 40 : clamp(55 + priceDropPct * 5);
  const motivationDetail =
    priceDropPct === null
      ? "No price reductions recorded — seller pricing is firm."
      : `Price cut ${priceDropPct.toFixed(1)}% from $${Math.round(prior!).toLocaleString()}.`;

  // 5. Asset condition proxy: building age.
  const age = i.yearBuilt ? new Date().getFullYear() - i.yearBuilt : null;
  const conditionScore = age === null ? 50 : clamp(100 - Math.max(0, age - 5) * 1.1);
  const conditionDetail =
    age === null ? "Year built not reported." : `Built ${i.yearBuilt} (${age} years old).`;

  const factors: ScoreFactor[] = [
    { key: "price", label: "Price vs comparables", weight: 0.35, score: priceScore, detail: priceDetail },
    { key: "yield", label: "Rental yield", weight: 0.25, score: yieldScore, detail: yieldDetail },
    { key: "dom", label: "Market timing", weight: 0.15, score: domScore, detail: domDetail },
    { key: "motivation", label: "Seller motivation", weight: 0.15, score: motivationScore, detail: motivationDetail },
    { key: "condition", label: "Asset condition", weight: 0.1, score: conditionScore, detail: conditionDetail },
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));
  const verdict: DealScore["verdict"] =
    score >= 80 ? "Exceptional" : score >= 65 ? "Strong" : score >= 50 ? "Fair" : "Weak";

  return { score, verdict, factors, ppsf, vsMarketPct, daysOnMarket: dom, priceDropPct };
}