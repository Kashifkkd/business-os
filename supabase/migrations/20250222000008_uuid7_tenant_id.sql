-- UUID7 for tenant id: ensure generated in DB (not from client).
CREATE OR REPLACE FUNCTION public.uuid_generate_v7()
RETURNS UUID AS $$
  SELECT (FORMAT(
    '%s-%s-%s-%s-%s',
    lpad(to_hex(trunc(EXTRACT(EPOCH FROM statement_timestamp()) * 1000)::bigint >> 16), 8, '0'),
    lpad(to_hex(trunc(EXTRACT(EPOCH FROM statement_timestamp()) * 1000)::bigint & 65535), 4, '0'),
    lpad(to_hex((trunc(random() * 2^12) + 28672)::bigint), 4, '0'),
    lpad(to_hex((trunc(random() * 2^14) + 32768)::bigint), 4, '0'),
    lpad(to_hex(trunc(random() * 2^48)::bigint), 12, '0')
  ))::uuid;
$$ LANGUAGE SQL;

ALTER TABLE public.tenants
  ALTER COLUMN id SET DEFAULT public.uuid_generate_v7();
