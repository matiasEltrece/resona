-- ═══════════════════════════════════════════════════════════════════════════
-- KYMA · Esquema COMPLETO y autoritativo
-- Generado desde la DB en vivo (proyecto synthetic.com.ar) el 2026-07-01.
-- Reemplaza a 001_schema.sql, 001_kyma_complete_schema.sql y 002_kyma_design_voices.sql
-- (que estaban desactualizados respecto a la base real).
-- Idempotente: seguro de correr en una base nueva para reproducir Kyma "llave en mano".
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Tablas ──────────────────────────────────────────────────────────────
create table if not exists public.kyma_profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  email                     text not null,
  display_name              text,
  plan                      text not null default 'free',
  extra_credits             integer not null default 0,
  lemon_customer_portal_url text,
  subscription_status       text,
  subscription_renews_at    timestamptz,
  subscription_ends_at      timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table if not exists public.kyma_plans (
  id               text primary key,
  name             text not null,
  price_usd        numeric,
  interval         text,
  monthly_credits  integer,
  lemon_variant_id text
);

create table if not exists public.kyma_credits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  month      text not null,
  used       integer not null default 0,
  "limit"    integer not null default 20,
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create table if not exists public.kyma_generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  mode        text not null,
  language    text not null,
  text_length integer not null,
  duration_ms integer,
  rtf         numeric,
  provider    text not null default 'mock',
  consent     boolean,
  created_at  timestamptz not null default now()
);

create table if not exists public.kyma_voices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  storage_path text,
  ref_text     text,
  language     text,
  kind         text not null default 'clone',
  design       jsonb,
  seed         integer,
  created_at   timestamptz not null default now()
);

create table if not exists public.kyma_api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null default 'API key',
  key_hash     text not null unique,
  key_prefix   text not null,
  revoked      boolean not null default false,
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists public.kyma_api_usage (
  id         uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.kyma_api_keys(id) on delete set null,
  user_id    uuid references auth.users(id) on delete cascade,
  endpoint   text not null,
  status     integer not null,
  chars      integer,
  created_at timestamptz not null default now()
);

create table if not exists public.kyma_credit_packs (
  id               text primary key,
  name             text not null,
  chars            integer not null,
  price_usd        numeric not null,
  lemon_variant_id text,
  buy_url          text,
  active           boolean not null default true,
  sort             integer not null default 0
);

create table if not exists public.kyma_credit_purchases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  pack_id        text,
  chars          integer not null,
  amount_usd     numeric,
  lemon_order_id text,
  created_at     timestamptz not null default now()
);

-- ─── Seed de planes (LÍMITES REALES de caracteres/mes) ───────────────────
insert into public.kyma_plans (id, name, price_usd, interval, monthly_credits) values
  ('free',    'Free',    0,  'month', 10000),
  ('creator', 'Creator', 12, 'month', 200000),
  ('pro',     'Pro',     39, 'month', 1000000),
  ('admin',   'Admin',   0,  'month', 1000000000)
on conflict (id) do update
  set name = excluded.name, price_usd = excluded.price_usd,
      interval = excluded.interval, monthly_credits = excluded.monthly_credits;

-- Packs de créditos extra (opcional): configurá lemon_variant_id / buy_url con tus datos.
-- insert into public.kyma_credit_packs (id, name, chars, price_usd, lemon_variant_id, buy_url, sort)
-- values ('pack_100k','100k caracteres',100000,5,'<variant_id>','<buy_url>',1) on conflict (id) do nothing;

-- ─── Funciones ───────────────────────────────────────────────────────────
-- Crear perfil al registrarse
create or replace function public.kyma_handle_new_user()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  insert into public.kyma_profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists kyma_on_auth_user_created on auth.users;
create trigger kyma_on_auth_user_created
  after insert on auth.users for each row execute function public.kyma_handle_new_user();

-- Consumir créditos POR CARACTERES: mensual del plan + packs (extra_credits) cuando se agota.
create or replace function public.kyma_consume_credit(p_user_id uuid, p_month text, p_chars integer default 1)
returns table(ok boolean, used integer, "limit" integer)
language plpgsql security definer set search_path to '' as $$
declare v_used integer; v_limit integer; v_plan text; v_extra integer;
        v_monthly_remaining integer; v_from_extra integer;
