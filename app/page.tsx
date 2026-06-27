import Studio from "@/components/Studio";
import NavbarAuth from "@/components/NavbarAuth";
import HeroRadio from "@/components/HeroRadio";
import { brand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";

const CREATOR_URL = process.env.NEXT_PUBLIC_LEMON_CREATOR_BUY_URL ?? "https://synthetic-ai.lemonsqueezy.com/checkout/buy/2be79926-5aa3-4738-a169-558105a8c7ea";
const PRO_URL = process.env.NEXT_PUBLIC_LEMON_PRO_BUY_URL ?? "https://synthetic-ai.lemonsqueezy.com/checkout/buy/d3e10379-5257-4f13-b560-f0286c4b8be1";

const FEATURES = [
  { icon: "🎙", title: "Cloná tu voz", desc: "Grabá 10 segundos de audio limpio y replicá tu voz en cualquiera de los 646 idiomas." },
  { icon: "🎨", title: "Diseñá voces", desc: "Ajustá tono, edad y carácter. Creá una identidad sonora desde cero, sin grabar nada." },
  { icon: "⚡", title: "Generación <1s", desc: "Latencia mínima. RTF 0.025 — hasta 40× más rápido que el tiempo real." },
  { icon: "🌍", title: "646 idiomas", desc: "Doblaje y traducción de voz que cruzan cualquier frontera, con tu propia voz." },
  { icon: "🔌", title: "API REST", desc: "Integrá Kyma en tu producto con un solo endpoint. Disponible en el plan Pro." },
  { icon: "📊", title: "Métricas en vivo", desc: "Caracteres, latencia y uso, monitoreados en tiempo real desde tu dashboard." },
];

const STEPS = [
  { num: "01", title: "Subí o grabá", desc: "Con 10 segundos de audio limpio alcanza para clonar tu voz. La transcribimos automáticamente." },
  { num: "02", title: "Elegí el idioma", desc: "646 opciones. Seleccioná el idioma destino y el carácter de la voz que querés generar." },
  { num: "03", title: "Generá y descargá", desc: "En menos de un segundo tenés tu audio listo para usar, exportar o integrar por API." },
];

const STATS = [
  { value: "646", label: "Idiomas soportados" },
  { value: "0.025", label: "RTF — factor de tiempo real" },
  { value: "<1s", label: "Generación de voz" },
  { value: "10k", label: "Caracteres gratis / mes" },
];

const PLANS = [
  { name: "Gratis", price: "$0", per: "/mes", featured: false, tagline: "Para probar y proyectos chicos.",
    features: ["10.000 caracteres / mes", "Voces estándar", "Generación en <1s", "646 idiomas"],
    cta: "Empezar gratis", href: "/auth/login" },
  { name: "Creator", price: "$12", per: "/mes", featured: true, tagline: "Para creadores que producen seguido.",
    features: ["200.000 caracteres / mes", "Clonación de voz", "Sin marca de agua", "Descarga en alta calidad"],
    cta: "Probar Creator", href: CREATOR_URL },
  { name: "Pro", price: "$39", per: "/mes", featured: false, tagline: "Para equipos y productos.",
    features: ["1.000.000 caracteres / mes", "Acceso a la API REST", "Métricas en vivo", "Soporte prioritario"],
    cta: "Ir a Pro", href: PRO_URL },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthed = !!user;

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarAuth />

      {/* ── Hero + Radio ── */}
      <HeroRadio />

      {/* ── Studio (la herramienta real) ── */}
      <section id="studio" className="pb-10 pt-4">
        <Studio isAuthed={isAuthed} />
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative max-w-[1024px] mx-auto px-7 pt-10 pb-14">
        <div className="text-center max-w-[620px] mx-auto mb-12">
          <p className="text-xs uppercase mb-3.5" style={{ letterSpacing: "0.18em", color: "var(--text-muted)" }}>Una herramienta</p>
          <h2 className="font-extrabold leading-[1.08]" style={{ fontSize: "clamp(30px,4.4vw,46px)", letterSpacing: "-0.02em" }}>
            Una herramienta, <span className="text-gradient">infinitos usos</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[18px]">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass glass-hover" style={{ borderRadius: "var(--radius-lg)", padding: "26px 24px" }}>
              <div className="flex items-center justify-center mb-[18px]" style={{ width: 46, height: 46, borderRadius: "var(--radius-md)", fontSize: 22, background: "rgba(124,92,255,0.10)", border: "1px solid var(--glass-border)" }}>{f.icon}</div>
              <h3 className="font-semibold mb-2" style={{ fontSize: "var(--text-xl)", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p className="leading-[1.62]" style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3 pasos ── */}
      <section id="steps" className="relative max-w-[1024px] mx-auto px-7 pt-12 pb-14">
        <div className="text-center max-w-[620px] mx-auto mb-[52px]">
          <p className="text-xs uppercase mb-3.5" style={{ letterSpacing: "0.18em", color: "var(--text-muted)" }}>Cómo funciona</p>
          <h2 className="font-extrabold leading-[1.08]" style={{ fontSize: "clamp(30px,4.4vw,46px)", letterSpacing: "-0.02em" }}>
            Creá una voz en <span className="text-gradient">3 pasos</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
          {STEPS.map((s) => (
            <div key={s.num} className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "30px 26px" }}>
              <div className="font-mono font-semibold text-gradient w-fit" style={{ fontSize: "var(--text-sm)" }}>{s.num}</div>
              <h3 className="font-semibold mt-4 mb-2" style={{ fontSize: "var(--text-lg)" }}>{s.title}</h3>
              <p className="leading-[1.62]" style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative max-w-[1024px] mx-auto px-7 pt-10 pb-16">
        <div className="glass relative overflow-hidden grid grid-cols-2 md:grid-cols-4 gap-6 text-center" style={{ borderRadius: "var(--radius-xl)", padding: "48px 32px" }}>
          <div className="absolute pointer-events-none" style={{ left: "50%", top: "-40%", transform: "translateX(-50%)", width: "60%", height: "120%", background: "radial-gradient(50% 50% at 50% 50%, rgba(124,92,255,0.16), transparent 70%)", filter: "blur(40px)" }} />
          {STATS.map((st) => (
            <div key={st.label} className="relative">
              <p className="font-extrabold text-gradient leading-none w-fit mx-auto" style={{ fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.02em" }}>{st.value}</p>
              <p className="mt-3" style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{st.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precios" className="relative max-w-[1024px] mx-auto px-7 pt-12 pb-14">
        <div className="text-center max-w-[620px] mx-auto mb-[52px]">
          <p className="text-xs uppercase mb-3.5" style={{ letterSpacing: "0.18em", color: "var(--text-muted)" }}>Precios</p>
          <h2 className="font-extrabold leading-[1.08]" style={{ fontSize: "clamp(30px,4.4vw,46px)", letterSpacing: "-0.02em" }}>
            Empezá gratis, <span className="text-gradient">crecé cuando estés listo</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] items-stretch">
          {PLANS.map((p) => (
            <div key={p.name} className="glass relative flex flex-col" style={{ borderRadius: "var(--radius-lg)", padding: "30px 26px", border: `1px solid ${p.featured ? "var(--brand-violet)" : "var(--glass-border)"}`, boxShadow: p.featured ? "var(--ring-accent)" : "none" }}>
              {p.featured && (
                <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold whitespace-nowrap" style={{ top: -11, padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: 11, background: "var(--brand-gradient-2)", boxShadow: "var(--shadow-accent)" }}>Más elegido</span>
              )}
              <h3 className="font-semibold" style={{ fontSize: "var(--text-lg)" }}>{p.name}</h3>
              <div className="flex items-baseline gap-1.5 mt-3.5 mb-1">
                <span className="font-extrabold" style={{ fontSize: 42, letterSpacing: "-0.02em" }}>{p.price}</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{p.per}</span>
              </div>
              <p className="mb-[22px]" style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{p.tagline}</p>
              <div className="flex flex-col gap-[11px] mb-[26px]">
                {p.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5" style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                    <span className="flex-shrink-0 mt-px" style={{ color: "var(--brand-cyan)" }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                <a href={p.href} className={`block text-center font-semibold rounded-full ${p.featured ? "btn-accent text-white" : "glass glass-hover"}`} style={{ padding: "11px 0" }}>
                  {p.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center mt-[26px]" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          Solo para uso responsable y con consentimiento de las voces clonadas.
        </p>
      </section>

      {/* ── CTA final ── */}
      <section className="relative max-w-[1024px] mx-auto px-7 pt-12 pb-20">
        <div className="glass relative overflow-hidden text-center" style={{ borderRadius: "var(--radius-xl)", padding: "72px 32px" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 90% at 50% 0%, rgba(217,70,239,0.18), transparent 60%)" }} />
          <div className="relative">
            <h2 className="font-extrabold mx-auto max-w-[680px] leading-[1.08]" style={{ fontSize: "clamp(32px,4.8vw,52px)", letterSpacing: "-0.025em" }}>
              Dale voz a todo lo que <span className="text-gradient">imaginás</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[480px] leading-[1.6]" style={{ fontSize: "var(--text-lg)", color: "var(--text-secondary)" }}>
              Cualquier voz. Cualquier idioma. En segundos.
            </p>
            <div className="mt-8 flex gap-[14px] justify-center flex-wrap">
              <a href="#studio" className="btn-accent rounded-full font-semibold inline-flex items-center px-7" style={{ height: 52 }}>Empezá gratis ✦</a>
              <a href="/docs" className="glass glass-hover rounded-full font-semibold inline-flex items-center px-7" style={{ height: 52 }}>Ver la API</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-border py-9 px-7">
        <div className="max-w-[1024px] mx-auto flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kyma-logo.png" alt={brand.name} className="h-[22px] w-auto" />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>© 2026 · {brand.domain}</span>
          </div>
          <div className="flex gap-[18px]" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
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
