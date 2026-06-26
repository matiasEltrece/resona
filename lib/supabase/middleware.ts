import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function basicAuthChallenge() {
  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Kyma"' },
  });
}

function checkBasicAuth(request: NextRequest): boolean {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return true; // sin vars seteadas → abierto

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return false;

  const [u, p] = atob(header.slice(6)).split(":");
  return u === user && p === pass;
}

export async function updateSession(request: NextRequest) {
  // HTTP Basic Auth — primera línea de defensa
  if (!checkBasicAuth(request)) return basicAuthChallenge();

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

  // Rutas que requieren auth de Supabase
  if (pathname.startsWith("/dashboard") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
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