begin
  select plan, coalesce(extra_credits,0) into v_plan, v_extra from public.kyma_profiles where id = p_user_id;
  if v_extra is null then v_extra := 0; end if;
  select monthly_credits into v_limit from public.kyma_plans where id = coalesce(v_plan,'free');
  if v_limit is null then v_limit := 10000; end if;
  insert into public.kyma_credits (user_id, month, used, "limit")
    values (p_user_id, p_month, 0, v_limit) on conflict (user_id, month) do nothing;
  update public.kyma_credits kc set "limit" = v_limit, updated_at = now()
    where kc.user_id = p_user_id and kc.month = p_month;
  select kc.used into v_used from public.kyma_credits kc where kc.user_id = p_user_id and kc.month = p_month;
  v_monthly_remaining := greatest(0, v_limit - v_used);
  if p_chars <= v_monthly_remaining then
    update public.kyma_credits kc set used = kc.used + p_chars, updated_at = now()
      where kc.user_id = p_user_id and kc.month = p_month;
    v_used := v_used + p_chars;
    return query select true, v_used, v_limit;
  else
    v_from_extra := p_chars - v_monthly_remaining;
    if v_extra >= v_from_extra then
      update public.kyma_credits kc set used = v_limit, updated_at = now()
        where kc.user_id = p_user_id and kc.month = p_month;
      update public.kyma_profiles set extra_credits = extra_credits - v_from_extra, updated_at = now()
        where id = p_user_id;
      return query select true, v_limit, v_limit;
    else
      return query select false, v_used, v_limit;
    end if;
  end if;
end; $$;

-- Alias para la API (mismo pool)
create or replace function public.kyma_consume_credit_api(p_user_id uuid, p_month text, p_chars integer default 1)
returns table(ok boolean, used integer, "limit" integer)
language plpgsql security definer set search_path to '' as $$
begin
  return query select * from public.kyma_consume_credit(p_user_id, p_month, p_chars);
end; $$;

-- Sumar créditos de un pack comprado (llamada desde el webhook de Lemon)
create or replace function public.kyma_add_credits(p_user_id uuid, p_chars integer, p_pack_id text, p_amount numeric, p_order_id text)
returns void language plpgsql security definer set search_path to '' as $$
begin
  update public.kyma_profiles set extra_credits = coalesce(extra_credits,0) + p_chars, updated_at = now()
    where id = p_user_id;
  insert into public.kyma_credit_purchases (user_id, pack_id, chars, amount_usd, lemon_order_id)
    values (p_user_id, p_pack_id, p_chars, p_amount, p_order_id);
end; $$;

-- KPIs del panel admin
create or replace function public.kyma_admin_overview()
returns jsonb language sql security definer set search_path to '' as $$
  select jsonb_build_object(
    'perfiles', (select count(*) from public.kyma_profiles),
    'activos', (select count(distinct user_id) from public.kyma_generations),
    'por_plan', (select coalesce(jsonb_object_agg(plan,c),'{}'::jsonb) from (select coalesce(plan,'free') plan, count(*) c from public.kyma_profiles group by 1) t),
    'gen_total', (select count(*) from public.kyma_generations),
    'gen_mes', (select count(*) from public.kyma_generations where created_at >= date_trunc('month', now())),
    'gen_7d', (select count(*) from public.kyma_generations where created_at >= now() - interval '7 days'),
    'chars_total', (select coalesce(sum(text_length),0) from public.kyma_generations),
    'chars_mes', (select coalesce(sum(text_length),0) from public.kyma_generations where created_at >= date_trunc('month', now())),
    'clones', (select count(*) from public.kyma_generations where mode='clone'),
    'consent_ok', (select count(*) from public.kyma_generations where consent is true),
    'api_total', (select count(*) from public.kyma_api_usage),
    'api_mes', (select count(*) from public.kyma_api_usage where created_at >= date_trunc('month', now())),
    'api_errores', (select count(*) from public.kyma_api_usage where status >= 400 and created_at >= date_trunc('month', now())),
    'api_keys', (select count(*) from public.kyma_api_keys where revoked = false),
    'voces', (select count(*) from public.kyma_voices),
    'compras', (select count(*) from public.kyma_credit_purchases),
    'ingresos_packs', (select coalesce(sum(amount_usd),0) from public.kyma_credit_purchases),
    'creditos_vivos', (select coalesce(sum(extra_credits),0) from public.kyma_profiles)
  );
$$;

-- Tabla de usuarios del panel admin
create or replace function public.kyma_admin_users(p_limit integer default 100)
returns table(id uuid, email text, plan text, extra_credits integer, gens bigint, chars bigint, last_activity timestamptz, created_at timestamptz)
language sql security definer set search_path to '' as $$
  select p.id, p.email, coalesce(p.plan,'free') as plan, coalesce(p.extra_credits,0) as extra_credits,
    (select count(*) from public.kyma_generations g where g.user_id = p.id) as gens,
    (select coalesce(sum(g.text_length),0) from public.kyma_generations g where g.user_id = p.id) as chars,
    (select max(g.created_at) from public.kyma_generations g where g.user_id = p.id) as last_activity,
    p.created_at
  from public.kyma_profiles p order by p.created_at desc limit p_limit;
$$;

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.kyma_profiles         enable row level security;
alter table public.kyma_plans            enable row level security;
alter table public.kyma_credits          enable row level security;
alter table public.kyma_generations      enable row level security;
alter table public.kyma_voices           enable row level security;
alter table public.kyma_api_keys         enable row level security;
alter table public.kyma_api_usage        enable row level security;
alter table public.kyma_credit_packs     enable row level security;
alter table public.kyma_credit_purchases enable row level security;

