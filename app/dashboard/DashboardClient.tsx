"use client";

import Link from "next/link";

interface Generation {
  mode: string;
  language: string;
  text_length: number | null;
  duration_ms: number | null;
  created_at: string;
  provider: string;
}
interface Pack {
  id: string;
  name: string;
  chars: number;
  price_usd: number | string;
  buy_url: string | null;
}
interface Purchase {
  pack_id: string | null;
  chars: number;
  amount_usd: number | string | null;
  created_at: string;
}

interface Props {
  user: { email: string; id: string };
  credits: { used: number; limit: number; month: string };
  plan: string;
  extraCredits: number;
  portalUrl?: string | null;
  generations: Generation[];
  packs: Pack[];
  purchases: Purchase[];
  upgradeUrls: { creator: string; pro: string };
  isAdmin?: boolean;
}

const PLAN_LABEL: Record<string, string> = { free: "Gratis", creator: "Creator", pro: "Pro", admin: "Admin" };

export default function DashboardClient({ user, credits, plan, extraCredits, portalUrl, generations, packs, purchases, upgradeUrls, isAdmin }: Props) {
  const unlimited = credits.limit >= 1_000_000_000;
  const pct = credits.limit > 0 ? Math.min(100, Math.round((credits.used / credits.limit) * 100)) : 0;
  const monthlyRemaining = Math.max(0, credits.limit - credits.used);
  const totalAvailable = monthlyRemaining + extraCredits;
  const isLow = !unlimited && totalAvailable <= credits.limit * 0.1;
  const fmt = (n: number) => n.toLocaleString("es");
  const fmtDate = (s: string) => new Date(s).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  // Link de compra con user_id + pack_id en custom data (lo lee el webhook)
  const buyLink = (p: Pack) =>
    p.buy_url
      ? `${p.buy_url}?checkout[custom][user_id]=${encodeURIComponent(user.id)}&checkout[custom][pack_id]=${encodeURIComponent(p.id)}&checkout[email]=${encodeURIComponent(user.email)}`
      : null;

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
          {isAdmin && <Link href="/dashboard/admin" className="text-xs glass glass-hover rounded-lg px-3 py-1.5">📊 Métricas</Link>}
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

      {/* Balance: mensual + comprados */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tus caracteres</h2>
          <span className="text-xs text-muted">{credits.month}</span>
        </div>

        {unlimited ? (
          <p className="text-sm text-gradient font-semibold">Ilimitado (cuenta admin) ✦</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-muted">Del plan ({credits.month})</p>
                <p className="text-lg font-semibold">{fmt(monthlyRemaining)}</p>
                <p className="text-xs text-muted">de {fmt(credits.limit)}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-muted">Comprados (no vencen)</p>
                <p className="text-lg font-semibold">{fmt(extraCredits)}</p>
                <p className="text-xs text-muted">créditos extra</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={isLow ? "text-yellow-400" : "text-muted"}>Total disponible: {fmt(totalAvailable)}</span>
                <span className="text-muted">{fmt(credits.used)} usados este mes</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: isLow ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, var(--accent-from), var(--accent-via))" }} />
              </div>
            </div>
            {totalAvailable === 0 && (
              <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                Te quedaste sin caracteres. Comprá un pack abajo o subí de plan para seguir generando.
              </p>
            )}
          </>
        )}
      </div>

      {/* Comprar créditos (pay-per-use) */}
      {!unlimited && packs.length > 0 && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold">Comprar créditos</h2>
            <p className="text-sm text-muted mt-1">Pago único. No vencen. Se usan cuando se agota tu plan mensual.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {packs.map((p) => {
              const link = buyLink(p);
              const price = Number(p.price_usd);
              return (
                <div key={p.id} className="rounded-xl bg-white/5 p-4 flex flex-col gap-2">
                  <p className="text-sm font-semibold">{fmt(p.chars)}</p>
                  <p className="text-xs text-muted">caracteres</p>
                  <p className="text-xl font-bold">${price}</p>
                  {link ? (
                    <a href={link} className="btn-accent rounded-lg px-3 py-2 text-sm font-semibold text-center mt-auto">Comprar</a>
                  ) : (
                    <span className="glass rounded-lg px-3 py-2 text-xs text-muted text-center mt-auto">Próximamente</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan y facturación */}
      {plan !== "admin" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Tu plan</h2>
            <span className="text-sm text-gradient font-semibold">{PLAN_LABEL[plan] ?? plan}</span>
          </div>
          {plan === "pro" ? (
            <p className="text-sm text-muted">Estás en el plan más alto: 1.000.000 caracteres/mes + API. 🎉</p>
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
          {portalUrl && (
            <a href={portalUrl} target="_blank" rel="noreferrer" className="inline-block text-sm underline text-muted hover:text-white">
              Gestionar suscripción (cambiar plan, método de pago o cancelar) →
            </a>
          )}
        </div>
      )}

      {/* Informe de gastos: generaciones */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Tus generaciones</h2>
          <span className="text-xs text-muted">caracteres por generación</span>
        </div>
        {generations.length === 0 ? (
          <p className="text-sm text-muted">Todavía no generaste nada. <Link href="/studio" className="text-gradient">Abrí el Studio</Link> y creá tu primera voz.</p>
        ) : (
          <div className="space-y-2">
            {generations.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{g.mode === "clone" ? "🎙" : "🎨"}</span>
                  <span className="text-white/90">{g.mode === "clone" ? "Clonación" : "Diseño"}</span>
                  <span className="text-xs text-muted uppercase">{g.language}</span>
                  {g.provider?.startsWith("api") && <span className="text-[10px] glass rounded px-1.5 py-0.5 text-muted">API</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  {g.text_length ? <span className="text-white/80">{fmt(g.text_length)} car.</span> : null}
                  <span>{fmtDate(g.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compras de créditos */}
      {purchases.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Compras de créditos</h2>
          <div className="space-y-2">
            {purchases.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                <span className="text-white/90">+{fmt(p.chars)} caracteres</span>
                <div className="flex items-center gap-3 text-xs text-muted">
                  {p.amount_usd != null && <span>${Number(p.amount_usd)}</span>}
                  <span>{fmtDate(p.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accesos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/dashboard/api" className="glass glass-hover rounded-2xl p-5 space-y-2 block">
          <span className="text-2xl">🔌</span>
          <p className="font-semibold">API & claves</p>
          <p className="text-sm text-muted">Integrá Kyma en tu producto (plan Pro). Generá API keys y leé los docs.</p>
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
