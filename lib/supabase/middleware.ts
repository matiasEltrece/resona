import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/auth/", "/no-access", "/api/auth/"];

function isAllowed(email: string | undefined): boolean {
  const raw = process.env.ALLOWED_EMAILS ?? "";
  if (!raw.trim()) return true; // sin allowlist → abierto
  const list = raw.split(",").map((e) => e.trim().toLowerCase());
  return !!email && list.includes(email.toLowerCase());
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Usuario logueado pero no en allowlist → /no-access
  if (user && !isPublic && pathname !== "/no-access" && !isAllowed(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/no-access";
    return NextResponse.redirect(url);
  }

  // Rutas que requieren auth
  if (pathname.startsWith("/dashboard") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rutas de API protegidas (excepto auth)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/") && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Si ya está logueado y va al login, redirigir al dashboard
  if (pathname === "/auth/login" && user) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.searchParams.delete("next");
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}
