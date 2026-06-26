import Studio from "@/components/Studio";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 border-b border-border backdrop-blur-xl bg-[rgba(6,5,9,0.7)]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gradient">Resona</span>
            </span>
            <span className="hidden sm:inline text-xs text-muted border border-border rounded-full px-2 py-0.5">
              beta
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#studio"
              className="btn-accent px-4 py-1.5 rounded-full text-sm font-medium"
            >
              Empezar gratis
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="py-20 px-4 text-center space-y-6 fade-up">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted mb-4">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Impulsado por OmniVoice · Apache-2.0
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold leading-tight tracking-tight max-w-3xl mx-auto">
          Cualquier voz.{" "}
          <br />
          <span className="text-gradient">Cualquier idioma.</span>
        </h1>

        <p className="text-lg text-muted max-w-xl mx-auto leading-relaxed">
          Cloná una voz con 10 segundos de audio o diseñala desde cero.
          Más de <strong className="text-white">600 idiomas</strong>, calidad de estudio,
          inferencia en menos de 1 segundo.
        </p>

        {/* Pills de features */}
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          {[
            "🌍 600+ idiomas",
            "⚡ RTF 0.025",
            "🎙 Voice cloning",
            "🎨 Voice design",
            "😂 [laughter] & más",
            "✅ Apache-2.0",
          ].map((f) => (
            <span key={f} className="glass rounded-full px-3 py-1 text-xs text-muted">
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* ── Studio ── */}
      <section id="studio" className="flex-1 pb-20">
        <Studio />
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-muted">
        <p>
          Resona · Motor:{" "}
          <a
            href="https://github.com/k2-fsa/OmniVoice"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors"
          >
            OmniVoice
          </a>{" "}
          (Apache-2.0) · Solo para uso responsable y con consentimiento de las voces clonadas.
        </p>
      </footer>
    </div>
  );
}
