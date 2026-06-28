import { brand } from "@/lib/brand";
import { DocHeader, Code, h2 } from "@/components/docs-ui";

export const metadata = { title: `Errores — ${brand.name}` };

const ERRORS: { status: number; code: string; desc: string }[] = [
  { status: 400, code: "no_text", desc: "Falta el campo text o está vacío." },
  { status: 400, code: "text_too_long", desc: "El texto supera los 5000 caracteres." },
  { status: 400, code: "bad_json", desc: "El body no es JSON válido." },
  { status: 400, code: "consent_required", desc: "Clonación sin \"consent\": true." },
  { status: 401, code: "no_key", desc: "No mandaste API key." },
  { status: 401, code: "invalid_key", desc: "La key es inválida o fue revocada." },
  { status: 403, code: "plan_required", desc: "Tu plan no es Pro." },
  { status: 429, code: "rate_limited", desc: "Más de 30 requests/minuto por key." },
  { status: 429, code: "credits_exhausted", desc: "Agotaste los caracteres del mes." },
  { status: 500, code: "auth_error", desc: "Error validando la key (transitorio)." },
  { status: 500, code: "generation_error", desc: "Falló la generación del audio." },
];

function badge(status: number): React.CSSProperties {
  const ok = status < 400;
  const warn = status >= 400 && status < 500;
  const color = ok ? "#16794d" : warn ? "var(--accent-solid)" : "#b4453a";
  return { fontFamily: "var(--font-mono)", fontWeight: 700, color, fontSize: 13 };
}

export default function Errores() {
  return (
    <>
      <DocHeader eyebrow="Referencia API" title="Errores" intro="Todos los errores devuelven JSON con un mensaje y un código estable para manejarlos en tu código." />

      <div className="kp-prose" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <section>
          <h2 style={h2}>Forma del error</h2>
          <Code>{`{
  "error": "API key inválida o revocada",
  "code": "invalid_key"
}`}</Code>
          <p style={{ marginTop: 8 }}>Programá contra <code>code</code> (estable), no contra <code>error</code> (texto, puede cambiar).</p>
        </section>

        <section>
          <h2 style={h2}>Códigos</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "0 16px 8px 0", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--c-text-3)" }}>HTTP</th>
                <th style={{ padding: "0 16px 8px 0", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--c-text-3)" }}>code</th>
                <th style={{ padding: "0 0 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--c-text-3)" }}>Cuándo</th>
              </tr>
            </thead>
            <tbody>
              {ERRORS.map((e) => (
                <tr key={e.code} style={{ borderTop: "1px solid var(--c-border)" }}>
                  <td style={{ padding: "9px 16px 9px 0", verticalAlign: "top" }}><span style={badge(e.status)}>{e.status}</span></td>
                  <td style={{ padding: "9px 16px 9px 0", verticalAlign: "top", whiteSpace: "nowrap" }}><code style={{ color: "var(--accent-solid)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{e.code}</code></td>
                  <td style={{ padding: "9px 0", fontSize: 14, color: "var(--c-text-2)" }}>{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
