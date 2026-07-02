import { brand } from "@/lib/brand";
import PremiumThemeRoot from "@/components/PremiumThemeRoot";

export const metadata = { title: `Acceso restringido — ${brand.name}` };

export default function NoAccessPage() {
  return (
    <PremiumThemeRoot>
      <main className="min-h-screen flex items-center justify-center px-4">
        <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow)" }} className="rounded-2xl p-10 max-w-md w-full text-center space-y-6">
          <div className="text-5xl">🔒</div>
          <h1 className="text-2xl font-bold text-gradient">{brand.name} está en beta privada</h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-2)" }}>
            Tu cuenta no tiene acceso por el momento. Estamos incorporando usuarios de a poco.
            Si querés entrar a la lista de espera, escribinos.
          </p>
          <a href={`mailto:${brand.email}?subject=Acceso%20Kyma%20beta`}
            className="block w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--c-btn)", color: "var(--c-btn-text)" }}>
            Solicitar acceso
          </a>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="block w-full text-xs transition-opacity hover:opacity-70" style={{ color: "var(--c-text-3)" }}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </main>
    </PremiumThemeRoot>
  );
}
