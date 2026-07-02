import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendKymaEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Email de bienvenida solo en confirmación de REGISTRO (no en reset ni cambio de email)
      const isSignup = !next.startsWith("/auth/reset") && !next.startsWith("/dashboard/cuenta");
      if (isSignup && data.user?.email) void sendKymaEmail("welcome", data.user.email);
      const redirectUrl = new URL(next.startsWith("/") ? next : "/dashboard", origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Error — redirigir al login con mensaje
  return NextResponse.redirect(
    new URL("/auth/login?message=link-invalido", origin),
  );
}
