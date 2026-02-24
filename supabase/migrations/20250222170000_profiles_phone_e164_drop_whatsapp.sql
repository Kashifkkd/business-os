-- Single phone column (E.164). Remove WhatsApp and split dial/number columns.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS dialcode_whatsapp,
  DROP COLUMN IF EXISTS dialcode_whatsapp_number,
  DROP COLUMN IF EXISTS dialcode_number,
  DROP COLUMN IF EXISTS number;

COMMENT ON COLUMN public.profiles.phone IS 'Phone in E.164 (synced from auth.users.phone after OTP verification)';
