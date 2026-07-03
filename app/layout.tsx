import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque, Space_Grotesk, Playfair_Display, Inter, Sora, Manrope, Fraunces } from "next/font/google";
import "./globals.css";
import { getSiteConfig, FONT_PRESETS, DEFAULT_FONT_PRESET } from "@/lib/site-config";
import { BrandProvider } from "@/components/BrandProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin"] });
// Presets de tipografía adicionales, seleccionables desde /dashboard/admin/branding
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["600", "700", "800"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["600", "700", "800"] });
const FONT_CLASSES = `${playfair.variable} ${inter.variable} ${sora.variable} ${manrope.variable} ${fraunces.variable}`;

const SITE_URL = "https://kyma.synthetic.com.ar";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kyma — Voz con IA en español y muchos idiomas",
    template: "%s · Kyma",
  },
  description:
    "Cloná, diseñá y generá voces con IA en español y muchos idiomas más (inglés, portugués, francés, chino…). Calidad de estudio en segundos, con API lista para integrar.",
  applicationName: "Kyma",
  keywords: [
    "voz ia", "voice cloning español", "clonación de voz", "tts español",
    "text to speech ia", "ia de voz", "doblaje ia", "voz artificial español",
    "alternativa elevenlabs", "alternativa cartesia", "generador de voz latam",
    "locución ia", "audiolibros ia", "kyma",
  ],
  authors: [{ name: "Synthetic" }],
  creator: "Synthetic",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kyma — Voz con IA en español y muchos idiomas",
    description:
      "Voz con IA en español, inglés, portugués y muchos idiomas más. Cloná, diseñá y generá voces en segundos.",
    url: SITE_URL,
    siteName: "Kyma",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kyma — Voz con IA en español y muchos idiomas",
    description: "Cloná, diseñá y generá voces con IA en español y muchos idiomas. Calidad de estudio en segundos.",
    creator: "@kyma_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = { themeColor: "#0b0916" };

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "Kyma",
      url: SITE_URL,
      description: "Estudio de voz con IA en español y muchos idiomas más.",
      sameAs: ["https://twitter.com/kyma_ai"],
    },
    {
      "@type": "SoftwareApplication",
      name: "Kyma",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      inLanguage: "es",
      description:
        "Cloná, diseñá y generá voces con IA en español y muchos idiomas más. Calidad de estudio en segundos.",
      offers: [
        { "@type": "Offer", name: "Gratis", price: "0", priceCurrency: "USD" },
        { "@type": "Offer", name: "Creator", price: "12", priceCurrency: "USD" },
        { "@type": "Offer", name: "Pro", price: "39", priceCurrency: "USD" },
      ],
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿En qué idiomas genera Kyma?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Kyma genera voz en español, inglés, portugués, francés, chino, japonés y muchos idiomas más. Para máxima fidelidad podés clonar tu propia voz con 10 segundos de audio.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo clonar mi voz?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Con 10 segundos de audio limpio Kyma clona tu voz y la replica en español y muchos idiomas más.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuánto cuesta y hay plan gratis?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hay un plan gratis con 10.000 caracteres por mes, sin tarjeta. El plan Creator cuesta USD 12/mes y el Pro USD 39/mes con acceso a la API.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo usar las voces comercialmente?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Desde el plan Creator sí: incluye licencia de uso comercial y quita la marca de agua. El plan Gratis es para uso personal y pruebas.",
          },
        },
        {
          "@type": "Question",
          name: "¿Qué pasa si me paso de los caracteres incluidos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No se corta de golpe: podés comprar packs de créditos extra o subir de plan cuando quieras. Los packs comprados no vencen.",
          },
        },
      ],
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();
  const preset = FONT_PRESETS[config.fontPreset] ?? FONT_PRESETS[DEFAULT_FONT_PRESET];
  const brandOverrideCss = `
    :root, .kyma-premium, .kyma-premium[data-theme="dark"] {
      --gold-1: ${config.accentFrom} !important;
      --gold-2: ${config.accentVia} !important;
      --accent-grad: linear-gradient(115deg, ${config.accentFrom}, ${config.accentVia}) !important;
      --accent-solid: ${config.accentTo} !important;
      --accent-glow: ${config.accentTo}73 !important;
      --font-head: ${preset.head}, system-ui, sans-serif !important;
      --font-body: ${preset.body}, system-ui, sans-serif !important;
    }
  `;

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${spaceGrotesk.variable} ${FONT_CLASSES} h-full antialiased`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandOverrideCss }} />
      </head>
      <body className="min-h-full grain">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <div className="aurora-bg" />
        <BrandProvider logoCompactUrl={config.logoCompactUrl} logoStudioUrl={config.logoStudioUrl}>
          {children}
        </BrandProvider>
      </body>
    </html>
  );
}
