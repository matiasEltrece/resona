import { brand } from "@/lib/brand";
import NavbarAuth from "@/components/NavbarAuth";

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

function Code({ children }: { children: string }) {
  return (
    <pre className="glass overflow-x-auto text-xs leading-relaxed" style={{ borderRadius: "var(--radius-lg)", padding: "18px 20px", fontFamily: "var(--font-mono)" }}>
      {children}
    </pre>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr style={{ borderTop: "1px solid var(--glass-border)" }}>
      <td className="py-2 pr-4 align-top"><code style={{ color: "var(--brand-cyan)", fontFamily: "var(--font-mono)" }}>{k}</code></td>
      <td className="py-2 text-sm" style={{ color: "var(--text-secondary)" }}>{v}</td>
    </tr>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarAuth />
      <main className="max-w-[820px] mx-auto px-6 py-14 w-full space-y-10">
        <header>
          <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.18em", color: "var(--text-muted)" }}>Developers</p>
          <h1 className="text-4xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
            API de <span className="text-gradient">Kyma</span>
          </h1>
          <p className="mt-3 text-[length:var(--text-lg)]" style={{ color: "var(--text-secondary)" }}>
            Generá voz (TTS, cloning y voice design) desde cualquier producto. Misma calidad que el Studio, 646 idiomas, vía un POST.
          </p>
        </header>

        {/* Auth */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Autenticación</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Generá una API key en tu <a href="/dashboard/api" className="underline hover:text-white">dashboard</a>. Mandala en el header:
          </p>
          <Code>{`Authorization: Bearer kyma_sk_xxxxxxxxxxxxxxxx`}</Code>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>La key se muestra una sola vez al crearla. No la expongas en el frontend público.</p>
        </section>

        {/* Endpoint */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <code style={{ fontFamily: "var(--font-mono)", color: "var(--brand-cyan)" }}>POST</code> /api/v1/generate
          </h2>
          <table className="w-full text-left">
            <tbody>
              <Row k="text" v="Texto a generar (máx 5000 chars). Soporta tags como [laughter]. Requerido." />
              <Row k="language" v='Código ISO ("es", "en", "ja"…) o nombre. 646 idiomas. Default "es".' />
              <Row k="mode" v='"design" (diseñar voz) o "clone" (clonar). Default "design".' />
              <Row k="design" v="Objeto con gender, age, pitch, whisper, accent, dialect (ver abajo)." />
              <Row k="referenceAudioBase64" v="Para mode=clone. Audio de referencia en base64 (WAV/MP3)." />
              <Row k="speed" v="0.5 (lento) – 2.0 (rápido). Default 1.0." />
              <Row k="quality" v='"fast" · "balanced" · "high". Default "balanced".' />
              <Row k="seed" v="Entero opcional para reproducibilidad." />
            </tbody>
          </table>
        </section>

        {/* Design object */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Objeto <code style={{ fontFamily: "var(--font-mono)" }}>design</code></h2>
          <table className="w-full text-left">
            <tbody>
              <Row k="gender" v='"female" · "male"' />
              <Row k="age" v='"child" · "teenager" · "young_adult" · "middle_aged" · "elderly"' />
              <Row k="pitch" v='"very_low" · "low" · "moderate" · "high" · "very_high"' />
              <Row k="whisper" v="true / false (estilo ASMR)" />
              <Row k="accent" v='solo inglés: "american", "british", "australian", "indian"…' />
              <Row k="dialect" v='solo chino: "四川话", "东北话"…' />
            </tbody>
          </table>
        </section>

        {/* Response */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Respuesta</h2>
          <Code>{`{
  "audioBase64": "UklGRi4...",
  "mime": "audio/wav",
  "durationMs": 3200,
  "rtf": 0.025,
  "provider": "modal",
  "latencyMs": 1840
}`}</Code>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>El audio es WAV 24 kHz mono en base64.</p>
        </section>

        {/* Examples */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Ejemplos</h2>
          <p className="text-sm font-medium">cURL</p>
          <Code>{curl}</Code>
          <p className="text-sm font-medium mt-4">Node.js</p>
          <Code>{node}</Code>
          <p className="text-sm font-medium mt-4">Python</p>
          <Code>{python}</Code>
        </section>

        {/* Limits */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Límites</h2>
          <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: "var(--text-secondary)" }}>
            <li>Se mide por <strong className="text-white">caracteres</strong> procesados, del mismo pool mensual que tu cuenta.</li>
            <li>Free: 10.000 · Creator: 200.000 · Pro: 1.000.000 caracteres/mes.</li>
            <li>Rate limit: 30 requests/minuto por key.</li>
            <li>CORS habilitado — pero no expongas tu key en el frontend.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
