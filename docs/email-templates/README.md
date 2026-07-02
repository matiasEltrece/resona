# Templates de email de Kyma (Supabase Auth)

HTML branded (dorado Kyma) listo para pegar en **Supabase Dashboard → Authentication → Email Templates**.

| Archivo | Template de Supabase | Asunto sugerido |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | Confirmá tu cuenta en Kyma |
| `reset-password.html` | **Reset Password** | Restablecé tu contraseña de Kyma |
| `change-email.html` | **Change Email Address** | Confirmá tu nuevo email en Kyma |

Cada archivo tiene arriba un comentario con dónde pegarlo y qué variables usa.

## Pasos
1. Supabase Dashboard → tu proyecto → **Authentication → Email Templates**.
2. Elegí el template (ej. *Confirm signup*), pegá el HTML del archivo, poné el asunto sugerido, **Save**.
3. Repetí con los otros dos.

## IMPORTANTE — SMTP propio (si no, caen en spam)
Por defecto Supabase usa un **SMTP compartido** con rate limit bajo y alta chance de spam. Para producción configurá un SMTP propio:

**Supabase → Project Settings → Authentication → SMTP Settings** → activá "Enable Custom SMTP" con [Resend](https://resend.com):
- Host: `smtp.resend.com` · Port: `465` · User: `resend`
- Password: tu **API key de Resend**
- Sender email: `noreply@kyma.synthetic.com.ar` · Sender name: `Kyma`

Antes verificá el dominio `kyma.synthetic.com.ar` en Resend (agrega registros SPF/DKIM en Cloudflare).

## Email de "bienvenida" post-confirmación
Supabase **no** tiene un template nativo de bienvenida. El `confirm-signup.html` ya incluye el mensaje de bienvenida + el free tier, así que alcanza para el arranque. Si más adelante querés un correo de bienvenida separado (tras confirmar) o recibos de compra branded, se hace con una **Edge Function + Resend** disparada por el webhook — se puede armar aparte.
