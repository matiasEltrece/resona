import { brand } from "@/lib/brand";
import { DocHeader, Code, h2 } from "@/components/docs-ui";

export const metadata = { title: `Autenticación — ${brand.name}` };

export default function Auth() {
  return (
    <>
      <DocHeader eyebrow="Guía" title="Autenticación" intro="Toda request a la API se autentica con una API key de tu cuenta." />

      <div className="kp-prose" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        <section>
          <h2 style={h2}>Generar la key</h2>
          <p>Creá tu API key en <a href="/dashboard/api" style={{ color: "var(--accent-solid)" }}>dashboard → API</a> (plan Pro). Todas empiezan con <code>kyma_sk_</code> y se muestran <strong style={{ color: "var(--c-text)" }}>una sola vez</strong> al crearlas. Si la perdés, revocala y generá otra.</p>
        </section>

        <section>
          <h2 style={h2}>Mandarla en la request</h2>
          <p>Opción recomendada — header <code>Authorization</code>:</p>
          <Code>{`Authorization: Bearer kyma_sk_xxxxxxxxxxxxxxxx`}</Code>
          <p style={{ marginTop: 12 }}>O bien el header <code>x-api-key</code>:</p>
          <Code>{`x-api-key: kyma_sk_xxxxxxxxxxxxxxxx`}</Code>
        </section>

        <section>
          <h2 style={h2}>Buenas prácticas</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong style={{ color: "var(--c-text)" }}>Nunca</strong> expongas la key en el frontend público — usala solo desde tu backend.</li>
            <li>Guardala en una variable de entorno (<code>KYMA_API_KEY</code>), no en el código.</li>
            <li>Usá una key por entorno (dev / prod) para poder revocar sin romper todo.</li>
            <li>El CORS está abierto (<code>*</code>) para que pruebes, pero eso no cambia lo anterior.</li>
          </ul>
        </section>

        <section>
          <h2 style={h2}>Respuestas de auth</h2>
          <p>Si falta la key o es inválida vas a recibir <code>401</code>; si tu plan no es Pro, <code>403</code>. Ver <a href="/docs/errores" style={{ color: "var(--accent-solid)" }}>Errores</a>.</p>
        </section>
      </div>
    </>
  );
}
