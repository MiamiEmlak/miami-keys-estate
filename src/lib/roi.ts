// Pure investment math shared by the property calculator and the compare matrix.

export type RoiInputs = {
  price: number;
  downPct: number;
  ratePct: number;
  termYears: number;
  monthlyRent: number;
  monthlyHoa: number;
  annualTaxes: number;
  annualInsurance: number;
  vacancyPct: number;
  maintenancePct: number;
};

export type RoiOutputs = {
  loanAmount: number;
  downPayment: number;
  monthlyPayment: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  noiAnnual: number;
  capRate: number;
  netYield: number;
  cashOnCash: number;
  grossYield: number;
};

export function mortgagePayment(loan: number, ratePct: number, termYears: number) {
  if (loan <= 0 || termYears <= 0) return 0;
  const r = ratePct / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
}

export function computeRoi(i: RoiInputs): RoiOutputs {
  const price = Math.max(i.price, 0);
  const downPayment = (price * i.downPct) / 100;
  const loanAmount = Math.max(price - downPayment, 0);
  const monthlyPayment = mortgagePayment(loanAmount, i.ratePct, i.termYears);

  const effectiveRent = i.monthlyRent * (1 - i.vacancyPct / 100);
  const maintenance = (i.monthlyRent * i.maintenancePct) / 100;
  const operating = i.monthlyHoa + i.annualTaxes / 12 + i.annualInsurance / 12 + maintenance;

  const monthlyExpenses = operating + monthlyPayment;
  const monthlyCashFlow = effectiveRent - monthlyExpenses;
  const noiAnnual = (effectiveRent - operating) * 12;

  const capRate = price > 0 ? (noiAnnual / price) * 100 : 0;
  const grossYield = price > 0 ? ((i.monthlyRent * 12) / price) * 100 : 0;
  const netYield = capRate;
  const cashInvested = downPayment + price * 0.03; // down payment + ~3% closing costs
  const cashOnCash = cashInvested > 0 ? ((monthlyCashFlow * 12) / cashInvested) * 100 : 0;

  return {
    loanAmount,
    downPayment,
    monthlyPayment,
    monthlyExpenses,
    monthlyCashFlow,
    noiAnnual,
    capRate,
    netYield,
    cashOnCash,
    grossYield,
  };
}

/** Rough market rent estimate when the MLS has no rental comp: ~0.55% of price / month. */
export function estimateMonthlyRent(price: number | null, livingArea: number | null) {
  if (!price) return 0;
  const byPrice = price * 0.0055;
  const byArea = livingArea ? livingArea * 3.6 : byPrice;
  return Math.round((byPrice + byArea) / 2);
}

export function monthlyHoaFrom(fee: number | null, frequency: string | null) {
  if (!fee) return 0;
  const f = (frequency ?? "Monthly").toLowerCase();
  if (f.includes("annual") || f.includes("year")) return Math.round(fee / 12);
  if (f.includes("quarter")) return Math.round(fee / 3);
  if (f.includes("semi")) return Math.round(fee / 6);
  if (f.includes("week")) return Math.round((fee * 52) / 12);
  return Math.round(fee);
}

export function defaultInputs(p: {
  list_price: number | null;
  living_area: number | null;
  association_fee: number | null;
  association_fee_frequency: string | null;
  tax_annual_amount: number | null;
}): RoiInputs {
  const price = p.list_price ?? 0;
  return {
    price,
    downPct: 25,
    ratePct: 6.5,
    termYears: 30,
    monthlyRent: estimateMonthlyRent(price, p.living_area),
    monthlyHoa: monthlyHoaFrom(p.association_fee, p.association_fee_frequency),
    annualTaxes: p.tax_annual_amount ?? Math.round(price * 0.019),
    annualInsurance: Math.round(Math.max(price * 0.007, 1200)),
    vacancyPct: 5,
    maintenancePct: 5,
  };
}

export const pct = (v: number) => `${v.toFixed(1)}%`;