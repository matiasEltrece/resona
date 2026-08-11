-- ═══════════════════════════════════════════════════════════════════════════
-- KYMA · Fixes del audit de Lemon Squeezy (2026-07-22)
-- 1) CRITICAL: cierra el self-upgrade de plan/creditos via UPDATE directo a
--    kyma_profiles (ningun codigo de la app lo necesita, todo pasa por
--    service_role en el servidor).
-- 2) Soporte para refund de packs de creditos (clawback idempotente).
-- 3) Columna para idempotencia del email de recibo en subscription_created.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Fix CRITICAL #5: kyma_profiles no debe ser editable por el cliente ───
drop policy if exists "kyma: usuarios actualizan su propio perfil" on public.kyma_profiles;

-- Defensa en profundidad: aunque no exista policy de UPDATE (RLS deniega por
-- default), revocamos el grant explicito de las columnas sensibles para que
-- una policy futura mal escrita no vuelva a abrir el mismo agujero.
revoke update (plan, extra_credits, subscription_status, subscription_renews_at,
  subscription_ends_at, lemon_customer_portal_url, lemon_subscription_id)
  on public.kyma_profiles from authenticated, anon;

-- ─── Fix HIGH #7: refund de packs de creditos ─────────────────────────────
alter table public.kyma_credit_purchases add column if not exists refunded_at timestamptz;

create or replace function public.kyma_refund_credits(p_order_id text)
returns boolean language plpgsql security definer set search_path to '' as $$
declare v_user uuid; v_chars integer; v_already timestamptz;
begin
  select user_id, chars, refunded_at into v_user, v_chars, v_already
    from public.kyma_credit_purchases where lemon_order_id = p_order_id;

  if v_user is null then
    return false; -- no encontramos la orden, no hacemos nada
  end if;
  if v_already is not null then
    return false; -- ya estaba refundeada, idempotente
  end if;

  update public.kyma_profiles set extra_credits = greatest(0, coalesce(extra_credits,0) - v_chars),
    updated_at = now() where id = v_user;
  update public.kyma_credit_purchases set refunded_at = now() where lemon_order_id = p_order_id;
  return true;
end; $$;

revoke execute on function public.kyma_refund_credits(text) from anon, authenticated;

-- ─── Fix MEDIUM #2/#4: idempotencia del recibo de subscription_created ────
alter table public.kyma_profiles add column if not exists lemon_subscription_id text;
