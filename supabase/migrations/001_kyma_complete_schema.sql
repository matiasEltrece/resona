-- ============================================================================
-- KYMA — Schema completo y autocontenido
-- ============================================================================
-- Recrea TODA la base de datos de Kyma en un proyecto Supabase limpio.
-- Idempotente: se puede correr de nuevo sin romper nada.
--
-- USO (para levantar Kyma en una infraestructura nueva / comprador):
--   1. Crear un proyecto Supabase nuevo
--   2. Supabase Dashboard → SQL Editor → pegar este archivo → Run
--   3. Configurar Auth (magic link) y el bucket de storage queda creado acá
--   4. Setear las env vars (ver .env.example)
--
-- Todas las tablas usan prefijo kyma_ para poder convivir con otros proyectos
-- si se comparte el Supabase (en producción Kyma puede tener su Supabase propio).
-- ============================================================================

-- ─── Perfil de usuario ──────────────────────────────────────────────────────
create table if not exists public.kyma_profiles (
  id           uuid primary key references auth.users on delete cascade,
  email        text not null,
  display_name text,
  plan         text not null default 'free',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.kyma_profiles enable row level security;

do $$ begin
  create policy "kyma: ver perfil propio" on public.kyma_profiles for select using (auth.uid() = id);
  create policy "kyma: actualizar perfil propio" on public.kyma_profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- ─── Créditos mensuales ─────────────────────────────────────────────────────
create table if not exists public.kyma_credits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  month       text not null,
  used        integer not null default 0,
  "limit"     integer not null default 20,
  updated_at  timestamptz not null default now(),
  unique (user_id, month)
);
alter table public.kyma_credits enable row level security;
do $$ begin
  create policy "kyma: ver creditos" on public.kyma_credits for select using (auth.uid() = user_id);
  create policy "kyma: service gestiona creditos" on public.kyma_credits for all to service_role using (true) with check (true);
exception when duplicate_object then null; end $$;

-- ─── Historial de generaciones ──────────────────────────────────────────────
create table if not exists public.kyma_generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete set null,
  mode        text not null,
  language    text not null,
  text_length integer not null,
  duration_ms integer,
  rtf         numeric(6,4),
  provider    text not null default 'mock',
  created_at  timestamptz not null default now()
);
alter table public.kyma_generations enable row level security;
do $$ begin
  create policy "kyma: ver generaciones" on public.kyma_generations for select using (auth.uid() = user_id);
  create policy "kyma: service inserta generaciones" on public.kyma_generations for insert to service_role with check (true);
exception when duplicate_object then null; end $$;

-- ─── Voces clonadas reutilizables ("Mis voces") ─────────────────────────────
create table if not exists public.kyma_voices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  storage_path text not null,
  ref_text     text,
  language     text,
  created_at   timestamptz not null default now()
);
alter table public.kyma_voices enable row level security;
do $$ begin
  create policy "kyma: ver voces" on public.kyma_voices for select using (auth.uid() = user_id);
  create policy "kyma: crear voces" on public.kyma_voices for insert with check (auth.uid() = user_id);
  create policy "kyma: borrar voces" on public.kyma_voices for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── API keys (API pública) ─────────────────────────────────────────────────
create table if not exists public.kyma_api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null default 'API key',
  key_hash     text not null unique,
  key_prefix   text not null,
  revoked      boolean not null default false,
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.kyma_api_keys enable row level security;
do $$ begin
  create policy "kyma: ver api keys" on public.kyma_api_keys for select using (auth.uid() = user_id);
  create policy "kyma: crear api keys" on public.kyma_api_keys for insert with check (auth.uid() = user_id);
  create policy "kyma: borrar api keys" on public.kyma_api_keys for delete using (auth.uid() = user_id);
  create policy "kyma: actualizar api keys" on public.kyma_api_keys for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Uso de la API (analítica) ──────────────────────────────────────────────
create table if not exists public.kyma_api_usage (
  id          uuid primary key default gen_random_uuid(),
  api_key_id  uuid references public.kyma_api_keys on delete set null,
  user_id     uuid references auth.users on delete cascade,
  endpoint    text not null,
  status      integer not null,
  chars       integer,
  created_at  timestamptz not null default now()
);
alter table public.kyma_api_usage enable row level security;
do $$ begin
  create policy "kyma: ver uso api" on public.kyma_api_usage for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Planes (mapeo a Lemon Squeezy) ─────────────────────────────────────────
create table if not exists public.kyma_plans (
  id                text primary key,
  name              text not null,
  price_usd         numeric(10,2),
  interval          text,
  monthly_credits   integer,
  lemon_variant_id  text
);
insert into public.kyma_plans (id, name, price_usd, interval, monthly_credits) values
  ('free',    'Free',    0,  'month', 20),
  ('creator', 'Creator', 12, 'month', 500),
  ('pro',     'Pro',     39, 'month', null)
on conflict (id) do nothing;

-- ─── Trigger: crear perfil al registrarse ───────────────────────────────────
create or replace function public.kyma_handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.kyma_profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists kyma_on_auth_user_created on auth.users;
create trigger kyma_on_auth_user_created
  after insert on auth.users for each row execute procedure public.kyma_handle_new_user();

-- ─── Función: consumir un crédito (atómica) ─────────────────────────────────
create or replace function public.kyma_consume_credit(p_user_id uuid, p_month text)
returns table (ok boolean, used integer, "limit" integer)
language plpgsql security definer as $$
declare v_used integer; v_limit integer; v_plan text;
begin
  select plan into v_plan from public.kyma_profiles where id = p_user_id;
  v_limit := case when v_plan = 'creator' then 500 when v_plan = 'pro' then 999999 else 20 end;
  insert into public.kyma_credits (user_id, month, used, "limit")
  values (p_user_id, p_month, 0, v_limit) on conflict (user_id, month) do nothing;
  update public.kyma_credits set used = used + 1, "limit" = v_limit, updated_at = now()
  where user_id = p_user_id and month = p_month and used < v_limit
  returning used, "limit" into v_used, v_limit;
  if v_used is null then
    select kc.used, kc."limit" into v_used, v_limit from public.kyma_credits kc
    where kc.user_id = p_user_id and kc.month = p_month;
    return query select false, v_used, v_limit;
  else
    return query select true, v_used, v_limit;
  end if;
end; $$;

-- Alias para la API (mismo pool)
create or replace function public.kyma_consume_credit_api(p_user_id uuid, p_month text)
returns table (ok boolean, used integer, "limit" integer)
language plpgsql security definer as $$
begin
  return query select * from public.kyma_consume_credit(p_user_id, p_month);
end; $$;

-- ─── Storage: bucket privado para audios de referencia ──────────────────────
insert into storage.buckets (id, name, public) values ('kyma-voices', 'kyma-voices', false)
on conflict (id) do nothing;
do $$ begin
  create policy "kyma: leer audio propio" on storage.objects for select
    using (bucket_id = 'kyma-voices' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "kyma: subir audio propio" on storage.objects for insert
    with check (bucket_id = 'kyma-voices' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "kyma: borrar audio propio" on storage.objects for delete
    using (bucket_id = 'kyma-voices' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- ============================================================================
-- FIN — Kyma corre entera con este schema + las env vars de .env.example
-- ============================================================================
