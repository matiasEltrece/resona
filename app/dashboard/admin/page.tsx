import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Métricas — Kyma admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Gate: solo el admin definido en ADMIN_EMAIL
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect("/dashboard");
  }

  const service = await createServiceClient();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Consultas en paralelo
  const [
    usersRes, genTotalRes, genMonthRes, apiUsageRes, plansRes, recentRes,
  ] = await Promise.all([
    service.from("kyma_profiles").select("id", { count: "exact", head: true }),
    service.from("kyma_generations").select("id", { count: "exact", head: true }),
    service.from("kyma_generations").select("id", { count: "exact", head: true }).gte("created_at", `${month}-01`),
    service.from("kyma_api_usage").select("id", { count: "exact", head: true }).gte("created_at", `${month}-01`),
    service.from("kyma_profiles").select("plan"),
    service.from("kyma_profiles").select("email, plan, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const totalUsers = usersRes.count ?? 0;
  const totalGen = genTotalRes.count ?? 0;
  const monthGen = genMonthRes.count ?? 0;
  const monthApi = apiUsageRes.count ?? 0;

  const planCounts = (plansRes.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.plan] = (acc[r.plan] ?? 0) + 1;
    return acc;
  }, {});

  // MRR estimado (creator $12, pro $39)
  const mrr = (planCounts.creator ?? 0) * 12 + (planCounts.pro ?? 0) * 39;

  const stat = (label: string, value: string | number, hint?: string) => (
    <div className="glass rounded-2xl p-5">
      <p className="text-3xl font-bold text-gradient">{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
      {hint && <p className="text-xs text-muted/60 mt-0.5">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Métricas <span className="text-xs text-muted font-normal">· admin</span></h1>
          <p className="text-muted text-sm mt-1">{month} · solo visible para vos</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-white">← Volver</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stat("Usuarios", totalUsers)}
        {stat("MRR estimado", `$${mrr}`, "creator $12 + pro $39")}
        {stat("Generaciones (mes)", monthGen)}
        {stat("Generaciones (total)", totalGen)}
        {stat("Llamadas API (mes)", monthApi)}
        {stat("Plan Free", planCounts.free ?? 0)}
        {stat("Plan Creator", planCounts.creator ?? 0)}
        {stat("Plan Pro", planCounts.pro ?? 0)}
      </div>

      {/* Registros recientes */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Últimos registros</h2>
        {(recentRes.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay usuarios.</p>
        ) : (
          <div className="space-y-2">
            {(recentRes.data ?? []).map((u, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                <span>{u.email}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted">{u.plan}</span>
                  <span className="text-xs text-muted">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        Las métricas salen en vivo de Supabase. Para análisis profundo (cohortes, churn) conviene
        conectar un dashboard dedicado más adelante.
      </p>
    </div>
  );
}
