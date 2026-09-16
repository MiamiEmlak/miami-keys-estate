CREATE TABLE public.price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_key text NOT NULL,
  price numeric,
  standard_status text,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX price_history_listing_idx ON public.price_history (listing_key, recorded_at DESC);

GRANT SELECT ON public.price_history TO anon;
GRANT SELECT ON public.price_history TO authenticated;
GRANT ALL ON public.price_history TO service_role;

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read price history"
  ON public.price_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage price history"
  ON public.price_history FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));