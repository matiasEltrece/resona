import { createAdminClient } from "@/lib/supabase/server";

export interface SiteConfig {
  accentFrom: string;
  accentVia: string;
  accentTo: string;
  fontPreset: string;
  logoCompactUrl: string | null;
  logoStudioUrl: string | null;
}

const DEFAULTS: SiteConfig = {
  accentFrom: "#ecd49a",
  accentVia: "#c79a45",
  accentTo: "#a87f33",
  fontPreset: "bricolage-space",
  logoCompactUrl: null,
  logoStudioUrl: null,
};

export interface FontPreset {
  label: string;
  head: string; // referencia a la CSS var cargada en layout.tsx
  body: string;
}

export const FONT_PRESETS: Record<string, FontPreset> = {
  "bricolage-space": { label: "Bricolage Grotesque + Space Grotesk (actual)", head: "var(--font-bricolage)", body: "var(--font-space)" },
  "playfair-inter": { label: "Playfair Display + Inter", head: "var(--font-playfair)", body: "var(--font-inter)" },
  "sora-manrope": { label: "Sora + Manrope", head: "var(--font-sora)", body: "var(--font-manrope)" },
  "fraunces-inter": { label: "Fraunces + Inter", head: "var(--font-fraunces)", body: "var(--font-inter)" },
};

export const DEFAULT_FONT_PRESET = "bricolage-space";

/** Config de marca (colores/tipografía/logos), editable desde /dashboard/admin/branding. Lectura pública, sin caché entre requests. */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const service = createAdminClient();
    const { data } = await service.from("kyma_site_config").select("*").eq("singleton", true).maybeSingle();
    if (!data) return DEFAULTS;
    return {
      accentFrom: data.accent_from ?? DEFAULTS.accentFrom,
      accentVia: data.accent_via ?? DEFAULTS.accentVia,
      accentTo: data.accent_to ?? DEFAULTS.accentTo,
      fontPreset: FONT_PRESETS[data.font_preset] ? data.font_preset : DEFAULT_FONT_PRESET,
      logoCompactUrl: data.logo_compact_url ?? null,
      logoStudioUrl: data.logo_studio_url ?? null,
    };
  } catch {
    return DEFAULTS;
  }
}
