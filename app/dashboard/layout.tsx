import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import PremiumThemeRoot from "@/components/PremiumThemeRoot";

export const metadata = { title: `Dashboard — ${brand.name}` };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard");

  return (
    <PremiumThemeRoot>
      <div className="min-h-screen flex flex-col">
        {/* Navbar del dashboard */}
        <nav className="sticky top-0 z-30 border-b" style={{ background: "var(--c-page)", borderColor: "var(--c-border)" }}>
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-gradient">{brand.name}</a>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted hidden sm:block">{user.email}</span>
              <a href="/dashboard/cuenta" className="glass glass-hover text-xs px-3 py-1.5 rounded-lg">Cuenta</a>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="glass glass-hover text-xs px-3 py-1.5 rounded-lg">Salir</button>
              </form>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          {children}
        </main>
      </div>
    </PremiumThemeRoot>
  );
}
