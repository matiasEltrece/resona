import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kyma — Estudio de voz con IA",
  description:
    "Cloná cualquier voz con 10 segundos de audio o diseñala desde cero. 646 idiomas con calidad de estudio.",
  keywords: ["voz ia", "voice cloning", "tts", "text to speech", "ia español", "kyma"],
  openGraph: {
    title: "Kyma — Cualquier voz. Cualquier idioma.",
    description: "Estudio de voz con IA. Voice cloning profesional en segundos.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#060509" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full grain">
        <div className="aurora-bg" />
        {children}
      </body>
    </html>
  );
}
