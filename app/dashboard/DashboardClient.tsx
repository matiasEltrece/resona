"use client";

import { brand } from "@/lib/brand";
import Link from "next/link";

interface Props {
  user: { email: string; id: string };
  credits: { used: number; limit: number; month: string };
}

export default function DashboardClient({ user, credits }: Props) {
  const pct = Math.min(100, Math.round((credits.used / credits.limit) * 100));
  const remaining = Math.max(0, credits.limit - credits.used);
  const isLow = remaining <= 5;

  return (
    <div className="space-y-6 fade-up">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold">Hola 👋</h1>
        <p className="text-muted text-sm mt-1">{user.email}</p>
      </div>

      {/* Créditos del mes */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Generaciones este mes</h2>
          <span className="text-xs text-muted">{credits.month}</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={isLow ? "text-yellow-400" : "text-muted"}>
              {remaining} restantes
            </span>
            <span className="text-muted">{credits.used} / {credits.limit}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: isLow
                  ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                  : "linear-gradient(90deg, var(--accent-from), var(--accent-via))",
              }}
            />
          </div>
        </div>

        {isLow && (
          <div className="text-xs text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">
            Te quedás sin generaciones. Actualizá tu plan para continuar.
          </div>
        )}

        {remaining === 0 && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            Alcanzaste el límite mensual del plan gratuito. Las generaciones se renuevan el 1 del mes.
          </p>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/#studio"
          className="glass glass-hover rounded-2xl p-5 space-y-2 block"
        >
          <span className="text-2xl">🎙</span>
          <p className="font-semibold">Abrir Studio</p>
          <p className="text-sm text-muted">Generá voces, cloná, diseñá.</p>
        </Link>

        <div className="glass rounded-2xl p-5 space-y-2">
          <span className="text-2xl">⚡</span>
          <p className="font-semibold">Plan Creator</p>
          <p className="text-sm text-muted">500 generaciones / mes · voice cloning · HD sin marca.</p>
          <a
            href="/#precios"
            className="btn-accent inline-block text-xs px-4 py-1.5 rounded-lg mt-1"
          >
            Ver planes
          </a>
        </div>
      </div>

      {/* Stats de la plataforma */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold mb-4">Motor</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Idiomas", value: "600+" },
            { label: "RTF", value: "0.025" },
            { label: "Tecnología", value: "OmniVoice" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-lg font-bold text-gradient">{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
