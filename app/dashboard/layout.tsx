import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";

export const metadata = { title: `Dashboard — ${brand.name}` };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar del dashboard */}
      <nav className="sticky top-0 z-30 border-b border-border backdrop-blur-xl bg-[rgba(6,5,9,0.8)]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="text-lg font-bold text-gradient">{brand.name}</a>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted hidden sm:block">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="glass glass-hover text-xs px-3 py-1.5 rounded-lg"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
