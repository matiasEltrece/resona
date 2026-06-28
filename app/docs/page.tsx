import { brand } from "@/lib/brand";
import { DocHeader, NavCard, Code, h2 } from "@/components/docs-ui";

export const metadata = { title: `Documentación — ${brand.name}` };

const gold: React.CSSProperties = { background: "var(--accent-grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };

export default function DocsHome() {
  return (
    <>
      <DocHeader
        eyebrow="Developers"
        title={<>API de <span style={gold}>Kyma</span></>}
        intro="Generá voz (TTS, voice design y clonación) desde cualquier producto. Misma calidad que el Studio, 646 idiomas, con un solo POST."
      />

      <div className="kp-prose" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <section>
          <h2 style={h2}>Empezá acá</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            <NavCard href="/docs/quickstart" title="Quickstart" desc="De cero a tu primer audio generado en 4 pasos." />
            <NavCard href="/docs/autenticacion" title="Autenticación" desc="Cómo generar y usar tu API key." />
            <NavCard href="/docs/generate" title="POST /v1/generate" desc="Referencia completa del endpoint de generación." />
            <NavCard href="/docs/api" title="API interactiva" desc="Probá los endpoints en vivo desde el navegador (Swagger)." />
          </div>
        </section>

        <section>
          <h2 style={h2}>Base URL</h2>
          <Code>{`https://${brand.domain}/api`}</Code>
          <p style={{ marginTop: 10 }}>Todas las requests van sobre HTTPS y devuelven JSON. La API es exclusiva del plan <strong style={{ color: "var(--c-text)" }}>Pro</strong>.</p>
        </section>

        <section>
          <h2 style={h2}>¿Qué podés hacer?</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong style={{ color: "var(--c-text)" }}>Text-to-speech</strong> en 646 idiomas con calidad de estudio.</li>
            <li><strong style={{ color: "var(--c-text)" }}>Voice design</strong>: describí la voz (género, edad, tono, acento) y se genera.</li>
            <li><strong style={{ color: "var(--c-text)" }}>Clonación</strong>: pasá 10 s de audio de referencia y hablá con esa voz.</li>
            <li>Tags expresivos como <code>[laughter]</code>, control de velocidad, semilla reproducible.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
