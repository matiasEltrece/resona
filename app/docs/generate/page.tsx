import { brand } from "@/lib/brand";
import { DocHeader, Code, Table, Row, h2 } from "@/components/docs-ui";

export const metadata = { title: `POST /v1/generate — ${brand.name}` };

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
        "consent": True,
        "quality": "high",
    },
)
open("out.wav", "wb").write(base64.b64decode(r.json()["audioBase64"]))`;

export default function GenerateRef() {
  return (
    <>
      <DocHeader
        eyebrow="Referencia API"
        title={<><code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-solid)", fontSize: "0.7em" }}>POST</code> /api/v1/generate</>}
        intro="Genera audio a partir de texto. Soporta voice design y clonación. Exclusivo del plan Pro."
      />

      <div className="kp-prose" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <section>
          <h2 style={h2}>Body (JSON)</h2>
          <Table>
            <Row k="text" v="Texto a generar (máx 5000 chars). Soporta tags como [laughter]. Requerido." />
            <Row k="language" v='Código ISO ("es", "en", "ja"…) o nombre. Multilenguaje. Default "es".' />
            <Row k="mode" v='"design" (diseñar voz) o "clone" (clonar). Default "design".' />
            <Row k="design" v="Objeto con gender, age, pitch, whisper, accent, dialect (ver abajo)." />
            <Row k="referenceAudioBase64" v="Para mode=clone. Audio de referencia en base64 (WAV/MP3)." />
            <Row k="referenceText" v="Transcripción del audio de referencia (opcional)." />
            <Row k="savedVoiceId" v="ID de una voz guardada tuya — alternativa al audio de referencia." />
            <Row k="consent" v="Obligatorio al clonar: true confirma que tenés permiso para usar la voz." />
            <Row k="speed" v="0.5 (lento) – 2.0 (rápido). Default 1.0." />
            <Row k="durationSec" v="Duración fija de salida en segundos (opcional, anula speed)." />
            <Row k="quality" v='"fast" · "balanced" · "high". Default "balanced".' />
            <Row k="seed" v="Entero opcional para reproducibilidad." />
          </Table>
        </section>

        <section>
          <h2 style={h2}>Objeto <code style={{ fontFamily: "var(--font-mono)" }}>design</code></h2>
          <Table>
            <Row k="gender" v='"female" · "male"' />
            <Row k="age" v='"child" · "teenager" · "young_adult" · "middle_aged" · "elderly"' />
            <Row k="pitch" v='"very_low" · "low" · "moderate" · "high" · "very_high"' />
            <Row k="whisper" v="true / false (estilo ASMR)" />
            <Row k="accent" v='solo inglés: "american", "british", "australian", "indian"…' />
            <Row k="dialect" v='solo chino: "四川话", "东北话"…' />
          </Table>
        </section>

        <section>
          <h2 style={h2}>Respuesta 200</h2>
          <Code>{`{
  "audioBase64": "UklGRi4...",
  "mime": "audio/wav",
  "durationMs": 3200,
  "rtf": 0.025,
  "provider": "modal",
  "latencyMs": 1840
}`}</Code>
          <p style={{ fontSize: 14, color: "var(--c-text-2)", marginTop: 8 }}>El audio es WAV 24 kHz mono en base64. Para los errores ver <a href="/docs/errores" style={{ color: "var(--accent-solid)" }}>Errores</a>.</p>
        </section>

        <section>
          <h2 style={h2}>Ejemplos</h2>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px", color: "var(--c-text)" }}>Node.js</p>
          <Code>{node}</Code>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "16px 0 6px", color: "var(--c-text)" }}>Python</p>
          <Code>{python}</Code>
        </section>

        <section>
          <h2 style={h2}>Límites</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 5 }}>
            <li>Se mide por <strong style={{ color: "var(--c-text)" }}>caracteres</strong> procesados, del mismo pool mensual que tu cuenta.</li>
            <li>Free: 10.000 · Creator: 200.000 · Pro: 1.000.000 caracteres/mes.</li>
            <li>Rate limit: 30 requests/minuto por key.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
