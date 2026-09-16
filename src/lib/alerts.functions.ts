import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type WatchType = "building" | "neighborhood" | "property";

/** Watch a building, neighborhood or property (property_watches). */
export const watchTargetFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { watchType: WatchType; value: string; listingKey?: string }) => ({
    watchType: (["building", "neighborhood", "property"] as const).includes(input.watchType)
      ? input.watchType
      : ("building" as WatchType),
    value: String(input.value),
    listingKey: input.listingKey ? String(input.listingKey) : undefined,
  }))
  .handler(async ({ data, context }) => {
    if (data.watchType === "property" && data.listingKey) {
      const { persistListing } = await import("./listings-persist.server");
      await persistListing(data.listingKey);
    }
    const { error } = await context.supabase.from("property_watches").insert({
      user_id: context.userId,
      watch_type: data.watchType,
      watch_value: data.value,
      listing_key: data.listingKey ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Subscribe to new-listing alerts (saved_searches). */
export const createAlertFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; criteria: Record<string, string>; frequency?: string }) => ({
    name: String(input.name),
    criteria: input.criteria ?? {},
    frequency: input.frequency === "instant" || input.frequency === "weekly" ? input.frequency : "daily",
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("saved_searches").insert({
      user_id: context.userId,
      search_name: data.name,
      criteria: data.criteria,
      alert_frequency: data.frequency,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
