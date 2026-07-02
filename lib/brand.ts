/**
 * Configuración central de marca.
 * TODO el branding sale de acá: cambiá estos valores y se actualiza toda la app.
 * Pensado así para poder revender el producto "llave en mano" re-marcándolo en minutos.
 */
// Kyma — κῦμα — "ola" en griego antiguo
export const brand = {
  name: "Kyma",
  logoMark: "Kyma",
  tagline: "Cualquier voz. Cualquier idioma. En segundos.",
  description:
    "Estudio de voz con IA. Cloná cualquier voz con 10 segundos de audio o diseñala desde cero — multilenguaje, rápido y sin instalar nada.",
  domain: "kyma.synthetic.com.ar",
  email: "hola@kyma.synthetic.com.ar",
  colors: {
    accentFrom: "#ecd49a",
    accentVia: "#c79a45",
    accentTo: "#a87f33",
  },
  social: {
    twitter: "@kyma_ai",
  },
  free: {
    charactersPerMonth: 10000,
  },
} as const;

export type Brand = typeof brand;
