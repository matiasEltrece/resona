import { brand } from "@/lib/brand";
import { DocHeader, Code, h2 } from "@/components/docs-ui";

export const metadata = { title: `Quickstart — ${brand.name}` };

const curl = `curl -X POST https://${brand.domain}/api/v1/generate \\
  -H "Authorization: Bearer kyma_sk_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hola, esto es Kyma por API. [laughter]",
    "language": "es",
    "design": { "gender": "female", "age": "young_adult", "pitch": "high" }
  }'`;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", gap: 16 }}>
      <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 99, background: "var(--accent-soft)", color: "var(--accent-solid)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{n}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ ...h2, marginBottom: 8 }}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function Quickstart() {
  return (
    <>
      <DocHeader eyebrow="Guía" title="Quickstart" intro="De cero a tu primer audio generado por API en cuatro pasos." />

      <div className="kp-prose" style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        <Step n={1} title="Pasá tu cuenta a Pro">
          <p>La API está disponible en el plan <strong style={{ color: "var(--c-text)" }}>Pro</strong>. Activalo desde <a href="/#pricing" style={{ color: "var(--accent-solid)" }}>precios</a>.</p>
        </Step>
        <Step n={2} title="Generá una API key">
          <p>Entrá a <a href="/dashboard/api" style={{ color: "var(--accent-solid)" }}>dashboard → API</a> y creá una key. Empieza con <code>kyma_sk_</code> y se muestra <strong style={{ color: "var(--c-text)" }}>una sola vez</strong> — guardala.</p>
        </Step>
        <Step n={3} title="Hacé tu primer request">
          <Code>{curl}</Code>
        </Step>
        <Step n={4} title="Decodificá el audio">
          <p>La respuesta trae <code>audioBase64</code> (WAV 24 kHz mono). Decodificalo a un archivo:</p>
          <Code>{`# bash
echo "$AUDIO_B64" | base64 -d > out.wav`}</Code>
          <p style={{ marginTop: 10 }}>¿Listo? Mirá la <a href="/docs/generate" style={{ color: "var(--accent-solid)" }}>referencia completa</a> o probá en vivo en la <a href="/docs/api" style={{ color: "var(--accent-solid)" }}>API interactiva</a>.</p>
        </Step>
      </div>
    </>
  );
}