do $$ begin
  -- profiles
  drop policy if exists "kyma: usuarios ven su propio perfil" on public.kyma_profiles;
  create policy "kyma: usuarios ven su propio perfil" on public.kyma_profiles for select using ((select auth.uid()) = id);
  drop policy if exists "kyma: usuarios actualizan su propio perfil" on public.kyma_profiles;
  create policy "kyma: usuarios actualizan su propio perfil" on public.kyma_profiles for update using ((select auth.uid()) = id);
  -- plans (lectura pública)
  drop policy if exists "kyma: planes lectura publica" on public.kyma_plans;
  create policy "kyma: planes lectura publica" on public.kyma_plans for select using (true);
  -- credits
  drop policy if exists "kyma: usuarios ven sus creditos" on public.kyma_credits;
  create policy "kyma: usuarios ven sus creditos" on public.kyma_credits for select using ((select auth.uid()) = user_id);
  drop policy if exists "kyma: service role gestiona creditos" on public.kyma_credits;
  create policy "kyma: service role gestiona creditos" on public.kyma_credits for all to service_role using (true) with check (true);
  -- generations
  drop policy if exists "kyma: usuarios ven sus generaciones" on public.kyma_generations;
  create policy "kyma: usuarios ven sus generaciones" on public.kyma_generations for select using ((select auth.uid()) = user_id);
  drop policy if exists "kyma: service role inserta generaciones" on public.kyma_generations;
  create policy "kyma: service role inserta generaciones" on public.kyma_generations for insert to service_role with check (true);
  -- voices
  drop policy if exists "kyma: usuarios ven sus voces" on public.kyma_voices;
  create policy "kyma: usuarios ven sus voces" on public.kyma_voices for select using ((select auth.uid()) = user_id);
  drop policy if exists "kyma: usuarios crean sus voces" on public.kyma_voices;
  create policy "kyma: usuarios crean sus voces" on public.kyma_voices for insert with check ((select auth.uid()) = user_id);
  drop policy if exists "kyma: usuarios borran sus voces" on public.kyma_voices;
  create policy "kyma: usuarios borran sus voces" on public.kyma_voices for delete using ((select auth.uid()) = user_id);
  -- api_keys
  drop policy if exists "kyma: usuarios ven sus api keys" on public.kyma_api_keys;
  create policy "kyma: usuarios ven sus api keys" on public.kyma_api_keys for select using ((select auth.uid()) = user_id);
  drop policy if exists "kyma: usuarios crean sus api keys" on public.kyma_api_keys;
  create policy "kyma: usuarios crean sus api keys" on public.kyma_api_keys for insert with check ((select auth.uid()) = user_id);
  drop policy if exists "kyma: usuarios actualizan sus api keys" on public.kyma_api_keys;
  create policy "kyma: usuarios actualizan sus api keys" on public.kyma_api_keys for update using ((select auth.uid()) = user_id);
  drop policy if exists "kyma: usuarios borran sus api keys" on public.kyma_api_keys;
  create policy "kyma: usuarios borran sus api keys" on public.kyma_api_keys for delete using ((select auth.uid()) = user_id);
  -- api_usage
  drop policy if exists "kyma: usuarios ven su uso de api" on public.kyma_api_usage;
  create policy "kyma: usuarios ven su uso de api" on public.kyma_api_usage for select using ((select auth.uid()) = user_id);
  -- credit_packs (lectura pública)
  drop policy if exists "packs lectura publica" on public.kyma_credit_packs;
  create policy "packs lectura publica" on public.kyma_credit_packs for select using (true);
  -- credit_purchases
  drop policy if exists "compras propias" on public.kyma_credit_purchases;
  create policy "compras propias" on public.kyma_credit_purchases for select using ((select auth.uid()) = user_id);
end $$;

-- ─── Storage: bucket privado para audios de referencia ───────────────────
insert into storage.buckets (id, name, public) values ('kyma-voices','kyma-voices',false)
on conflict (id) do nothing;

do $$ begin
  drop policy if exists "kyma: leer audio propio" on storage.objects;
  create policy "kyma: leer audio propio" on storage.objects for select
    using (bucket_id = 'kyma-voices' and (storage.foldername(name))[1] = (select auth.uid())::text);
  drop policy if exists "kyma: subir audio propio" on storage.objects;
  create policy "kyma: subir audio propio" on storage.objects for insert
    with check (bucket_id = 'kyma-voices' and (storage.foldername(name))[1] = (select auth.uid())::text);
  drop policy if exists "kyma: borrar audio propio" on storage.objects;
  create policy "kyma: borrar audio propio" on storage.objects for delete
    using (bucket_id = 'kyma-voices' and (storage.foldername(name))[1] = (select auth.uid())::text);
end $$;
