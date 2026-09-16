// Nightly price snapshot job: pulls active Trestle listings, stores price_history rows
// and logs price changes to lead_activity. Protected by the CRON_SECRET header.
import { createFileRoute } from "@tanstack/react-router";
import { readTrestleEnv, trestleGet, normalizeProperty } from "@/lib/trestle.server";

const PAGE_SIZE = 200;
const MAX_PAGES = 5;

async function run() {
  const { env, missing } = readTrestleEnv();
  if (!env) return { ok: false, error: `Missing Trestle config: ${missing.join(", ")}` };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const listings: { listing_key: string; list_price: number | null; standard_status: string | null }[] =
    [];

  for (let page = 0; page < MAX_PAGES; page++) {
    let batch: Record<string, unknown>[] = [];
    try {
      const res = await trestleGet(env, "Property", {
        $filter: "StandardStatus eq 'Active'",
        $select: "ListingKey,ListPrice,StandardStatus,ModificationTimestamp",
        $orderby: "ModificationTimestamp desc",
        $top: String(PAGE_SIZE),
        $skip: String(page * PAGE_SIZE),
      });
      batch = res.value;
    } catch (err) {
      console.error("sync-price-history: Trestle page failed", page, err);
      break;
    }
    if (batch.length === 0) break;
    for (const raw of batch) {
      const p = normalizeProperty(raw);
      if (p.listing_key) {
        listings.push({
          listing_key: p.listing_key,
          list_price: p.list_price,
          standard_status: p.standard_status,
        });
      }
    }
    if (batch.length < PAGE_SIZE) break;
  }

  if (listings.length === 0) return { ok: true, scanned: 0, snapshots: 0, changes: 0 };

  const keys = listings.map((l) => l.listing_key);

  // Latest known price per listing.
  const { data: prior } = await supabaseAdmin
    .from("price_history")
    .select("listing_key, price, recorded_at")
    .in("listing_key", keys)
    .order("recorded_at", { ascending: false });

  const lastPrice = new Map<string, number | null>();
  for (const row of prior ?? []) {
    if (!lastPrice.has(row.listing_key)) lastPrice.set(row.listing_key, row.price);
  }

  const snapshots: { listing_key: string; price: number | null; standard_status: string | null }[] = [];
  const changes: { listing_key: string; old_price: number | null; new_price: number | null }[] = [];

  for (const l of listings) {
    const previous = lastPrice.get(l.listing_key);
    if (previous === undefined) {
      snapshots.push(l);
      continue;
    }
    if (previous !== l.list_price) {
      snapshots.push(l);
      changes.push({ listing_key: l.listing_key, old_price: previous, new_price: l.list_price });
    }
  }

  for (let i = 0; i < snapshots.length; i += 500) {
    const chunk = snapshots.slice(i, i + 500);
    const { error } = await supabaseAdmin.from("price_history").insert(chunk);
    if (error) console.error("sync-price-history: snapshot insert failed", error.message);
  }

  if (changes.length > 0) {
    // lead_activity.listing_key references properties; only set it for listings we persist.
    const { data: known } = await supabaseAdmin
      .from("properties")
      .select("listing_key")
      .in(
        "listing_key",
        changes.map((c) => c.listing_key),
      );
    const knownKeys = new Set((known ?? []).map((k) => k.listing_key));

    const rows = changes.map((c) => ({
      activity_type: "price_change",
      listing_key: knownKeys.has(c.listing_key) ? c.listing_key : null,
      metadata: {
        listing_key: c.listing_key,
        old_price: c.old_price,
        new_price: c.new_price,
        direction:
          (c.new_price ?? 0) < (c.old_price ?? 0) ? "drop" : "increase",
      },
    }));
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabaseAdmin.from("lead_activity").insert(rows.slice(i, i + 500));
      if (error) console.error("sync-price-history: activity insert failed", error.message);
    }
  }

  return { ok: true, scanned: listings.length, snapshots: snapshots.length, changes: changes.length };
}

export const Route = createFileRoute("/api/public/hooks/sync-price-history")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        if (!secret || request.headers.get("x-cron-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const result = await run();
          return Response.json(result);
        } catch (err) {
          console.error("sync-price-history failed", err);
          return Response.json({ ok: false, error: "Sync failed" }, { status: 500 });
        }
      },
    },
  },
});
