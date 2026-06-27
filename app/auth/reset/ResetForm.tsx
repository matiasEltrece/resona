"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetForm() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setState("loading"); setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError("No se pudo actualizar (el link puede haber expirado). Pedí uno nuevo desde «¿La olvidaste?».");
      setState("idle");
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-xs text-muted uppercase tracking-widest">Nueva contraseña</label>
        <input
          id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" required minLength={6} autoFocus autoComplete="new-password"
          className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-accent placeholder:text-muted/40 transition-all"
        />
      </div>
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit" disabled={state === "loading" || !password}
        className="btn-accent w-full py-3 rounded-xl text-sm font-semibold"
      >
        {state === "loading" ? "Guardando…" : "Guardar y entrar"}
      </button>
    </form>
  );
}
