-- Kyma — Schema inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- ─── Perfil de usuario (auto-creado al signup) ────────────────────────────
create table if not exists public.kyma_profiles (
  id           uuid primary key references auth.users on delete cascade,
  email        text not null,
  display_name text,
  plan         text not null default 'free', -- 'free' | 'creator' | 'pro'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.kyma_profiles enable row level security;

create policy "Usuarios ven solo su propio perfil"
  on public.kyma_profiles for select
  using (auth.uid() = id);

create policy "Usuarios actualizan solo su propio perfil"
  on public.kyma_profiles for update
  using (auth.uid() = id);

-- ─── Créditos mensuales ───────────────────────────────────────────────────
create table if not exists public.kyma_credits (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users on delete cascade,
  month     text not null,             -- formato 'YYYY-MM'
  used      integer not null default 0,
  "limit"   integer not null default 20,  -- se sube al cambiar el plan
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.kyma_credits enable row level security;

create policy "Usuarios ven solo sus créditos"
  on public.kyma_credits for select
  using (auth.uid() = user_id);

-- Service role puede actualizar (lo hace el API de generación)
create policy "Service role gestiona créditos"
  on public.kyma_credits for all
  using (true)
  with check (true);

-- ─── Historial de generaciones ────────────────────────────────────────────
create table if not exists public.kyma_generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete set null,
  mode        text not null,           -- 'design' | 'clone'
  language    text not null,
  text_length integer not null,
  duration_ms integer,
  rtf         numeric(6,4),
  provider    text not null default 'mock',
  created_at  timestamptz not null default now()
);

alter table public.kyma_generations enable row level security;

create policy "Usuarios ven solo sus generaciones"
  on public.kyma_generations for select
  using (auth.uid() = user_id);

-- ─── Trigger: crear perfil al registrarse ────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.kyma_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Función: consumir un crédito (upsert atómico) ───────────────────────
create or replace function public.kyma_consume_credit(p_user_id uuid, p_month text)
returns table (ok boolean, used integer, "limit" integer)
language plpgsql security definer
as $$
declare
  v_used  integer;
  v_limit integer;
  v_plan  text;
begin
  -- Obtener plan del usuario para saber el límite
  select plan into v_plan from public.kyma_profiles where id = p_user_id;

  v_limit := case
    when v_plan = 'creator' then 500
    when v_plan = 'pro'     then 999999
    else 20
  end;

  -- Upsert: si no existe el registro del mes, crearlo
  insert into public.kyma_credits (user_id, month, used, "limit")
  values (p_user_id, p_month, 0, v_limit)
  on conflict (user_id, month) do nothing;

  -- Intentar consumir (solo si hay saldo)
  update public.kyma_credits
  set
    used = used + 1,
    "limit" = v_limit,
    updated_at = now()
  where user_id = p_user_id
    and month = p_month
    and used < v_limit
  returning used, "limit" into v_used, v_limit;

  if v_used is null then
    -- Sin saldo
    select used, "limit" into v_used, v_limit
    from public.kyma_credits
    where user_id = p_user_id and month = p_month;
    return query select false, v_used, v_limit;
  else
    return query select true, v_used, v_limit;
  end if;
end;
$$;
