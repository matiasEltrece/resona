/**
 * Configuración central de marca.
 * TODO el branding sale de acá: cambiá estos valores y se actualiza toda la app.
 * Pensado así para poder revender el producto "llave en mano" re-marcándolo en minutos.
 */
export const brand = {
  name: "Resona",
  // Cómo se lee el nombre en el logo (permite estilizar una parte)
  logoMark: "Resona",
  tagline: "Cualquier voz. Cualquier idioma. En segundos.",
  description:
    "Estudio de voz con IA. Cloná cualquier voz con 10 segundos de audio o diseñá una desde cero, y hacela hablar en 600+ idiomas con calidad de estudio.",
  domain: "resona.ai",
  // Paleta (se inyecta en CSS variables en globals.css)
  colors: {
    accentFrom: "#7c5cff", // violeta
    accentVia: "#d946ef", // fucsia
    accentTo: "#22d3ee", // cyan
  },
  social: {
    twitter: "@resona_ai",
  },
} as const;

export type Brand = typeof brand;
