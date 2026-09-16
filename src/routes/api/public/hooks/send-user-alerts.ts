// Daily user alert job: matches new MLS listings and price moves against saved searches,
// saved properties and building/neighborhood watches, then records alerts in lead_activity.
import { createFileRoute } from "@tanstack/react-router";
import { readTrestleEnv, trestleGet, normalizeProperty } from "@/lib/trestle.server";
import { getBuilding } from "@/lib/buildings";
import { getNeighborhood } from "@/lib/neighborhoods";

const LOOKBACK_HOURS = 24;
const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
const esc = (v: string) => v.replace(/'/g, "''");

type AlertRow = {
  user_id: string | null;
  activity_type: string;
  listing_key: string | null;
  metadata: Record<string, string | number | boolean | null>;
};

async function fetchNew(env: NonNullable<ReturnType<typeof readTrestleEnv>["env"]>, filter: string) {
  try {
    const { value } = await trestleGet(env, "Property", {
      $filter: filter,
      $select:
        "ListingKey,ListPrice,StandardStatus,PropertyType,UnparsedAddress,City,BedroomsTotal,ModificationTimestamp",
      $orderby: "ModificationTimestamp desc",
      $top: "25",
    });
    return value.map(normalizeProperty);
  } catch (err) {
    console.error("send-user-alerts: Trestle query failed", filter, err);
    return [];
  }
}

async function run() {
  const { env, missing } = readTrestleEnv();
  if (!env) return { ok: false, error: `Missing Trestle config: ${missing.join(", ")}` };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = iso(new Date(Date.now() - LOOKBACK_HOURS * 3600 * 1000));
  const base = `StandardStatus eq 'Active' and ModificationTimestamp gt ${since}`;
  const alerts: AlertRow[] = [];

  // 1. Saved searches (city / building / neighborhood / property_type criteria).
  const { data: searches } = await supabaseAdmin
    .from("saved_searches")
    .select("user_id, search_name, criteria")
    .eq("active", true);

  for (const s of searches ?? []) {
    const c = (s.criteria ?? {}) as Record<string, unknown>;
    const parts = [base];
    if (typeof c["building"] === "string") {
      const b = getBuilding(c["building"]);
      if (b) parts.push(`startswith(UnparsedAddress,'${esc(b.addressPrefix)}')`);
    }
    if (typeof c["neighborhood"] === "string") {
      const n = getNeighborhood(c["neighborhood"]);
      if (n) parts.push(`City eq '${esc(n.city)}'`);
    }
    if (typeof c["city"] === "string") parts.push(`City eq '${esc(c["city"])}'`);
    if (c["property_type"] === "single_family")
      parts.push("PropertySubType eq 'SingleFamilyResidence'");
    if (typeof c["minPrice"] === "number") parts.push(`ListPrice ge ${c["minPrice"]}`);
    if (typeof c["maxPrice"] === "number") parts.push(`ListPrice le ${c["maxPrice"]}`);

    const matches = await fetchNew(env, parts.join(" and "));
    for (const m of matches.slice(0, 10)) {
      alerts.push({
        user_id: s.user_id,
        activity_type: "alert_new_listing",
        listing_key: null,
        metadata: {
          search_name: s.search_name,
          listing_key: m.listing_key,
          address: m.street_address,
          price: m.list_price,
        },
      });
    }
  }

  // 2. Price moves on saved properties.
  const { data: saved } = await supabaseAdmin.from("saved_properties").select("user_id, listing_key");
  const savedKeys = [...new Set((saved ?? []).map((s) => s.listing_key))];
  if (savedKeys.length > 0) {
    const { data: moves } = await supabaseAdmin
      .from("price_history")
      .select("listing_key, price, recorded_at")
      .in("listing_key", savedKeys)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false });

    const latest = new Map<string, number | null>();
    for (const m of moves ?? []) if (!latest.has(m.listing_key)) latest.set(m.listing_key, m.price);

    for (const s of saved ?? []) {
      const price = latest.get(s.listing_key);
      if (price === undefined) continue;
      alerts.push({
        user_id: s.user_id,
        activity_type: "alert_price_change",
        listing_key: s.listing_key,
        metadata: { listing_key: s.listing_key, new_price: price },
      });
    }
  }

  // 3. Building and neighborhood watches (new listings + rentals).
  const { data: watches } = await supabaseAdmin
    .from("property_watches")
    .select("user_id, watch_type, watch_value")
    .eq("active", true)
    .in("watch_type", ["building", "neighborhood"]);

  for (const w of watches ?? []) {
    let filter: string | null = null;
    if (w.watch_type === "building") {
      const b = getBuilding(w.watch_value);
      if (b) filter = `${base} and startswith(UnparsedAddress,'${esc(b.addressPrefix)}')`;
    } else {
      const n = getNeighborhood(w.watch_value);
      if (n) filter = `${base} and City eq '${esc(n.city)}'`;
    }
    if (!filter) continue;
    const matches = await fetchNew(env, filter);
    for (const m of matches.slice(0, 10)) {
      alerts.push({
        user_id: w.user_id,
        activity_type:
          m.property_type === "ResidentialLease" ? "alert_new_rental" : "alert_new_listing",
        listing_key: null,
        metadata: {
          watch_type: w.watch_type,
          watch_value: w.watch_value,
          listing_key: m.listing_key,
          address: m.street_address,
          price: m.list_price,
        },
      });
    }
  }

  for (let i = 0; i < alerts.length; i += 500) {
    const { error } = await supabaseAdmin.from("lead_activity").insert(alerts.slice(i, i + 500));
    if (error) console.error("send-user-alerts: insert failed", error.message);
  }

  return { ok: true, alerts: alerts.length };
}

export const Route = createFileRoute("/api/public/hooks/send-user-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        if (!secret || request.headers.get("x-cron-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          return Response.json(await run());
        } catch (err) {
          console.error("send-user-alerts failed", err);
          return Response.json({ ok: false, error: "Alert run failed" }, { status: 500 });
        }
      },
    },
  },
});
