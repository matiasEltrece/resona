import BuyButton from "./BuyButton";

const plans = [
  {
    id: "free",
    name: "Gratis",
    price: "$0",
    period: "siempre",
    highlight: false,
    badge: null,
    features: [
      "10.000 caracteres / mes",
      "646 idiomas",
      "Diseño de voz",
      "Descarga WAV",
      "Marca de agua en audio",
    ],
    missing: ["Voice cloning", "Audio HD sin marca", "API access", "Prioridad en cola"],
    cta: "Empezar gratis",
    ctaHref: "#studio",
    buyUrl: undefined,
  },
  {
    id: "creator",
    name: "Creator",
    price: "$12",
    period: "/ mes",
    highlight: true,
    badge: "Más popular",
    features: [
      "200.000 caracteres / mes",
      "646 idiomas",
      "Diseño de voz",
      "Voice cloning",
      "Audio HD sin marca",
      "Descarga WAV / MP3",
      "Prioridad en cola",
    ],
    missing: ["API access"],
    cta: "Suscribirme",
    ctaHref: null,
    buyUrl: process.env.NEXT_PUBLIC_LEMON_CREATOR_BUY_URL,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39",
    period: "/ mes",
    highlight: false,
    badge: "Para equipos",
    features: [
      "1.000.000 caracteres / mes",
      "646 idiomas",
      "Diseño de voz",
      "Voice cloning avanzado",
      "Audio HD sin marca",
      "API REST access",
      "Webhooks",
      "Soporte prioritario",
    ],
    missing: [],
    cta: "Suscribirme",
    ctaHref: null,
    buyUrl: process.env.NEXT_PUBLIC_LEMON_PRO_BUY_URL,
  },
] as const;

export default function Pricing() {
  return (
    <section className="py-24 px-4" id="precios">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted">Precios</p>
          <h2 className="text-4xl font-bold">
            Empezá gratis,{" "}
            <span className="text-gradient">crecé cuando estés listo</span>
          </h2>
          <p className="text-muted max-w-md mx-auto">
            Sin tarjeta de crédito. Cancelás cuando quieras.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass rounded-2xl p-6 flex flex-col gap-5 relative ${
                plan.highlight ? "ring-accent border-transparent" : ""
              }`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full ${
                    plan.highlight
                      ? "btn-accent"
                      : "glass border border-border text-muted"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div>
                <p className="text-sm text-muted">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted text-sm">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted/40 line-through">
                    <span className="mt-0.5 flex-shrink-0">✗</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.ctaHref ? (
                <a
                  href={plan.ctaHref}
                  className={`text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight ? "btn-accent" : "glass glass-hover"
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <BuyButton
                  buyUrl={plan.buyUrl}
                  planId={plan.id}
                  className={`text-center py-3 rounded-xl text-sm font-semibold transition-all w-full ${
                    plan.highlight ? "btn-accent" : "glass glass-hover"
                  }`}
                >
                  {plan.cta}
                </BuyButton>
              )}
            </div>
          ))}
        </div>

        {/* Social proof */}
        <p className="text-center text-xs text-muted mt-10">
          Pagos seguros vía Lemon Squeezy · Cancela en cualquier momento · Apache-2.0
        </p>
      </div>
    </section>
  );
}
