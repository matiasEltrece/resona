import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";

/** GET /api/keys — lista las API keys del usuario (sin el texto plano). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ keys: [] });

  const { data } = await supabase
    .from("kyma_api_keys")
    .select("id, name, key_prefix, revoked, last_used_at, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ keys: data ?? [] });
}

/** POST /api/keys — crea una API key. Devuelve el texto plano UNA sola vez. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let name = "API key";
  try {
    const body = await req.json();
    if (body?.name?.trim()) name = String(body.name).trim().slice(0, 40);
  } catch { /* nombre default */ }

  const { key, hash, prefix } = generateApiKey();
  const service = await createServiceClient();

  const { data, error } = await service
    .from("kyma_api_keys")
    .insert({ user_id: user.id, name, key_hash: hash, key_prefix: prefix })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // El texto plano se devuelve UNA vez; después solo queda el prefix.
  return NextResponse.json({ ...data, key });
}
