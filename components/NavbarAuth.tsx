import { createClient } from "@/lib/supabase/server";
import { getSiteConfig } from "@/lib/site-config";

export default async function NavbarAuth() {
  const supabase = await createClient();
  const [{ data: { user } }, config] = await Promise.all([
    supabase.auth.getUser(),
    getSiteConfig(),
  ]);
  const logoCompactUrl = config.logoCompactUrl || "/kyma-logo.png";

  return (
    <nav className="sticky top-0 z-40 border-b" style={{ background: "var(--c-page)", borderColor: "var(--c-border)" }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "var(--c-text)" }}>
            <img src={logoCompactUrl} alt="Kyma" style={{ height: 26, width: "auto" }} />
          </a>
          <span className="hidden sm:inline text-xs text-muted rounded-full px-2 py-0.5" style={{ border: "1px solid var(--c-border-2)" }}>beta</span>
        </div>

        {/* Links internos */}
        <div className="hidden sm:flex items-center gap-6 text-sm text-muted">
          <a href="/studio" className="hover:text-white transition-colors">Kyma Studio</a>
          <a href="/#productos" className="hover:text-white transition-colors">Productos</a>
          <a href="/#pricing" className="hover:text-white transition-colors">Precios</a>
          <a href="/docs" className="hover:text-white transition-colors">API</a>
        </div>

        {/* Auth CTA */}
        {user ? (
          <a href="/dashboard" className="glass glass-hover px-4 py-1.5 rounded-full text-sm font-medium">Mi cuenta</a>
        ) : (
          <a href="/auth/login" className="btn-accent px-4 py-1.5 rounded-full text-sm font-medium">Empezar gratis</a>
        )}
      </div>
    </nav>
  );
}
