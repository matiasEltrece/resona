# Email — configuración (entrante + saliente)

Hay **dos necesidades distintas** de email y se resuelven con servicios distintos.
Es la confusión más común, así que va claro:

| Necesidad | Qué es | Servicio | Estado |
|---|---|---|---|
| **Saliente (transaccional)** | Mandar los magic links de login | SMTP (Supabase built-in o Resend) | ✅ funciona (built-in) |
| **Entrante (recibir)** | Que `hola@tudominio` llegue a tu casilla | Cloudflare Email Routing | ⚙️ manual (abajo) |

> ⚠️ **Cloudflare NO envía email**, solo reenvía el que entra. Los magic links
> (saliente) NO pueden salir por Cloudflare — necesitan un SMTP.

---

## 1. Saliente — magic links (lo crítico para que el login funcione)

### Hoy: Supabase built-in (ya activo)
Supabase manda los magic links con su propio servidor. **Funciona out-of-the-box**,
pero tiene límites de tasa (pocos emails/hora) y puede caer en spam a volumen.
Suficiente para beta / lanzamiento suave.

### Para escala: SMTP propio (recomendado antes de crecer)
Conectar un proveedor transaccional en Supabase → **Resend** es el más simple y
tiene tier gratis (3.000 emails/mes). Es **transferible para la venta** (el comprador
usa su propia cuenta Resend + su dominio).

**Pasos:**
1. Crear cuenta gratis en [resend.com](https://resend.com).
2. Agregar y verificar el dominio (Resend te da unos registros DNS — SPF/DKIM —
   que se cargan en Cloudflare). Esto hace que los mails salgan firmados y no caigan en spam.
3. Crear una API key en Resend.
4. En **Supabase → Project Settings → Auth → SMTP Settings**, activar custom SMTP:
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Password: `<la API key de Resend>`
   - Sender: `noreply@tudominio` (debe ser del dominio verificado)
5. Guardar y probar un magic link.

> Alternativas equivalentes: Postmark, Amazon SES, Mailgun. Cualquiera que dé SMTP.

---

## 2. Entrante — dirección profesional (`hola@…`)

Para **recibir** correo en una dirección de marca y reenviarlo a tu Gmail:
**Cloudflare Email Routing** (gratis). Ya está habilitado en la zona.

**Pasos (dashboard de Cloudflare):**
1. Cloudflare → tu dominio → **Email → Email Routing**.
2. En **Destination addresses**, agregar tu Gmail y **verificarlo** (Cloudflare te
   manda un mail de confirmación que tenés que clickear — esto no se puede automatizar).
3. En **Routing rules**, crear: `hola@tudominio` → tu Gmail.
   (O activar **catch-all** para recibir cualquier dirección.)
4. Cloudflare agrega solo los registros MX necesarios.

> La dirección de contacto que muestra la app sale de `lib/brand.ts` (`email`).
> Cambiala ahí y se actualiza en footer, términos y privacidad.

---

## Para la venta
- **Saliente:** el comprador crea su cuenta Resend (o el SMTP que prefiera) con su
  dominio y la configura en SU Supabase. Nada queda atado a nosotros.
- **Entrante:** el comprador configura Email Routing en su propio dominio.
- En el código no hay nada hardcodeado: la dirección de display sale de `brand.ts`
  y el SMTP vive en la config de Supabase (que el comprador recrea).

## Estado actual de Kyma
- ✅ Magic links funcionando (Supabase built-in)
- ⏳ SMTP propio (Resend): pendiente, recomendado antes de abrir a mucho público
- ⏳ Dirección entrante `hola@…`: pendiente (manual en Cloudflare)
