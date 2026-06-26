import { createClient } from "@/lib/supabase/server";
import ApiKeysClient from "./ApiKeysClient";

export const metadata = { title: "API & claves — Kyma" };

export default async function ApiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: keys } = await supabase
    .from("kyma_api_keys")
    .select("id, name, key_prefix, revoked, last_used_at, created_at")
    .order("created_at", { ascending: false });

  return <ApiKeysClient initialKeys={keys ?? []} />;
}
