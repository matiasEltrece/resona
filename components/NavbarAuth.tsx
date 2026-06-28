import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";

export default async function NavbarAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="sticky top-0 z-40 border-b border-border backdrop-blur-xl bg-[rgba(4,3,8,0.88)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kyma-logo.png" alt={brand.name} className="h-7 w-auto" />
          </a>
          <span className="hidden sm:inline text-xs text-muted border border-border rounded-full px-2 py-0.5">
            beta
          </span>
        </div>

        {/* Links internos */}
        <div className="hidden sm:flex items-center gap-6 text-sm text-muted">
          <a href="/studio" className="hover:text-white transition-colors">Studio</a>
          <a href="/#features" className="hover:text-white transition-colors">Features</a>
          <a href="/#pricing" className="hover:text-white transition-colors">Precios</a>
          <a href="/docs" className="hover:text-white transition-colors">API</a>
        </div>

        {/* Auth CTA */}
        {user ? (
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="glass glass-hover px-4 py-1.5 rounded-full text-sm font-medium"
            >
              Mi cuenta
            </a>
          </div>
        ) : (
          <a
            href="/auth/login"
            className="btn-accent px-4 py-1.5 rounded-full text-sm font-medium"
          >
            Empezar gratis
          </a>
        )}
      </div>
    </nav>
  );
}
