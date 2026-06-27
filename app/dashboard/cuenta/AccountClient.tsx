"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AccountClient({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  // Cambiar contraseña
  const [pw, setPw] = useState("");
  const [pwState, setPwState] = useState<"idle" | "loading">("idle");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Cambiar email
  const [newEmail, setNewEmail] = useState("");
  const [emState, setEmState] = useState<"idle" | "loading">("idle");
  const [emMsg, setEmMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Eliminar cuenta
  const [confirmDel, setConfirmDel] = useState("");
  const [delState, setDelState] = useState<"idle" | "loading">("idle");
  const [delErr, setDelErr] = useState("");

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { setPwMsg({ ok: false, text: "Mínimo 6 caracteres." }); return; }
    setPwState("loading"); setPwMsg(null);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setPwState("idle");
    if (error) setPwMsg({ ok: false, text: "No se pudo actualizar." });
    else { setPwMsg({ ok: true, text: "Contraseña actualizada." }); setPw(""); }
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmState("loading"); setEmMsg(null);
    const { error } = await createClient().auth.updateUser({ email: newEmail.trim().toLowerCase() });
    setEmState("idle");
    if (error) setEmMsg({ ok: false, text: "No se pudo iniciar el cambio." });
    else { setEmMsg({ ok: true, text: "Te enviamos un email al nuevo correo para confirmar el cambio." }); setNewEmail(""); }
  };

  const deleteAccount = async () => {
    if (confirmDel !== "ELIMINAR") return;
    setDelState("loading"); setDelErr("");
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (res.ok) { window.location.href = "/"; return; }
    const d = await res.json().catch(() => ({}));
    setDelErr(d.error ?? "No se pudo eliminar la cuenta.");
    setDelState("idle");
  };

  const fieldCls = "w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-accent placeholder:text-muted/40 transition-all";

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-2xl font-bold">Tu cuenta</h1>
        <p className="text-muted text-sm mt-1">{email}</p>
      </div>

      {/* Cambiar contraseña */}
      <form onSubmit={changePassword} className="glass rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold">Cambiar contraseña</h2>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nueva contraseña" minLength={6} autoComplete="new-password" className={fieldCls} />
        {pwMsg && <p className={`text-xs rounded-lg px-3 py-2 ${pwMsg.ok ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>{pwMsg.text}</p>}
        <button type="submit" disabled={pwState === "loading" || !pw} className="btn-accent rounded-xl px-5 py-2 text-sm font-semibold">
          {pwState === "loading" ? "Guardando…" : "Actualizar contraseña"}
        </button>
      </form>

      {/* Cambiar email */}
      <form onSubmit={changeEmail} className="glass rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold">Cambiar email</h2>
        <p className="text-sm text-muted">Te mandamos un link de confirmación al nuevo correo.</p>
        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nuevo@email.com" required className={fieldCls} />
        {emMsg && <p className={`text-xs rounded-lg px-3 py-2 ${emMsg.ok ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>{emMsg.text}</p>}
        <button type="submit" disabled={emState === "loading" || !newEmail.trim()} className="btn-accent rounded-xl px-5 py-2 text-sm font-semibold">
          {emState === "loading" ? "Enviando…" : "Cambiar email"}
        </button>
      </form>

      {/* Eliminar cuenta */}
      <div className="glass rounded-2xl p-6 space-y-3 border border-red-500/20">
        <h2 className="font-semibold text-red-400">Eliminar cuenta</h2>
        {isAdmin ? (
          <p className="text-sm text-muted">La cuenta admin no se puede eliminar desde acá.</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              Esto borra tu cuenta, tus voces guardadas y tus datos. <strong>No se puede deshacer.</strong> Escribí <code className="text-red-400">ELIMINAR</code> para confirmar.
            </p>
            <input value={confirmDel} onChange={(e) => setConfirmDel(e.target.value)} placeholder="ELIMINAR" className={fieldCls} />
            {delErr && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{delErr}</p>}
            <button onClick={deleteAccount} disabled={confirmDel !== "ELIMINAR" || delState === "loading"}
              className="rounded-xl px-5 py-2 text-sm font-semibold bg-red-500/90 hover:bg-red-500 text-white disabled:opacity-40 transition-colors">
              {delState === "loading" ? "Eliminando…" : "Eliminar mi cuenta"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
