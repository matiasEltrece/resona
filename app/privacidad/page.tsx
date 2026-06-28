import { brand } from "@/lib/brand";
import Link from "next/link";

export const metadata = { title: `Política de privacidad — ${brand.name}` };

export default function PrivacidadPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
      <Link href="/" className="text-sm text-muted hover:text-white">← Volver</Link>
      <h1 className="text-3xl font-bold text-gradient">Política de privacidad</h1>
      <p className="text-xs text-muted">Última actualización: junio 2026</p>

      <div className="space-y-6 text-sm text-white/70 leading-relaxed">
        <section>
          <h2 className="text-white font-semibold mb-2">1. Qué datos recopilamos</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-white/90">Cuenta:</strong> tu email y contraseña (la contraseña se guarda cifrada).</li>
            <li><strong className="text-white/90">Uso:</strong> cantidad de generaciones, idioma y metadatos técnicos (no el texto completo).</li>
            <li><strong className="text-white/90">Voces guardadas:</strong> los audios de referencia que subís a "Mis voces", solo accesibles por vos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">2. Cómo usamos tus datos</h2>
          <p>Usamos tus datos para operar el servicio, gestionar tu cuenta y tus límites, y mejorar el producto. No vendemos tus datos personales a terceros.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">3. Audio que generás</h2>
          <p>El audio generado se devuelve a tu navegador y no se almacena de forma permanente en nuestros servidores salvo que lo guardes explícitamente. Los audios de referencia de "Mis voces" se guardan cifrados y privados, accesibles únicamente por tu cuenta.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">4. Proveedores</h2>
          <p>Usamos servicios de terceros para operar: Supabase (autenticación y base de datos), Modal (procesamiento de IA) y Vercel (hosting). Cada uno procesa datos según sus propias políticas.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">5. Tus derechos</h2>
          <p>Podés acceder, corregir o eliminar tus datos en cualquier momento. Al borrar tu cuenta se eliminan tus datos asociados (perfil, créditos, voces guardadas). Escribinos a <a href={`mailto:${brand.email}`} className="underline hover:text-white">{brand.email}</a>.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">6. Cookies</h2>
          <p>Usamos cookies esenciales para mantener tu sesión iniciada. No usamos cookies de seguimiento publicitario.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">7. Contacto</h2>
          <p>Por cualquier consulta sobre privacidad: <a href={`mailto:${brand.email}`} className="underline hover:text-white">{brand.email}</a></p>
        </section>
      </div>
    </main>
  );
}
