import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** POST /api/account/delete — elimina la cuenta del usuario autenticado (self-service). */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // No permitir que el admin se borre por accidente
  if (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "La cuenta admin no se puede eliminar desde acá." }, { status: 403 });
  }

  const service = await createServiceClient();
  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cerrar sesión local
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
