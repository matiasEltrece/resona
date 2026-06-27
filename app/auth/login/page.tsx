import LoginForm from "./LoginForm";
import { brand } from "@/lib/brand";

export const metadata = { title: `Ingresar — ${brand.name}` };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo + tagline */}
        <div className="text-center mb-8 fade-up">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kyma-logo.png" alt={brand.name} className="h-10 w-auto mx-auto" />
          <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>{brand.tagline}</p>
        </div>

        {/* Card */}
        <div
          className="glass fade-up"
          style={{ borderRadius: "var(--radius-xl)", padding: "32px", boxShadow: "var(--shadow-card)" }}
        >
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Ingresá con tu email</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Te mandamos un link mágico — sin contraseña.
            </p>
          </div>
          <LoginForm searchParams={searchParams} />
        </div>

        <p className="text-center text-xs mt-6 fade-up" style={{ color: "var(--text-muted)" }}>
          Al ingresar aceptás los{" "}
          <a href="/terminos" className="underline hover:text-white transition-colors">términos de uso</a>{" "}
          y la{" "}
          <a href="/privacidad" className="underline hover:text-white transition-colors">política de privacidad</a>.
        </p>
      </div>
    </div>
  );
}
