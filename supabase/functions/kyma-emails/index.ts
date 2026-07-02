// Kyma · Edge Function de emails transaccionales (welcome + recibo de compra).
// Se llama con el service role key (Authorization: Bearer). Envía vía Resend.
// Secret requerido en Supabase: RESEND_API_KEY  (y opcional KYMA_FROM_EMAIL).
//   supabase secrets set RESEND_API_KEY=<tu key>
// Deploy: se hace por MCP / `supabase functions deploy kyma-emails`.

const FROM = Deno.env.get("KYMA_FROM_EMAIL") ?? "Kyma <noreply@kyma.synthetic.com.ar>";
const SITE = "https://kyma.synthetic.com.ar";

const shell = (title: string, body: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f1f3;margin:0;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 3px rgba(18,17,24,.08);">
<tr><td style="height:4px;background:linear-gradient(115deg,#ecd49a,#c79a45);font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:40px 44px 8px;"><div style="font-size:26px;font-weight:800;letter-spacing:-.02em;color:#131218;">Kyma</div></td></tr>
<tr><td style="padding:8px 44px 0;"><h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#131218;font-weight:800;">${title}</h1>${body}</td></tr>
<tr><td style="padding:28px 44px 40px;"><hr style="border:none;border-top:1px solid rgba(18,17,24,.09);margin:22px 0 16px;">
<p style="margin:0;font-size:12px;line-height:1.6;color:#9b99a6;">Kyma · <a href="${SITE}" style="color:#9b99a6;">kyma.synthetic.com.ar</a></p></td></tr>
</table></td></tr></table>`;

const btn = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="border-radius:12px;background:#15141a;"><a href="${href}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;border-radius:12px;">${label}</a></td></tr></table>`;

function render(type: string, data: Record<string, unknown>): { subject: string; html: string } {
  if (type === "welcome") {
    return {
      subject: "¡Bienvenido/a a Kyma!",
      html: shell("Tu cuenta está lista 🎉",
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#605e6c;">Ya podés clonar, diseñar y generar voces con IA. Tu plan gratuito incluye <strong style="color:#131218;">10.000 caracteres por mes</strong>, sin tarjeta.</p>
         ${btn(SITE + "/studio", "Ir al estudio →")}
         <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#9b99a6;">Grabá 10 segundos de audio para clonar tu voz, o diseñá una desde cero ajustando tono, edad y carácter.</p>`),
    };
  }
  if (type === "receipt") {
    const kind = String(data.kind ?? "plan");
    const amount = data.amount != null ? `US$ ${data.amount}` : "";
    if (kind === "pack") {
      const chars = Number(data.chars ?? 0).toLocaleString("es-AR");
      return {
        subject: "Tu compra en Kyma — caracteres extra",
        html: shell("¡Gracias por tu compra! 🙌",
          `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#605e6c;">Sumamos <strong style="color:#131218;">${chars} caracteres</strong> a tu cuenta ${amount ? `(${amount})` : ""}. No vencen: se usan cuando agotás el cupo mensual de tu plan.</p>
           ${btn(SITE + "/dashboard", "Ver mi cuenta →")}`),
      };
    }
    const plan = String(data.plan ?? "");
    return {
      subject: `Tu plan ${plan || ""} en Kyma está activo`.trim(),
      html: shell("¡Gracias por sumarte! 🎉",
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#605e6c;">Tu plan <strong style="color:#131218;">${plan || "pago"}</strong> ${amount ? `(${amount}/mes) ` : ""}ya está activo. Audios sin marca de agua, licencia comercial y más caracteres por mes.</p>
         ${btn(SITE + "/studio", "Empezar a crear →")}
         <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#9b99a6;">Gestioná tu suscripción desde el panel, cuando quieras.</p>`),
    };
  }
  return { subject: "Kyma", html: shell("Kyma", "<p>—</p>") };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const RESEND = Deno.env.get("RESEND_API_KEY");
  if (!RESEND) return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada" }), { status: 500 });

  let body: { type?: string; to?: string; data?: Record<string, unknown> };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 }); }
  const { type, to, data } = body;
  if (!type || !to) return new Response(JSON.stringify({ error: "Faltan 'type' o 'to'" }), { status: 400 });

  const { subject, html } = render(type, data ?? {});
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  const out = await res.text();
  return new Response(out, { status: res.ok ? 200 : res.status, headers: { "Content-Type": "application/json" } });
});
