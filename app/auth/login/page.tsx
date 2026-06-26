import LoginForm from "./LoginForm";
import { brand } from "@/lib/brand";

export const metadata = { title: `Ingresar — ${brand.name}` };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gradient">{brand.name}</h1>
          <p className="text-muted text-sm">{brand.tagline}</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Ingresá con tu email</h2>
            <p className="text-sm text-muted">
              Te mandamos un link mágico — sin contraseña.
            </p>
          </div>
          <LoginForm searchParams={searchParams} />
        </div>

        <p className="text-center text-xs text-muted">
          Al ingresar aceptás los{" "}
          <a href="/terms" className="underline hover:text-white transition-colors">
            términos de uso
          </a>{" "}
          y la{" "}
          <a href="/privacy" className="underline hover:text-white transition-colors">
            política de privacidad
          </a>
          .
        </p>
      </div>
    </div>
  );
}
