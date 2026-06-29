import { brand } from "@/lib/brand";
import PremiumShell from "@/components/PremiumShell";

export const metadata = { title: `Términos de servicio — ${brand.name}` };

const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--c-text)" };

export default function TerminosPage() {
  return (
    <PremiumShell>
      <h1 style={{ fontSize: "clamp(30px,4vw,42px)", fontWeight: 800, letterSpacing: "-0.02em" }}>Términos de servicio</h1>
      <p style={{ fontSize: 13, color: "var(--c-text-3)", marginTop: 6 }}>Última actualización: junio 2026</p>

      <div className="kp-prose" style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 26, fontSize: 15 }}>
        <section>
          <h2 style={h2}>1. Qué es {brand.name}</h2>
          <p>{brand.name} es una plataforma de generación de voz con inteligencia artificial que permite crear, clonar y diseñar voces. El servicio se ofrece a través de {brand.domain}.</p>
        </section>
        <section>
          <h2 style={h2}>2. Uso aceptable</h2>
          <p>Al usar {brand.name} te comprometés a no generar contenido ilegal, difamatorio, fraudulento o que infrinja derechos de terceros. Está expresamente prohibido:</p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Clonar la voz de una persona sin su consentimiento explícito.</li>
            <li>Suplantar identidades, crear desinformación o cometer fraude.</li>
            <li>Generar contenido que viole leyes aplicables.</li>
          </ul>
        </section>
        <section>
          <h2 style={h2}>3. Voice cloning y consentimiento</h2>
          <p>Sos el único responsable de tener los derechos y el consentimiento necesarios sobre cualquier voz que subas para clonar. {brand.name} no se hace responsable por el uso indebido de la función de clonación. Cloná únicamente voces propias o con autorización expresa.</p>
        </section>
        <section>
          <h2 style={h2}>4. Cuentas y planes</h2>
          <p>El acceso requiere registro con email y contraseña. Ofrecemos un plan gratuito con un límite mensual de caracteres y planes pagos con mayor capacidad. Los límites y precios pueden cambiar con aviso previo.</p>
        </section>
        <section>
          <h2 style={h2}>5. Propiedad del contenido y uso comercial</h2>
          <p>El audio que generás es tuyo. El <strong>uso comercial está habilitado en los planes pagos</strong> (Creator y Pro), que entregan el audio limpio. El audio del <strong>plan gratuito</strong> lleva una <strong>marca de agua inaudible</strong> y es para uso personal o de evaluación, no comercial. El motor de IA subyacente (OmniVoice) se distribuye bajo licencia Apache-2.0.</p>
        </section>
        <section>
          <h2 style={h2}>6. Limitación de responsabilidad</h2>
          <p>El servicio se ofrece &quot;tal cual&quot;. No garantizamos disponibilidad ininterrumpida ni resultados específicos. No somos responsables por daños derivados del uso del servicio.</p>
        </section>
        <section>
          <h2 style={h2}>7. Contacto</h2>
          <p>Por cualquier consulta: <a href={`mailto:${brand.email}`} style={{ color: "var(--accent-solid)" }}>{brand.email}</a></p>
        </section>
      </div>
    </PremiumShell>
  );
}
