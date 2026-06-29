import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** GET /api/voices — lista las voces guardadas del usuario. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ voices: [] });

  const { data } = await supabase
    .from("kyma_voices")
    .select("id, name, ref_text, language, created_at, kind, design, seed")
    .order("created_at", { ascending: false });

  return NextResponse.json({ voices: data ?? [] });
}

/** POST /api/voices — guarda una voz clonada (audio de referencia + metadata). */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; audioBase64?: string; refText?: string; language?: string; kind?: string; design?: unknown; seed?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // ── Voz DISEÑADA (atributos + semilla fija → reutilizable y consistente) ──
  if (body.kind === "design" || body.design) {
    if (!body.name?.trim() || !body.design) {
      return NextResponse.json({ error: "Falta el nombre o el diseño" }, { status: 400 });
    }
    const svc = await createServiceClient();
    const { data, error } = await svc
      .from("kyma_voices")
      .insert({
        user_id: user.id,
        name: body.name.trim().slice(0, 60),
        kind: "design",
        design: body.design,
        seed: typeof body.seed === "number" ? body.seed : null,
        language: body.language || null,
        storage_path: null,
      })
      .select("id, name, ref_text, language, created_at, kind, design, seed")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ voice: data });
  }

  if (!body.name?.trim() || !body.audioBase64) {
    return NextResponse.json({ error: "Falta el nombre o el audio" }, { status: 400 });
  }

  const service = await createServiceClient();
  const id = crypto.randomUUID();
  const path = `${user.id}/${id}.wav`;
  const bytes = Buffer.from(body.audioBase64, "base64");

  const { error: upErr } = await service.storage
    .from("kyma-voices")
    .upload(path, bytes, { contentType: "audio/wav", upsert: true });

  if (upErr) {
    return NextResponse.json({ error: `No se pudo guardar el audio: ${upErr.message}` }, { status: 500 });
  }

  const { data, error } = await service
    .from("kyma_voices")
    .insert({
      id,
      user_id: user.id,
      name: body.name.trim().slice(0, 60),
      storage_path: path,
      ref_text: body.refText?.trim() || null,
      language: body.language || null,
    })
    .select("id, name, ref_text, language, created_at, kind, design, seed")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ voice: data });
}
