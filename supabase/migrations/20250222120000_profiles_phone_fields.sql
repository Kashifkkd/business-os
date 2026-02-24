-- Add optional phone and WhatsApp fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dialcode_number TEXT,
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS dialcode_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS dialcode_whatsapp_number TEXT;

COMMENT ON COLUMN public.profiles.dialcode_number IS 'Phone dial code (e.g. +1)';
COMMENT ON COLUMN public.profiles.number IS 'Phone number without dial code';
COMMENT ON COLUMN public.profiles.dialcode_whatsapp IS 'WhatsApp dial code';
COMMENT ON COLUMN public.profiles.dialcode_whatsapp_number IS 'WhatsApp number';
