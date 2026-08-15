import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SavedRow = {
  listing_key: string;
  properties: {
    list_price: number | null;
    street_address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  } | null;
};

export function useSavedProperties() {
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setSignedIn(false);
      setRows([]);
      setLoading(false);
      return;
    }
    setSignedIn(true);
    const { data } = await supabase
      .from("saved_properties")
      .select("listing_key, properties(list_price, street_address, city, state, postal_code)")
      .order("created_at", { ascending: false })
      .limit(20);
    setRows((data as SavedRow[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return { rows, count: rows.length, signedIn, loading, reload: load };
}
