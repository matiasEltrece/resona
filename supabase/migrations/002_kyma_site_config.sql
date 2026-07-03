-- ─── Config de marca editable desde el admin (singleton) ─────────────────
create table if not exists public.kyma_site_config (
  singleton boolean primary key default true,
  constraint kyma_site_config_singleton check (singleton),
  accent_from text not null default '#ecd49a',
  accent_via text not null default '#c79a45',
  accent_to text not null default '#a87f33',
  font_preset text not null default 'bricolage-space',
  logo_compact_url text,
  logo_studio_url text,
  updated_at timestamptz not null default now()
);

insert into public.kyma_site_config (singleton) values (true)
on conflict (singleton) do nothing;

alter table public.kyma_site_config enable row level security;

do $$ begin
  drop policy if exists "site config: lectura publica" on public.kyma_site_config;
  create policy "site config: lectura publica" on public.kyma_site_config for select using (true);
end $$;

-- ─── Storage: bucket público para logos/assets de marca ──────────────────
insert into storage.buckets (id, name, public) values ('kyma-brand','kyma-brand',true)
on conflict (id) do nothing;
