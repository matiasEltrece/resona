import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";

export const metadata = { title: `Roadmap vs Cartesia — Admin — ${brand.name}` };

type KymaStatus = "tiene" | "fuerte" | "parcial" | "construible" | "no";
const ROWS: { cap: string; cartesia: string; kyma: KymaStatus; action: string }[] = [
  { cap: "TTS · Voice Gen · Synthesis · Text-to-MP3 · Reader · Voiceover", cartesia: "Sí", kyma: "tiene", action: "Empaquetar: mismo motor, varios nombres" },
  { cap: "Voice Cloning", cartesia: "Sí", kyma: "tiene", action: "+ auto-transcribe con Whisper" },
  { cap: "Voice Design (atributos · 646 idiomas)", cartesia: "Parcial", kyma: "fuerte", action: "Tu diferenciador" },
  { cap: "TTS API", cartesia: "Sí", kyma: "tiene", action: "/api/v1/generate + Swagger" },
  { cap: "AI Voice Enhancer", cartesia: "Sí", kyma: "parcial", action: "Tenés máster ffmpeg; falta denoise IA" },
  { cap: "AI Dubbing", cartesia: "Sí", kyma: "construible", action: "Whisper + traducir + clon (piezas listas)" },
  { cap: "Voice Changer / Conversion", cartesia: "Sí", kyma: "construible", action: "Voz-a-voz, más difícil" },
  { cap: "Real-time <100ms (Sonic)", cartesia: "Moat", kyma: "no", action: "NO competir de frente" },
  { cap: "Agents (plataforma conversacional)", cartesia: "Sí", kyma: "no", action: "NO competir (otro producto)" },
  { cap: "Solutions verticales (salud, finanzas…)", cartesia: "Sí", kyma: "construible", action: "Empaque + integraciones" },
];

const STATUS: Record<KymaStatus, { label: string; bg: string; fg: string }> = {
  tiene: { label: "✓ ya lo hacés", bg: "rgba(34,197,94,0.12)", fg: "#22c55e" },
  fuerte: { label: "✦ diferenciador", bg: "var(--accent-soft)", fg: "var(--accent-solid)" },
  parcial: { label: "◑ parcial", bg: "rgba(245,158,11,0.12)", fg: "#f59e0b" },
  construible: { label: "🔨 construible", bg: "rgba(245,158,11,0.12)", fg: "#f59e0b" },
  no: { label: "✗ no", bg: "rgba(148,148,160,0.14)", fg: "var(--c-text-3)" },
};

const PHASES: { tier: string; color: string; title: string; when: string; items: string[] }[] = [
  { tier: "A", color: "#22c55e", title: "Empaquetar lo que ya tenés", when: "días · ~$0", items: ["Presentar el TTS como Voiceover / Text-to-MP3 / Voice Reader / TTS API en la web", "Paridad de catálogo con Cartesia, casi gratis"] },
  { tier: "B", color: "#eab308", title: "Doblar la apuesta donde ganás", when: "semanas", items: ["646 idiomas + español/LatAm + precio + voice design", "Posicionamiento: «el Cartesia/ElevenLabs hispano — más barato y multilingüe»"] },
  { tier: "C", color: "#f97316", title: "Productos nuevos achievable", when: "1-2 meses c/u", items: ["AI Dubbing (mayor ROI): Whisper → traducir → clon en idioma destino → timing", "Voice Reader: texto / URL / PDF → audio largo", "AI Voice Enhancer: denoise IA en GPU"] },
  { tier: "D", color: "#ef4444", title: "NO ir (moats de capital / research)", when: "—", items: ["Real-time <100ms (Sonic)", "Agents enterprise", "On-device"] },
];

export default async function AdminRoadmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <a href="/dashboard/admin" className="text-xs text-muted hover:text-white">← Volver al panel admin</a>
        <h1 className="text-2xl font-bold mt-2">Roadmap · {brand.name} vs Cartesia</h1>
        <p className="text-sm text-muted mt-1">Esas 11 «capabilities» de Cartesia son ~3 tecnologías repackaged. Ya cubrís ~70%. Su moat real (Sonic, real-time &lt;100ms) está afuera de esa lista.</p>
      </div>

      {/* Comparación */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Comparación honesta</h2>
        <div className="glass rounded-2xl p-1 overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th className="text-[11px] uppercase tracking-widest text-muted" style={{ padding: "10px 12px" }}>Capability</th>
                <th className="text-[11px] uppercase tracking-widest text-muted" style={{ padding: "10px 12px" }}>Cartesia</th>
                <th className="text-[11px] uppercase tracking-widest text-muted" style={{ padding: "10px 12px" }}>Kyma hoy</th>
                <th className="text-[11px] uppercase tracking-widest text-muted" style={{ padding: "10px 12px" }}>Qué hacemos</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => {
                const s = STATUS[r.kyma];
                return (
                  <tr key={r.cap} style={{ borderTop: "1px solid var(--c-border)" }}>
                    <td style={{ padding: "10px 12px", maxWidth: 320 }}>{r.cap}</td>
                    <td className="text-muted" style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.cartesia}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
                    </td>
                    <td className="text-muted text-[13px]" style={{ padding: "10px 12px" }}>{r.action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-2">Ya cubrís ~70% del catálogo. Lo que falta (real-time, agents) es justo donde NO conviene pelear.</p>
      </div>

      {/* Roadmap por fases */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Roadmap rearmado (por ROI)</h2>
        <div className="space-y-2">
          {PHASES.map((p) => (
            <div key={p.tier} className="glass rounded-xl p-4 flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: p.color + "22", color: p.color }}>{p.tier}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.title} <span className="text-xs text-muted font-normal">· {p.when}</span></p>
                <ul className="mt-1 space-y-0.5 list-disc list-inside text-xs text-muted">
                  {p.items.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Posicionamiento */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-base font-semibold mb-2">Posicionamiento</h2>
        <p className="text-sm text-muted leading-relaxed">
          No copiar a Cartesia entera — es research de frontera (creadores de Mamba/SSM) con mucho capital. La jugada de {brand.name} no es
          «hacer todo lo que hace Cartesia», es <strong className="text-white/80">ser el mejor en el nicho que ellos descuidan</strong>:
          voz IA <strong className="text-white/80">generativa, multilingüe (646), hispana, barata, con diseño + dubbing</strong>.
        </p>
      </div>
    </div>
  );
}
