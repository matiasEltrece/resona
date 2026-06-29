import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectWatermark } from "@/lib/watermark";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/admin/detect-watermark — solo admin. Recibe { audioBase64 } (WAV) y reporta si tiene la marca. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: { audioBase64?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.audioBase64) return NextResponse.json({ error: "Falta el audio" }, { status: 400 });

  return NextResponse.json(detectWatermark(body.audioBase64));
}
