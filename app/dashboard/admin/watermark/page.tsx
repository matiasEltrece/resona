import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import WatermarkTool from "@/components/admin/WatermarkTool";

export const metadata = { title: `Watermark — Admin — ${brand.name}` };

const ROADMAP: { done: boolean; title: string; note: string }[] = [
  { done: true,  title: "Watermark inaudible en audio Free + comercial por plan", note: "Marca a ~-58 dBFS; planes pagos = audio limpio + comercial." },
  { done: true,  title: "Detector on-demand (admin)", note: "Esta herramienta: subís un audio y verifica la marca por correlación." },
  { done: false, title: "Watermark con ID por usuario", note: "Embeber un identificador → saber QUIÉN generó, no solo que es de Kyma." },
  { done: false, title: "AudioSeal (watermark robusto)", note: "Sobrevive recompresión/edición y lleva payload. Corre en GPU/Modal." },
  { done: false, title: "Monitor programado acotado", note: "Cron + servicio externo (ACRCloud/Pex) sobre fuentes puntuales. Opcional/pago." },
];

export default async function AdminWatermarkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <a href="/dashboard/admin" className="text-xs text-muted hover:text-white">← Volver al panel admin</a>
        <h1 className="text-2xl font-bold mt-2">Detección de watermark</h1>
        <p className="text-sm text-muted mt-1">Verificá si un audio lleva la marca inaudible del plan gratuito de {brand.name}.</p>
      </div>

      <WatermarkTool />

      <div>
        <h2 className="text-lg font-semibold mb-3">Roadmap · control de uso indebido</h2>
        <div className="space-y-2">
          {ROADMAP.map((r) => (
            <div key={r.title} className="glass rounded-xl p-3 flex items-start gap-3">
              <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${r.done ? "bg-green-500/20 text-green-400" : "bg-white/10 text-muted"}`}>{r.done ? "✓" : "•"}</span>
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted">{r.note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-3">
          El watermark es <strong className="text-white/80">detectivo, no preventivo</strong>: prueba el origen, no impide el uso.
          El monitoreo internet-wide en tiempo real requiere servicios externos (Content ID / ACRCloud) — no se construye in-house a esta escala.
        </p>
      </div>
    </div>
  );
}
