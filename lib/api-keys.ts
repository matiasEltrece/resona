import { createHash, randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * API keys de Kyma. Formato: kyma_sk_<32 hex>.
 * Guardamos solo el SHA-256 en la DB; el texto plano se muestra una sola vez.
 */

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = randomBytes(24).toString("hex"); // 48 chars
  const key = `kyma_sk_${raw}`;
  return { key, hash: hashKey(key), prefix: key.slice(0, 16) };
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key.trim()).digest("hex");
}

export interface ApiKeyAuth {
  userId: string;
  keyId: string;
}

/** Extrae la key del header Authorization Bearer o x-api-key. */
export function extractKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const x = req.headers.get("x-api-key");
  if (x) return x.trim();
  return null;
}

/** Valida una API key y devuelve el usuario dueño (o null). */
export async function authenticateApiKey(key: string): Promise<ApiKeyAuth | null> {
  if (!key.startsWith("kyma_sk_")) return null;
  const service = await createServiceClient();
  const { data } = await service
    .from("kyma_api_keys")
    .select("id, user_id, revoked")
    .eq("key_hash", hashKey(key))
    .single();

  if (!data || data.revoked) return null;

  // Marcar último uso (sin bloquear)
  service.from("kyma_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => {});

  return { userId: data.user_id, keyId: data.id };
}
