"use client";

import Link from "next/link";

interface Generation {
  mode: string;
  language: string;
  duration_ms: number | null;
  rtf: number | null;
  created_at: string;
  provider: string;
}

interface Props {
  user: { email: string; id: string };
  credits: { used: number; limit: number; month: string };
  plan: string;
  generations: Generation[];
  upgradeUrls: { creator: string; pro: string };
  isAdmin?: boolean;
}

const PLAN_LABEL: Record<string, string> = { free: "Gratis", creator: "Creator", pro: "Pro" };

export default function DashboardClient({ user, credits, plan, generations, upgradeUrls, isAdmin }: Props) {
  const pct = Math.min(100, Math.round((credits.used / credits.limit) * 100));
  const remaining = Math.max(0, credits.limit - credits.used);
  const isLow = remaining <= credits.limit * 0.1;
  const fmt = (n: number) => n.toLocaleString("es");
  const fmtDate = (s: string) => new Date(s).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6 fade-up">
      {/* Saludo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hola 👋</h1>
          <p className="text-muted text-sm mt-1">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs glass rounded-full px-3 py-1.5">Plan {PLAN_LABEL[plan] ?? plan}</span>
          {isAdmin && (
            <Link href="/dashboard/admin" className="text-xs glass glass-hover rounded-lg px-3 py-1.5">📊 Métricas</Link>
          )}
        </div>
      </div>

      {/* CTA principal: abrir Studio */}
      <Link href="/studio" className="block glow-panel rounded-2xl p-6 relative overflow-hidden glass-hover">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 100% at 100% 0%, rgba(124,92,255,0.18), transparent 60%)" }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">🎙 Abrir el Studio</p>
            <p className="text-sm text-muted mt-1">Generá, cloná y diseñá voces en 646 idiomas.</p>
          </div>
          <span className="btn-accent rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap">Generar voz →</span>
        </div>
      </Link>

      {/* Créditos del mes */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Caracteres este mes</h2>
          <span className="text-xs text-muted">{credits.month}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={isLow ? "text-yellow-400" : "text-muted"}>{fmt(remaining)} restantes</span>
            <span className="text-muted">{fmt(credits.used)} / {fmt(credits.limit)}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: isLow ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, var(--accent-from), var(--accent-via))" }} />
          </div>
        </div>
        {remaining === 0 && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            Alcanzaste el límite mensual. Se renueva el 1 del mes o actualizá tu plan abajo.
          </p>
        )}
      </div>

      {/* Plan y facturación */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tu plan</h2>
          <span className="text-sm text-gradient font-semibold">{PLAN_LABEL[plan] ?? plan}</span>
        </div>
        {plan === "pro" ? (
          <p className="text-sm text-muted">Estás en el plan más alto. 1.000.000 caracteres/mes + API. 🎉</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {plan === "free"
                ? "Estás en el plan gratuito (10.000 caracteres/mes). Subí a Creator por más caracteres y clonación, o a Pro para 1M + acceso a la API."
                : "Estás en Creator (200.000 caracteres/mes). La API es exclusiva de Pro: subí para 1M caracteres + API."}
            </p>
            <div className="flex flex-wrap gap-3">
              {plan === "free" && (
                <a href={upgradeUrls.creator} className="btn-accent rounded-xl px-5 py-2 text-sm font-semibold">Creator · $12/mes</a>
              )}
              <a href={upgradeUrls.pro} className={`rounded-xl px-5 py-2 text-sm font-semibold ${plan === "free" ? "glass glass-hover" : "btn-accent"}`}>Pro · $39/mes</a>
            </div>
          </>
        )}
      </div>

      {/* Historial de generaciones */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Tus generaciones</h2>
        {generations.length === 0 ? (
          <p className="text-sm text-muted">Todavía no generaste nada. <Link href="/studio" className="text-gradient">Abrí el Studio</Link> y creá tu primera voz.</p>
        ) : (
          <div className="space-y-2">
            {generations.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{g.mode === "clone" ? "🎙" : "🎨"}</span>
                  <span className="text-white/90">{g.mode === "clone" ? "Clonación" : "Diseño"}</span>
                  <span className="text-xs text-muted uppercase">{g.language}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  {g.duration_ms ? <span>{(g.duration_ms / 1000).toFixed(1)}s</span> : null}
                  <span>{fmtDate(g.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accesos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/dashboard/api" className="glass glass-hover rounded-2xl p-5 space-y-2 block">
          <span className="text-2xl">🔌</span>
          <p className="font-semibold">API & claves</p>
          <p className="text-sm text-muted">Integrá Kyma en tu producto. Generá API keys y leé los docs.</p>
        </Link>
        <Link href="/studio" className="glass glass-hover rounded-2xl p-5 space-y-2 block">
          <span className="text-2xl">🎙</span>
          <p className="font-semibold">Mis voces</p>
          <p className="text-sm text-muted">Cloná y guardá voces para reusarlas (en el Studio → Clonar).</p>
        </Link>
      </div>
    </div>
  );
}
