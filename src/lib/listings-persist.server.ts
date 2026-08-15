import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getListingDetail } from "./listings.server";

// Mirrors a Trestle listing into the local properties table so user
// saves/watches (which reference properties.listing_key) can be stored.
export async function persistListing(listingKey: string) {
  const { listing } = await getListingDetail(listingKey);
  if (!listing) throw new Error("Listing not found");
  const { error } = await supabaseAdmin
    .from("properties")
    .upsert(listing, { onConflict: "listing_key" });
  if (error) throw new Error(error.message);
}