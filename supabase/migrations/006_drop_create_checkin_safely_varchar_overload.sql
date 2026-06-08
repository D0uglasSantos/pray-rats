-- Remove sobrecarga acidental da RPC create_checkin_safely com assinatura varchar.
-- Mantém apenas a assinatura principal com title text.

drop function if exists public.create_checkin_safely(
  uuid,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  checkin_visibility,
  text
);
