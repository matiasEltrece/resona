import { brand } from "@/lib/brand";

export const metadata = { title: `Acceso restringido — ${brand.name}` };

export default function NoAccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-10 max-w-md w-full text-center space-y-6">
        <div className="text-5xl">🔒</div>

        <h1 className="text-2xl font-bold text-gradient">{brand.name} está en beta privada</h1>

        <p className="text-white/60 text-sm leading-relaxed">
          Tu cuenta no tiene acceso por el momento. Estamos incorporando usuarios de a poco.
          Si querés entrar a la lista de espera, escribinos.
        </p>

        <a
          href="mailto:matiasborras@gmail.com?subject=Acceso%20Kyma%20beta"
          className="block w-full py-3 rounded-xl font-semibold text-sm
                     bg-gradient-to-r from-[#7c5cff] via-[#d946ef] to-[#22d3ee]
                     text-white hover:opacity-90 transition-opacity"
        >
          Solicitar acceso
        </a>

        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="block w-full text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
