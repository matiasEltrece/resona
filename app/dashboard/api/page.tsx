import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ApiKeysClient from "./ApiKeysClient";

export const metadata = { title: "API & claves — Kyma" };

const PRO_URL = process.env.NEXT_PUBLIC_LEMON_PRO_BUY_URL ?? "https://synthetic-ai.lemonsqueezy.com/checkout/buy/d3e10379-5257-4f13-b560-f0286c4b8be1";

export default async function ApiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("kyma_profiles").select("plan").eq("id", user.id).single();
  const plan = profile?.plan ?? "free";
  const canUseApi = plan === "pro" || plan === "admin";

  if (!canUseApi) {
    return (
      <div className="glass rounded-2xl p-8 text-center space-y-4 fade-up">
        <span className="text-4xl">🔌</span>
        <h1 className="text-xl font-bold">La API es exclusiva del plan Pro</h1>
        <p className="text-sm text-muted max-w-md mx-auto">
          Generá API keys e integrá Kyma en tu producto con el plan <strong>Pro</strong>: 1.000.000 caracteres/mes,
          API de alto volumen y soporte prioritario.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <a href={PRO_URL} className="btn-accent rounded-xl px-6 py-2.5 text-sm font-semibold">Pasar a Pro · $39/mes</a>
          <Link href="/dashboard" className="glass glass-hover rounded-xl px-6 py-2.5 text-sm font-semibold">Volver</Link>
        </div>
        <p className="text-xs text-muted pt-2">¿Dudas? Mirá los <Link href="/docs" className="text-gradient">docs de la API</Link>.</p>
      </div>
    );
  }

  const { data: keys } = await supabase
    .from("kyma_api_keys")
    .select("id, name, key_prefix, revoked, last_used_at, created_at")
    .order("created_at", { ascending: false });

  return <ApiKeysClient initialKeys={keys ?? []} />;
}
