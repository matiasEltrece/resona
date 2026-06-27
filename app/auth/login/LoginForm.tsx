"use client";

import { useState, use } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  const params = use(searchParams);
  const next = params?.next ?? "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setState("loading");
    setError("");
    setInfo("");

    const supabase = createClient();
    const creds = { email: email.trim().toLowerCase(), password };

    if (mode === "signup") {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { data, error: err } = await supabase.auth.signUp({
        ...creds,
        options: { emailRedirectTo: redirectTo },
      });
      if (err) { setError(err.message); setState("idle"); return; }
      // Supabase devuelve identities=[] cuando el email YA tiene cuenta (anti-spam)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError("Ese email ya tiene una cuenta. Probá ingresar (pestaña «Ingresar»).");
        setMode("signin");
        setState("idle");
        return;
      }
      if (data.session) {
        // (Si en algún momento se desactiva la confirmación) → sesión lista
        window.location.href = next;
        return;
      }
      // Confirmación por email activada → avisar que revise el correo
      setInfo("✅ Cuenta creada. Te mandamos un email de confirmación — abrilo y hacé clic en el link para activar tu cuenta y entrar al dashboard.");
      setState("idle");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword(creds);
      if (err) { setError("Email o contraseña incorrectos."); setState("idle"); return; }
      window.location.href = next;
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Tabs registro / ingreso */}
      <div className="flex gap-1 p-1 glass rounded-xl text-sm">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(""); setInfo(""); }}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              mode === m ? "bg-white/10 text-white ring-accent" : "text-muted hover:text-white"
            }`}
          >
            {m === "signin" ? "Ingresar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs text-muted uppercase tracking-widest">Email</label>
        <input
          id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@ejemplo.com" required autoFocus autoComplete="email"
          className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-accent placeholder:text-muted/40 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs text-muted uppercase tracking-widest">Contraseña</label>
        <input
          id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" required minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-accent placeholder:text-muted/40 transition-all"
        />
      </div>

      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      {info && <p className="text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2">{info}</p>}

      <button
        type="submit" disabled={state === "loading" || !email.trim() || !password}
        className="btn-accent w-full py-3 rounded-xl text-sm font-semibold"
      >
        {state === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            {mode === "signup" ? "Creando…" : "Ingresando…"}
          </span>
        ) : (
          mode === "signup" ? "Crear cuenta gratis ✦" : "Ingresar"
        )}
      </button>
    </form>
  );
}
