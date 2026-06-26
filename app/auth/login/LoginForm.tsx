"use client";

import { useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { brand } from "@/lib/brand";

export default function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  const params = use(searchParams);
  const next = params?.next ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || state === "loading") return;
    setState("loading");
    setError("");

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: callbackUrl.toString() },
    });

    if (err) {
      setError(err.message);
      setState("error");
    } else {
      setState("sent");
    }
  };

  if (state === "sent") {
    return (
      <div className="text-center space-y-3 py-4 fade-up">
        <div className="text-4xl">📬</div>
        <p className="font-semibold">Revisá tu correo</p>
        <p className="text-sm text-muted">
          Enviamos un link a <strong className="text-white">{email}</strong>.
          <br />Hacé clic en él para ingresar.
        </p>
        <button
          onClick={() => { setState("idle"); setEmail(""); }}
          className="text-xs text-muted underline mt-2 hover:text-white transition-colors"
        >
          Usar otro email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs text-muted uppercase tracking-widest">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@ejemplo.com"
          required
          autoFocus
          className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-accent placeholder:text-muted/40 transition-all"
        />
      </div>

      {state === "error" && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading" || !email.trim()}
        className="btn-accent w-full py-3 rounded-xl text-sm font-semibold"
      >
        {state === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Enviando…
          </span>
        ) : (
          "Enviar link mágico ✦"
        )}
      </button>

      <p className="text-center text-xs text-muted">
        Plan gratuito: {brand.free.generationsPerMonth} generaciones / mes
      </p>
    </form>
  );
}
