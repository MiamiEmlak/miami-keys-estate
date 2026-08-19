// Server-only: builds comparable-sale stats from Trestle and scores the deal.
import { readTrestleEnv, trestleGet, normalizeProperty } from "./trestle.server";
import { computeDealScore, median, type CompStats, type DealScore } from "./deal-score";
import { computeRoi, defaultInputs } from "./roi";

const esc = (v: string) => v.replace(/'/g, "''");
const ts = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

export type DealScoreResult = {
  score: DealScore | null;
  comps: CompStats;
  narrative: string | null;
  economics: {
    monthlyRent: number;
    monthlyPayment: number;
    monthlyHoa: number;
    monthlyTaxes: number;
    monthlyInsurance: number;
    monthlyCashFlow: number;
    capRate: number;
    cashOnCash: number;
  } | null;
  error: string | null;
};

const EMPTY_COMPS: CompStats = {
  activeMedianPpsf: null,
  activeCount: 0,
  closedMedianPpsf: null,
  closedCount: 0,
};

async function ppsfFor(
  env: NonNullable<ReturnType<typeof readTrestleEnv>["env"]>,
  filters: string[],
): Promise<{ medianPpsf: number | null; count: number }> {
  try {
    const result = await trestleGet(env, "Property", {
      $top: "50",
      $filter: filters.join(" and "),
      $orderby: "ModificationTimestamp desc",
    });
    const values = result.value
      .map(normalizeProperty)
      .map((p) => {
        const price = p.close_price ?? p.list_price;
        return price && p.living_area ? price / p.living_area : 0;
      })
      .filter((v) => v > 0);
    return { medianPpsf: median(values), count: values.length };
  } catch (error) {
    console.error("deal-score comps query failed", {
      filter: filters.join(" and "),
      error: error instanceof Error ? error.message : error,
    });
    return { medianPpsf: null, count: 0 };
  }
}

async function narrate(score: DealScore, address: string, city: string): Promise<string | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  const body = {
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content:
          "You are a Miami real estate investment analyst. Given a scored property, write 2-3 short sentences (max 70 words) explaining why the deal scores as it does and what a buyer should negotiate or verify. Be concrete, never invent data beyond what is given.",
      },
      {
        role: "user",
        content: `Property: ${address}, ${city}. Deal Score ${score.score}/100 (${score.verdict}).\n${score.factors
          .map((f) => `- ${f.label} (${Math.round(f.score)}/100): ${f.detail}`)
          .join("\n")}`,
      },
    ],
  };
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Deal Score narrative failed (${res.status})`, await res.text());
      return null;
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error("Deal Score narrative error", error);
    return null;
  }
}

export async function scoreListing(listingKey: string): Promise<DealScoreResult> {
  const { env } = readTrestleEnv();
  if (!env)
    return { score: null, comps: EMPTY_COMPS, narrative: null, economics: null, error: "MLS not configured" };

  try {
    const detail = await trestleGet(env, "Property", {
      $top: "1",
      $filter: `ListingKey eq '${esc(listingKey)}'`,
    });
    const raw = detail.value[0];
    if (!raw)
      return { score: null, comps: EMPTY_COMPS, narrative: null, economics: null, error: "Listing not found" };

    const p = normalizeProperty(raw);
    const area = p.living_area ?? 0;
    const base = [`City eq '${esc(p.city ?? "")}'`];
    if (p.property_sub_type) base.push(`PropertySubType eq '${esc(p.property_sub_type)}'`);
    if (area > 0) {
      base.push(`LivingArea ge ${Math.round(area * 0.75)}`);
      base.push(`LivingArea le ${Math.round(area * 1.25)}`);
    }
    if (p.bedrooms_total) {
      base.push(`BedroomsTotal ge ${Math.max(0, p.bedrooms_total - 1)}`);
      base.push(`BedroomsTotal le ${p.bedrooms_total + 1}`);
    }

    const since = ts(new Date(Date.now() - 180 * 86_400_000));
    const [active, closed] = await Promise.all([
      ppsfFor(env, [...base, "StandardStatus eq 'Active'", `ListingKey ne '${esc(listingKey)}'`]),
      ppsfFor(env, [...base, "StandardStatus eq 'Closed'", `CloseDate gt ${since}`]),
    ]);

    const comps: CompStats = {
      activeMedianPpsf: active.medianPpsf,
      activeCount: active.count,
      closedMedianPpsf: closed.medianPpsf,
      closedCount: closed.count,
    };

    const roiInputs = defaultInputs(p);
    const roi = computeRoi(roiInputs);

    const score = computeDealScore({
      listPrice: p.list_price,
      livingArea: p.living_area,
      originalListPrice: p.original_list_price,
      previousListPrice: p.previous_list_price,
      listingContractDate: p.listing_contract_date,
      yearBuilt: p.year_built,
      capRate: roi.capRate,
      monthlyCashFlow: roi.monthlyCashFlow,
      comps,
    });

    const narrative = await narrate(
      score,
      p.street_address ?? "this property",
      p.city ?? "Miami",
    );

    return {
      score,
      comps,
      narrative,
      economics: {
        monthlyRent: Math.round(roiInputs.monthlyRent),
        monthlyPayment: Math.round(roi.monthlyPayment),
        monthlyHoa: Math.round(roiInputs.monthlyHoa),
        monthlyTaxes: Math.round(roiInputs.annualTaxes / 12),
        monthlyInsurance: Math.round(roiInputs.annualInsurance / 12),
        monthlyCashFlow: Math.round(roi.monthlyCashFlow),
        capRate: roi.capRate,
        cashOnCash: roi.cashOnCash,
      },
      error: null,
    };
  } catch (error) {
    console.error("scoreListing failed", error);
    return {
      score: null,
      comps: EMPTY_COMPS,
      narrative: null,
      economics: null,
      error: error instanceof Error ? error.message : "Deal Score unavailable",
    };
  }
}