/**
 * Emails transaccionales de Kyma, vía la Edge Function `kyma-emails` (que usa Resend).
 * Se autentica con el service role key (ya disponible en el server). Fire-and-forget:
 * un fallo de email NUNCA rompe el flujo (registro / compra).
 *
 * Requiere en Supabase el secret RESEND_API_KEY (y la function `kyma-emails` deployada).
 * No necesita env vars nuevas en Vercel (reusa NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */
export async function sendKymaEmail(
  type: "welcome" | "receipt",
  to: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !to) return;
  try {
    await fetch(`${url}/functions/v1/kyma-emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ type, to, data }),
    });
  } catch {
    // silencioso: el email no debe romper el registro ni la compra
  }
}
