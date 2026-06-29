-- Voces DISEÑADAS guardadas (además de las clonadas).
-- Permite guardar un diseño (atributos) + semilla fija → voz reutilizable y CONSISTENTE
-- (clave para avatares: misma voz en todos los textos).
-- Cambio ADITIVO y no destructivo. kyma_voices es exclusiva de Kyma.

alter table public.kyma_voices add column if not exists kind   text not null default 'clone';  -- 'clone' | 'design'
alter table public.kyma_voices add column if not exists design jsonb;                           -- atributos de la voz diseñada
alter table public.kyma_voices add column if not exists seed   integer;                         -- semilla fija para consistencia

-- Las voces diseñadas no tienen audio de referencia en Storage.
alter table public.kyma_voices alter column storage_path drop not null;
