import { brand } from "@/lib/brand";
import PremiumShell from "@/components/PremiumShell";

export const metadata = { title: `Política de privacidad — ${brand.name}` };

const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--c-text)" };

export default function PrivacidadPage() {
  return (
    <PremiumShell>
      <h1 style={{ fontSize: "clamp(30px,4vw,42px)", fontWeight: 800, letterSpacing: "-0.02em" }}>Política de privacidad</h1>
      <p style={{ fontSize: 13, color: "var(--c-text-3)", marginTop: 6 }}>Última actualización: junio 2026</p>

      <div className="kp-prose" style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 26, fontSize: 15 }}>
        <section>
          <h2 style={h2}>1. Qué datos recopilamos</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            <li><strong style={{ color: "var(--c-text)" }}>Cuenta:</strong> tu email y contraseña (la contraseña se guarda cifrada).</li>
            <li><strong style={{ color: "var(--c-text)" }}>Uso:</strong> cantidad de generaciones, idioma y metadatos técnicos (no el texto completo).</li>
            <li><strong style={{ color: "var(--c-text)" }}>Voces guardadas:</strong> los audios de referencia que subís a &quot;Mis voces&quot;, solo accesibles por vos.</li>
          </ul>
        </section>
        <section>
          <h2 style={h2}>2. Cómo usamos tus datos</h2>
          <p>Usamos tus datos para operar el servicio, gestionar tu cuenta y tus límites, y mejorar el producto. No vendemos tus datos personales a terceros.</p>
        </section>
        <section>
          <h2 style={h2}>3. Audio que generás</h2>
          <p>El audio generado se devuelve a tu navegador y no se almacena de forma permanente en nuestros servidores salvo que lo guardes explícitamente. Los audios de referencia de &quot;Mis voces&quot; se guardan cifrados y privados, accesibles únicamente por tu cuenta.</p>
        </section>
        <section>
          <h2 style={h2}>4. Proveedores</h2>
          <p>Usamos servicios de terceros para operar: Supabase (autenticación y base de datos), Modal (procesamiento de IA), Resend (envío de emails) y Vercel (hosting). Cada uno procesa datos según sus propias políticas.</p>
        </section>
        <section>
          <h2 style={h2}>5. Tus derechos</h2>
          <p>Podés acceder, corregir o eliminar tus datos en cualquier momento desde <a href="/dashboard/cuenta" style={{ color: "var(--accent-solid)" }}>tu cuenta</a>. Al borrar tu cuenta se eliminan tus datos asociados (perfil, créditos, voces guardadas). Escribinos a <a href={`mailto:${brand.email}`} style={{ color: "var(--accent-solid)" }}>{brand.email}</a>.</p>
        </section>
        <section>
          <h2 style={h2}>6. Cookies</h2>
          <p>Usamos cookies esenciales para mantener tu sesión iniciada. No usamos cookies de seguimiento publicitario.</p>
        </section>
        <section>
          <h2 style={h2}>7. Contacto</h2>
          <p>Por cualquier consulta sobre privacidad: <a href={`mailto:${brand.email}`} style={{ color: "var(--accent-solid)" }}>{brand.email}</a></p>
        </section>
      </div>
    </PremiumShell>
  );
}
