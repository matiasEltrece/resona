import { brand } from "@/lib/brand";
import Link from "next/link";

export const metadata = { title: `Términos de servicio — ${brand.name}` };

export default function TerminosPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
      <Link href="/" className="text-sm text-muted hover:text-white">← Volver</Link>
      <h1 className="text-3xl font-bold gradient-text">Términos de servicio</h1>
      <p className="text-xs text-muted">Última actualización: junio 2026</p>

      <div className="space-y-6 text-sm text-white/70 leading-relaxed">
        <section>
          <h2 className="text-white font-semibold mb-2">1. Qué es {brand.name}</h2>
          <p>{brand.name} es una plataforma de generación de voz con inteligencia artificial que permite crear, clonar y diseñar voces. El servicio se ofrece a través de {brand.domain}.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">2. Uso aceptable</h2>
          <p>Al usar {brand.name} te comprometés a no generar contenido ilegal, difamatorio, fraudulento o que infrinja derechos de terceros. Está expresamente prohibido:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Clonar la voz de una persona sin su consentimiento explícito.</li>
            <li>Suplantar identidades, crear desinformación o cometer fraude.</li>
            <li>Generar contenido que viole leyes aplicables.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">3. Voice cloning y consentimiento</h2>
          <p>Sos el único responsable de tener los derechos y el consentimiento necesarios sobre cualquier voz que subas para clonar. {brand.name} no se hace responsable por el uso indebido de la función de clonación. Cloná únicamente voces propias o con autorización expresa.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">4. Cuentas y planes</h2>
          <p>El acceso requiere registro por email. Ofrecemos un plan gratuito con un límite mensual de generaciones y planes pagos con mayor capacidad. Los límites y precios pueden cambiar con aviso previo.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">5. Propiedad del contenido generado</h2>
          <p>El audio que generás es tuyo para usar según los términos de tu plan, incluido uso comercial. El motor de IA subyacente (OmniVoice) se distribuye bajo licencia Apache-2.0.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">6. Limitación de responsabilidad</h2>
          <p>El servicio se ofrece "tal cual". No garantizamos disponibilidad ininterrumpida ni resultados específicos. No somos responsables por daños derivados del uso del servicio.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">7. Contacto</h2>
          <p>Por cualquier consulta: <a href={`mailto:${brand.email}`} className="underline hover:text-white">{brand.email}</a></p>
        </section>
      </div>
    </main>
  );
}
