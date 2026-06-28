"use client";

import { useEffect, useState } from "react";

/* Marco premium centrado para las pantallas de auth (login, reset). */
export default function PremiumAuth({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { if (localStorage.getItem("kyma-theme") === "dark") setDark(true); }, []);

  return (
    <div className="kyma-premium" data-theme={dark ? "dark" : undefined}
      style={{ position: "relative", minHeight: "100vh", isolation: "isolate", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px", background: "var(--c-page)", color: "var(--c-text)", fontFamily: "var(--font-body)" }}>
      <div style={{ position: "fixed", inset: 0, background: "var(--c-page)", zIndex: -1 }} aria-hidden />
      <div style={{ width: "100%", maxWidth: 420 }}>
        <a href="/" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 11, marginBottom: 24, textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accent-grad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><g stroke="#fff" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="9" x2="5" y2="15" /><line x1="10" y1="5" x2="10" y2="19" /><line x1="15" y1="7" x2="15" y2="17" /><line x1="20" y1="10" x2="20" y2="14" /></g></svg>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-head)", color: "var(--c-text)" }}>Kyma</span>
        </a>

        <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 20, boxShadow: "var(--c-shadow)", padding: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-head)" }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 14, color: "var(--c-text-2)", marginTop: 4, marginBottom: 24 }}>{subtitle}</p>}
          {!subtitle && <div style={{ marginBottom: 24 }} />}
          {children}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--c-text-3)", marginTop: 20 }}>
          Al ingresar aceptás los <a href="/terminos" style={{ color: "var(--accent-solid)" }}>términos</a> y la <a href="/privacidad" style={{ color: "var(--accent-solid)" }}>privacidad</a>.
        </p>
      </div>
    </div>
  );
}
