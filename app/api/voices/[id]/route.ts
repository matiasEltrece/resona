import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** DELETE /api/voices/[id] — borra una voz guardada (fila + audio). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = await createServiceClient();

  // Verificar propiedad y obtener el path
  const { data: voice } = await service
    .from("kyma_voices")
    .select("storage_path, user_id")
    .eq("id", id)
    .single();

  if (!voice || voice.user_id !== user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  await service.storage.from("kyma-voices").remove([voice.storage_path]);
  await service.from("kyma_voices").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
