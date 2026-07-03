import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { FONT_PRESETS } from "@/lib/site-config";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/webp", "image/svg+xml"];

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!user && !!adminEmail && user.email === adminEmail;
}

async function uploadLogo(service: ReturnType<typeof createAdminClient>, file: File, slug: string) {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) throw new Error(`Formato no soportado: ${file.type}`);
  if (file.size > MAX_LOGO_BYTES) throw new Error("El archivo supera 2MB");
  const ext = file.type === "image/svg+xml" ? "svg" : file.type === "image/webp" ? "webp" : "png";
  const path = `${slug}-${Date.now()}.${ext}`;
  const buf = await file.arrayBuffer();
  const { error } = await service.storage.from("kyma-brand").upload(path, buf, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = service.storage.from("kyma-brand").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const form = await req.formData();
  const accentFrom = String(form.get("accent_from") ?? "");
  const accentVia = String(form.get("accent_via") ?? "");
  const accentTo = String(form.get("accent_to") ?? "");
  const fontPreset = String(form.get("font_preset") ?? "");
  const logoCompact = form.get("logo_compact") as File | null;
  const logoStudio = form.get("logo_studio") as File | null;

  if (![accentFrom, accentVia, accentTo].every((c) => HEX_RE.test(c))) {
    return NextResponse.json({ error: "Los colores deben ser hex válidos (#rrggbb)" }, { status: 400 });
  }
  if (!FONT_PRESETS[fontPreset]) {
    return NextResponse.json({ error: "Preset de tipografía inválido" }, { status: 400 });
  }

  const service = createAdminClient();
  const update: Record<string, string> = {
    accent_from: accentFrom,
    accent_via: accentVia,
    accent_to: accentTo,
    font_preset: fontPreset,
    updated_at: new Date().toISOString(),
  };

  try {
    if (logoCompact && logoCompact.size > 0) update.logo_compact_url = await uploadLogo(service, logoCompact, "kyma-compact");
    if (logoStudio && logoStudio.size > 0) update.logo_studio_url = await uploadLogo(service, logoStudio, "kyma-studio");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error subiendo el logo" }, { status: 400 });
  }

  const { data, error } = await service.from("kyma_site_config").update(update).eq("singleton", true).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "No se actualizó ninguna fila (revisar RLS/permisos)" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
