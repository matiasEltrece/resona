/**
 * Check client-side contra HaveIBeenPwned (k-anonymity API).
 * El password NUNCA sale del browser: solo mandamos los primeros 5 chars
 * del hash SHA-1 y comparamos el resto localmente.
 *
 * Devuelve { leaked: boolean, count: number } — count = veces que apareció
 * en filtraciones conocidas. Fail-open: si HIBP no responde o falla la red,
 * dejamos pasar (no queremos romper signups por un servicio de terceros caído).
 */
export async function checkPasswordLeaked(password: string): Promise<{ leaked: boolean; count: number }> {
  if (typeof window === "undefined") throw new Error("client-only");
  if (!password) return { leaked: false, count: 0 };

  const enc = new TextEncoder().encode(password);
  const hashBuf = await crypto.subtle.digest("SHA-1", enc);
  const hashHex = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: ctrl.signal,
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return { leaked: false, count: 0 };
    const body = await res.text();
    for (const line of body.split("\n")) {
      const [suf, count] = line.trim().split(":");
      if (suf?.toUpperCase() === suffix) {
        return { leaked: true, count: parseInt(count || "0", 10) };
      }
    }
    return { leaked: false, count: 0 };
  } catch {
    return { leaked: false, count: 0 };
  } finally {
    clearTimeout(t);
  }
}
