"use client";

import { useEffect, useState } from "react";
import { useBrand } from "@/components/BrandProvider";

/* Marco premium centrado para las pantallas de auth (login, reset). */
export default function PremiumAuth({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const { logoCompactUrl } = useBrand();
  useEffect(() => { if (localStorage.getItem("kyma-theme") === "dark") setDark(true); }, []);

  return (
    <div className="kyma-premium" data-theme={dark ? "dark" : undefined}
      style={{ position: "relative", minHeight: "100vh", isolation: "isolate", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px", background: "var(--c-page)", color: "var(--c-text)", fontFamily: "var(--font-body)" }}>
      <div style={{ position: "fixed", inset: 0, background: "var(--c-page)", zIndex: -1 }} aria-hidden />
      <div style={{ width: "100%", maxWidth: 420 }}>
        <a href="/" style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 24, textDecoration: "none" }}>
          <img src={logoCompactUrl} alt="Kyma" style={{ height: 34, width: "auto" }} />
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
