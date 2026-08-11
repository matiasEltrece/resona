"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkPasswordLeaked } from "@/lib/hibp";

export default function ResetForm() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const [forced, setForced] = useState(false);

  useEffect(() => {
    setForced(new URLSearchParams(window.location.search).get("forced") === "1");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setState("loading"); setError("");
    const { leaked, count } = await checkPasswordLeaked(password);
    if (leaked) {
      setError(`Esta contraseña apareció en ${count.toLocaleString("es-AR")} filtraciones de datos conocidas. Elegí otra.`);
      setState("idle");
      return;
    }
    const supabase = createClient();
    // Si venía de un reset forzado por HIBP, limpiamos el flag en el mismo request.
    const { error: err } = await supabase.auth.updateUser({
      password,
      data: { needs_password_reset: false },
    });
    if (err) {
      setError("No se pudo actualizar (el link puede haber expirado). Pedí uno nuevo desde «¿La olvidaste?».");
      setState("idle");
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {forced && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ background: "var(--accent-soft)", color: "var(--c-text-2)" }}>
          Detectamos que tu contraseña apareció en una filtración de datos conocida. Por tu seguridad, elegí una nueva antes de continuar.
        </p>
      )}
      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-xs uppercase tracking-widest" style={{ color: "var(--c-text-3)" }}>Nueva contraseña</label>
        <input
          id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" required minLength={6} autoFocus autoComplete="new-password"
          className="kp-field"
        />
      </div>
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit" disabled={state === "loading" || !password}
        className="kp-submit"
      >
        {state === "loading" ? "Guardando…" : "Guardar y entrar"}
      </button>
    </form>
  );
}
