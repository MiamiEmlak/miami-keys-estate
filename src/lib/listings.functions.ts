import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SearchParamsInput } from "./listings.server";

export const searchListingsFn = createServerFn({ method: "POST" })
  .inputValidator((input: SearchParamsInput | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const { searchListings } = await import("./listings.server");
    return searchListings(data);
  });

export const getListingFn = createServerFn({ method: "POST" })
  .inputValidator((input: { listingKey: string }) => ({ listingKey: String(input.listingKey) }))
  .handler(async ({ data }) => {
    const { getListingDetail } = await import("./listings.server");
    return getListingDetail(data.listingKey);
  });

// Saving / watching requires the MLS record to exist locally first.
export const saveListingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { listingKey: string; mode: "save" | "watch" }) => ({
    listingKey: String(input.listingKey),
    mode: input.mode === "watch" ? ("watch" as const) : ("save" as const),
  }))
  .handler(async ({ data, context }) => {
    const { persistListing } = await import("./listings-persist.server");
    await persistListing(data.listingKey);

    if (data.mode === "save") {
      const { error } = await context.supabase
        .from("saved_properties")
        .upsert(
          { user_id: context.userId, listing_key: data.listingKey },
          { onConflict: "user_id,listing_key" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("property_watches").insert({
        user_id: context.userId,
        listing_key: data.listingKey,
        watch_type: "listing",
        watch_value: data.listingKey,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });