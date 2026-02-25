-- Property schema expansion: RESO-aligned industry-standard fields
-- All new columns nullable for backward compatibility with existing rows.

-- 1.1 Structured address
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS state_or_province TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS country TEXT;

-- 1.2 Classification (category_id/subcategory_id reference property_categories / property_sub_categories when present)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS subcategory_id UUID;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_type TEXT;

-- 1.3 Core characteristics
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bedrooms INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bathrooms NUMERIC(4,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS half_baths INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS living_area_sqft INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lot_size_sqft INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS year_built INT;

-- 1.4 Identifiers and extensibility
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS parcel_number TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS features JSONB;

-- 1.5 Optional metadata
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Indexes for filtering/listing
CREATE INDEX IF NOT EXISTS idx_properties_category_id ON public.properties(category_id);
CREATE INDEX IF NOT EXISTS idx_properties_subcategory_id ON public.properties(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_postal_code ON public.properties(postal_code);

COMMENT ON COLUMN public.properties.address_line_1 IS 'Street number and name';
COMMENT ON COLUMN public.properties.property_type IS 'RESO-aligned: residential, commercial, land, industrial';
COMMENT ON COLUMN public.properties.features IS 'Flexible key-value for parking, garage, heating, etc.';
