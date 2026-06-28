import { brand } from "@/lib/brand";
import PremiumShell from "@/components/PremiumShell";

export const metadata = { title: `API · Documentación — ${brand.name}` };

const curl = `curl -X POST https://${brand.domain}/api/v1/generate \\
  -H "Authorization: Bearer kyma_sk_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hola, esto es Kyma por API. [laughter]",
    "language": "es",
    "design": { "gender": "female", "age": "young_adult", "pitch": "high" },
    "speed": 1.1,
    "quality": "balanced"
  }'`;

const node = `const res = await fetch("https://${brand.domain}/api/v1/generate", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.KYMA_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: "This is my voice speaking English.",
    language: "en",
    mode: "design",
    design: { gender: "male", age: "middle_aged", pitch: "low", accent: "british" },
  }),
});
const data = await res.json();
require("fs").writeFileSync("out.wav", Buffer.from(data.audioBase64, "base64"));`;

const python = `import requests, base64

r = requests.post(
    "https://${brand.domain}/api/v1/generate",
    headers={"Authorization": "Bearer kyma_sk_xxx"},
    json={
        "text": "Texto generado con mi voz clonada.",
        "language": "es",
        "mode": "clone",
        "referenceAudioBase64": "<base64 del audio>",
        "quality": "high",
    },
)
open("out.wav", "wb").write(base64.b64decode(r.json()["audioBase64"]))`;

const h2: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: "var(--c-text)", marginBottom: 12 };

function Code({ children }: { children: string }) {
  return (
    <pre style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: 14, padding: "18px 20px", overflowX: "auto", fontSize: 12.5, lineHeight: 1.6, fontFamily: "var(--font-mono)", color: "var(--c-text)" }}>
      {children}
    </pre>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr style={{ borderTop: "1px solid var(--c-border)" }}>
      <td style={{ padding: "9px 16px 9px 0", verticalAlign: "top" }}><code style={{ color: "var(--accent-solid)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{k}</code></td>
      <td style={{ padding: "9px 0", fontSize: 14, color: "var(--c-text-2)" }}>{v}</td>
    </tr>
  );
}

export default function DocsPage() {
  return (
    <PremiumShell>
      <header>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ width: 22, height: 3, borderRadius: 2, background: "var(--accent-grad)" }} />
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--c-text-3)" }}>Developers</span>
        </div>
        <h1 style={{ fontSize: "clamp(32px,4.4vw,46px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
          API de <span style={{ background: "var(--accent-grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Kyma</span>
        </h1>
        <p style={{ marginTop: 12, fontSize: 17, color: "var(--c-text-2)", lineHeight: 1.6 }}>
          Generá voz (TTS, cloning y voice design) desde cualquier producto. Misma calidad que el Studio, 646 idiomas, vía un POST.
        </p>
      </header>

      <div className="kp-prose" style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 40 }}>
        <section>
          <h2 style={h2}>Autenticación</h2>
          <p>Generá una API key en tu <a href="/dashboard/api" style={{ color: "var(--accent-solid)" }}>dashboard</a> (disponible en el plan Pro). Mandala en el header:</p>
          <Code>{`Authorization: Bearer kyma_sk_xxxxxxxxxxxxxxxx`}</Code>
          <p style={{ fontSize: 13, color: "var(--c-text-3)", marginTop: 8 }}>La key se muestra una sola vez al crearla. No la expongas en el frontend público.</p>
        </section>

        <section>
          <h2 style={h2}><code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-solid)" }}>POST</code> /api/v1/generate</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
            <Row k="text" v="Texto a generar (máx 5000 chars). Soporta tags como [laughter]. Requerido." />
            <Row k="language" v='Código ISO ("es", "en", "ja"…) o nombre. 646 idiomas. Default "es".' />
            <Row k="mode" v='"design" (diseñar voz) o "clone" (clonar). Default "design".' />
            <Row k="design" v="Objeto con gender, age, pitch, whisper, accent, dialect (ver abajo)." />
            <Row k="referenceAudioBase64" v="Para mode=clone. Audio de referencia en base64 (WAV/MP3)." />
            <Row k="speed" v="0.5 (lento) – 2.0 (rápido). Default 1.0." />
            <Row k="quality" v='"fast" · "balanced" · "high". Default "balanced".' />
            <Row k="seed" v="Entero opcional para reproducibilidad." />
          </tbody></table>
        </section>

        <section>
          <h2 style={h2}>Objeto <code style={{ fontFamily: "var(--font-mono)" }}>design</code></h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
            <Row k="gender" v='"female" · "male"' />
            <Row k="age" v='"child" · "teenager" · "young_adult" · "middle_aged" · "elderly"' />
            <Row k="pitch" v='"very_low" · "low" · "moderate" · "high" · "very_high"' />
            <Row k="whisper" v="true / false (estilo ASMR)" />
            <Row k="accent" v='solo inglés: "american", "british", "australian", "indian"…' />
            <Row k="dialect" v='solo chino: "四川话", "东北话"…' />
          </tbody></table>
        </section>

        <section>
          <h2 style={h2}>Respuesta</h2>
          <Code>{`{
  "audioBase64": "UklGRi4...",
  "mime": "audio/wav",
  "durationMs": 3200,
  "rtf": 0.025,
  "provider": "modal",
  "latencyMs": 1840
}`}</Code>
          <p style={{ fontSize: 14, color: "var(--c-text-2)", marginTop: 8 }}>El audio es WAV 24 kHz mono en base64.</p>
        </section>

        <section>
          <h2 style={h2}>Ejemplos</h2>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px", color: "var(--c-text)" }}>cURL</p>
          <Code>{curl}</Code>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "16px 0 6px", color: "var(--c-text)" }}>Node.js</p>
          <Code>{node}</Code>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "16px 0 6px", color: "var(--c-text)" }}>Python</p>
          <Code>{python}</Code>
        </section>

        <section>
          <h2 style={h2}>Límites</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 5 }}>
            <li>Se mide por <strong style={{ color: "var(--c-text)" }}>caracteres</strong> procesados, del mismo pool mensual que tu cuenta.</li>
            <li>Free: 10.000 · Creator: 200.000 · Pro: 1.000.000 caracteres/mes.</li>
            <li>La API es exclusiva del plan <strong style={{ color: "var(--c-text)" }}>Pro</strong>.</li>
            <li>Rate limit: 30 requests/minuto por key.</li>
            <li>CORS habilitado — pero no expongas tu key en el frontend.</li>
          </ul>
        </section>
      </div>
    </PremiumShell>
  );
}
