import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Centro de control — Kyma admin" };
export const dynamic = "force-dynamic";

interface Overview {
  perfiles: number; activos: number; por_plan: Record<string, number>;
  gen_total: number; gen_mes: number; gen_7d: number;
  chars_total: number; chars_mes: number; clones: number; consent_ok: number;
  api_total: number; api_mes: number; api_errores: number; api_keys: number;
  voces: number; compras: number; ingresos_packs: number; creditos_vivos: number;
}
interface UserRow {
  id: string; email: string; plan: string; extra_credits: number;
  gens: number; chars: number; last_activity: string | null; created_at: string;
}
interface RecentGen {
  mode: string; language: string; text_length: number | null; provider: string; created_at: string;
}

const PLAN_LABEL: Record<string, string> = { free: "Free", creator: "Creator", pro: "Pro", admin: "Admin" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) redirect("/dashboard");

  const service = await createServiceClient();
  const [ovRes, usersRes, recentRes] = await Promise.all([
    service.rpc("kyma_admin_overview"),
    service.rpc("kyma_admin_users", { p_limit: 100 }),
    service.from("kyma_generations").select("mode, language, text_length, provider, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const o = (ovRes.data ?? {}) as Overview;
  const users = (usersRes.data ?? []) as UserRow[];
  const recent = (recentRes.data ?? []) as RecentGen[];

  const plan = o.por_plan ?? {};
  const mrr = (plan.creator ?? 0) * 12 + (plan.pro ?? 0) * 39;
  const fmt = (n: number) => (n ?? 0).toLocaleString("es");
  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString("es", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

  const kpi = (label: string, value: string | number, hint?: string, warn?: boolean) => (
    <div className="glass rounded-2xl p-5">
      <p className={`text-3xl font-bold ${warn ? "text-yellow-400" : "text-gradient"}`}>{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
      {hint && <p className="text-xs text-muted/60 mt-0.5">{hint}</p>}
    </div>
  );

  const links: [string, string][] = [
    ["Supabase", "https://supabase.com/dashboard/project/grwfrocmskwagmbkilaz"],
    ["Lemon Squeezy", "https://app.lemonsqueezy.com"],
    ["Modal (GPU)", "https://modal.com/apps"],
    ["Vercel", "https://vercel.com/synthetic-ia"],
    ["Resend (emails)", "https://resend.com/emails"],
  ];

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Centro de control <span className="text-xs text-muted font-normal">· admin</span></h1>
          <p className="text-muted text-sm mt-1">Datos en vivo · solo visible para vos</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-white">← Volver</Link>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpi("Usuarios activos", fmt(o.activos), "con al menos 1 generación")}
        {kpi("Perfiles totales", fmt(o.perfiles))}
        {kpi("MRR estimado", `$${fmt(mrr)}`, "creator $12 + pro $39")}
        {kpi("Ingresos packs", `$${fmt(o.ingresos_packs)}`, `${fmt(o.compras)} compras`)}
        {kpi("Generaciones (mes)", fmt(o.gen_mes), `${fmt(o.gen_7d)} en 7 días`)}
        {kpi("Generaciones (total)", fmt(o.gen_total))}
        {kpi("Caracteres (mes)", fmt(o.chars_mes), `${fmt(o.chars_total)} total`)}
        {kpi("Llamadas API (mes)", fmt(o.api_mes), `${fmt(o.api_errores)} errores`, (o.api_errores ?? 0) > 0)}
      </div>

      {/* Planes + uso */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold">Usuarios por plan</h2>
          {(["free", "creator", "pro", "admin"] as const).map((p) => (
            <div key={p} className="flex items-center justify-between text-sm">
              <span className="text-muted">{PLAN_LABEL[p]}</span>
              <span className="font-semibold">{fmt(plan[p] ?? 0)}</span>
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold">Uso</h2>
          <div className="flex items-center justify-between text-sm"><span className="text-muted">Voces clonadas</span><span className="font-semibold">{fmt(o.clones)}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted">Clones con consentimiento</span><span className="font-semibold">{fmt(o.consent_ok)} / {fmt(o.clones)}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted">Voces guardadas</span><span className="font-semibold">{fmt(o.voces)}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted">API keys activas</span><span className="font-semibold">{fmt(o.api_keys)}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted">Créditos comprados vivos</span><span className="font-semibold">{fmt(o.creditos_vivos)}</span></div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Usuarios ({fmt(users.length)})</h2>
        {users.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay usuarios.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted text-left border-b border-white/10">
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium text-right">Gens</th>
                  <th className="pb-2 font-medium text-right">Caract.</th>
                  <th className="pb-2 font-medium text-right">Comprados</th>
                  <th className="pb-2 font-medium text-right">Últ. actividad</th>
                  <th className="pb-2 font-medium text-right">Registro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-3 text-white/90">{u.email}</td>
                    <td className="py-2 pr-3"><span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted">{PLAN_LABEL[u.plan] ?? u.plan}</span></td>
                    <td className="py-2 pr-3 text-right text-muted">{fmt(u.gens)}</td>
                    <td className="py-2 pr-3 text-right text-muted">{fmt(u.chars)}</td>
                    <td className="py-2 pr-3 text-right text-muted">{fmt(u.extra_credits)}</td>
                    <td className="py-2 pr-3 text-right text-muted">{fmtDate(u.last_activity)}</td>
                    <td className="py-2 text-right text-muted">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actividad reciente */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Generaciones recientes</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">Sin actividad todavía.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{g.mode === "clone" ? "🎙" : "🎨"}</span>
                  <span className="text-white/90">{g.mode === "clone" ? "Clonación" : "Diseño"}</span>
                  <span className="text-xs text-muted uppercase">{g.language}</span>
                  <span className="text-[10px] glass rounded px-1.5 py-0.5 text-muted">{g.provider}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  {g.text_length ? <span>{fmt(g.text_length)} car.</span> : null}
                  <span>{new Date(g.created_at).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accesos rápidos a paneles externos */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Paneles de control</h2>
        <div className="flex flex-wrap gap-3">
          {links.map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="glass glass-hover rounded-xl px-4 py-2 text-sm">{label} ↗</a>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted">
        Métricas en vivo de Supabase. No se muestran datos sensibles (contraseñas, pagos).
        Pendiente recomendado: activar “Leaked password protection” en Supabase → Auth.
      </p>
    </div>
  );
}
