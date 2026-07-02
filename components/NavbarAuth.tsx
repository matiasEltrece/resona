import { createClient } from "@/lib/supabase/server";

export default async function NavbarAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="sticky top-0 z-40 border-b" style={{ background: "var(--c-page)", borderColor: "var(--c-border)" }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo (provisional: marca dorada — se reemplaza por el logo nuevo) */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2" style={{ textDecoration: "none", color: "var(--c-text)" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-grad)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24"><g stroke="#fff" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="9" x2="5" y2="15" /><line x1="10" y1="5" x2="10" y2="19" /><line x1="15" y1="7" x2="15" y2="17" /><line x1="20" y1="10" x2="20" y2="14" /></g></svg>
            </span>
            <span style={{ fontWeight: 700, fontSize: 18, fontFamily: "var(--font-head)" }}>Kyma</span>
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
