import Studio from "@/components/Studio";
import Pricing from "@/components/Pricing";
import NavbarAuth from "@/components/NavbarAuth";
import { brand } from "@/lib/brand";

const USE_CASES = [
  { emoji: "🎙", title: "Creadores de contenido", desc: "Grabá 10s de tu voz y multiplicala: narraciones en 30 idiomas sin volver al micrófono." },
  { emoji: "📖", title: "Audiolibros", desc: "Convertí cualquier libro en audiolibro con voces diseñadas por capítulo: narrador, personajes, épocas." },
  { emoji: "🎬", title: "Doblaje", desc: "Subí un video, elegí el idioma destino y obtenés la voz del original replicada en el nuevo idioma." },
  { emoji: "🤖", title: "Asistentes & bots", desc: "Dale una voz única y consistente a tu producto de IA. Identidad sonora en cualquier idioma." },
  { emoji: "🎮", title: "Videojuegos", desc: "NPCs con voces únicas diseñadas para cada personaje. Genera cientos de líneas en minutos." },
  { emoji: "📣", title: "Marketing", desc: "Ads localizados en 20 idiomas con la misma voz de marca. Sin actores, sin estudio, sin esperas." },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Navbar ── */}
      <NavbarAuth />

      {/* ── Hero ── */}
      <section className="py-20 px-4 text-center space-y-6 fade-up">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Impulsado por OmniVoice · Apache-2.0 · Modelo open-source
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold leading-tight tracking-tight max-w-3xl mx-auto">
          Cualquier voz.
          <br />
          <span className="text-gradient">Cualquier idioma.</span>
        </h1>

        <p className="text-lg text-muted max-w-xl mx-auto leading-relaxed">
          Cloná una voz con 10 segundos de audio o diseñala desde cero.
          Más de <strong className="text-white">600 idiomas</strong>, calidad de estudio,
          generación en menos de 1 segundo.
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {[
            "🌍 600+ idiomas",
            "⚡ <1s generación",
            "🎙 Voice cloning",
            "🎨 Voice design",
            "😂 [laughter] & más",
            "✅ Uso comercial OK",
          ].map((f) => (
            <span key={f} className="glass rounded-full px-3 py-1 text-xs text-muted">
              {f}
            </span>
          ))}
        </div>

        <a href="#studio" className="btn-accent inline-block px-8 py-3.5 rounded-2xl text-base font-semibold">
          Probalo gratis — sin registro
        </a>
      </section>

      {/* ── Studio ── */}
      <section id="studio" className="pb-10">
        <Studio />
      </section>

      {/* ── Casos de uso ── */}
      <section id="casos" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted">Para quién</p>
            <h2 className="text-4xl font-bold">
              Una herramienta,{" "}
              <span className="text-gradient">infinitos usos</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {USE_CASES.map((c) => (
              <div key={c.title} className="glass glass-hover rounded-2xl p-5 space-y-2">
                <span className="text-3xl">{c.emoji}</span>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precios ── */}
      <Pricing />

      {/* ── CTA final ── */}
      <section className="py-24 px-4 text-center space-y-6">
        <h2 className="text-4xl font-bold">
          Empezá a generar voces{" "}
          <span className="text-gradient">ahora mismo</span>
        </h2>
        <p className="text-muted max-w-md mx-auto">
          Sin tarjeta de crédito. 10.000 caracteres gratis por mes. Cancelás cuando quieras.
        </p>
        <a href="#studio" className="btn-accent inline-block px-10 py-4 rounded-2xl text-lg font-semibold">
          ✦ Abrir el Studio
        </a>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <span className="font-semibold text-gradient text-sm">{brand.name}</span>
          <p className="text-center">
            Motor:{" "}
            <a href="https://github.com/k2-fsa/OmniVoice" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
              OmniVoice
            </a>{" "}
            (Apache-2.0) · Solo para uso responsable y con consentimiento de las voces clonadas.
          </p>
          <div className="flex gap-4">
            <a href="#precios" className="hover:text-white transition-colors">Precios</a>
            <a href="/terminos" className="hover:text-white transition-colors">Términos</a>
            <a href="/privacidad" className="hover:text-white transition-colors">Privacidad</a>
            <a href={`mailto:${brand.email}`} className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
