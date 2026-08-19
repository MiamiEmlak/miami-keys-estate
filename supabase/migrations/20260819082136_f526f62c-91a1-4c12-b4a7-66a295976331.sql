
CREATE TABLE public.new_developments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  developer_name text,
  city text,
  neighborhood text,
  description text,
  hero_image_url text,
  starting_price numeric,
  completion_date date,
  str_friendly boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.building_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES public.new_developments(id) ON DELETE CASCADE,
  floor_plan_line text,
  unit_number text,
  floor integer,
  bedrooms numeric,
  bathrooms numeric,
  interior_sqft numeric,
  balcony_sqft numeric,
  price numeric,
  view_description text,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deposit_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES public.new_developments(id) ON DELETE CASCADE,
  milestone text NOT NULL,
  percent numeric NOT NULL,
  due_label text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.developer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES public.new_developments(id) ON DELETE CASCADE,
  title text NOT NULL,
  storage_path text NOT NULL,
  requires_registration boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.new_developments TO anon, authenticated;
GRANT SELECT ON public.building_units TO anon, authenticated;
GRANT SELECT ON public.deposit_schedules TO anon, authenticated;
GRANT SELECT ON public.developer_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.new_developments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.building_units TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.deposit_schedules TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.developer_documents TO authenticated;
GRANT ALL ON public.new_developments TO service_role;
GRANT ALL ON public.building_units TO service_role;
GRANT ALL ON public.deposit_schedules TO service_role;
GRANT ALL ON public.developer_documents TO service_role;

ALTER TABLE public.new_developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published developments are public" ON public.new_developments
  FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "Admins manage developments" ON public.new_developments
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Units of published developments are public" ON public.building_units
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.new_developments d WHERE d.id = development_id AND d.is_published));
CREATE POLICY "Admins manage units" ON public.building_units
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Deposit schedules of published developments are public" ON public.deposit_schedules
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.new_developments d WHERE d.id = development_id AND d.is_published));
CREATE POLICY "Admins manage deposit schedules" ON public.deposit_schedules
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Documents of published developments are public" ON public.developer_documents
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.new_developments d WHERE d.id = development_id AND d.is_published));
CREATE POLICY "Admins manage documents" ON public.developer_documents
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read developer docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'developer-docs' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload developer docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'developer-docs' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update developer docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'developer-docs' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete developer docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'developer-docs' AND private.has_role(auth.uid(), 'admin'));
