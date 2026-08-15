export const money = (v: number | null | undefined, opts?: { compact?: boolean }) =>
  typeof v === "number"
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
        notation: opts?.compact ? "compact" : "standard",
      }).format(v)
    : "—";

export const num = (v: number | null | undefined) =>
  typeof v === "number" ? new Intl.NumberFormat("en-US").format(v) : "—";

export const perSqFt = (price: number | null, area: number | null) =>
  price && area ? `${money(Math.round(price / area))}/sq ft` : "—";

export const fullAddress = (p: {
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
}) => [p.street_address, p.city, [p.state, p.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");