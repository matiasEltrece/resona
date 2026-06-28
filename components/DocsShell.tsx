"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/* Portal de documentación premium: navbar + sidebar con secciones + main.
   Tema claro/oscuro persistido (localStorage "kyma-theme"). */

const NAV: { group: string; items: { href: string; label: string; badge?: string }[] }[] = [
  {
    group: "Guía",
    items: [
      { href: "/docs", label: "Introducción" },
      { href: "/docs/quickstart", label: "Quickstart" },
      { href: "/docs/autenticacion", label: "Autenticación" },
    ],
  },
  {
    group: "Referencia API",
    items: [
      { href: "/docs/generate", label: "POST /v1/generate" },
      { href: "/docs/errores", label: "Errores" },
      { href: "/docs/api", label: "API interactiva", badge: "Swagger" },
    ],
  },
];

export default function DocsShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const pathname = usePathname();
  useEffect(() => { if (localStorage.getItem("kyma-theme") === "dark") setDark(true); }, []);
  const toggleTheme = () => setDark((d) => { localStorage.setItem("kyma-theme", d ? "light" : "dark"); return !d; });

  const sBtn: React.CSSProperties = { background: "var(--c-btn)", color: "var(--c-btn-text)", borderRadius: 12, fontWeight: 600, padding: "10px 18px", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center" };

  return (
    <div className="kyma-premium" data-theme={dark ? "dark" : undefined} style={{ position: "relative", minHeight: "100vh", isolation: "isolate", background: "var(--c-page)", color: "var(--c-text)", fontFamily: "var(--font-body)" }}>
      <div style={{ position: "fixed", inset: 0, background: "var(--c-page)", zIndex: -1 }} aria-hidden />

      <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--c-page)", borderBottom: "1px solid var(--c-border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", height: 72, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "var(--c-text)" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent-grad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><g stroke="#fff" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="9" x2="5" y2="15" /><line x1="10" y1="5" x2="10" y2="19" /><line x1="15" y1="7" x2="15" y2="17" /><line x1="20" y1="10" x2="20" y2="14" /></g></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-head)" }}>Kyma</span>
            <span style={{ fontSize: 12, color: "var(--c-text-3)", marginLeft: 2 }}>docs</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a className="kp-nav" href="/">← Inicio</a>
            <button onClick={toggleTheme} aria-label="Cambiar tema" style={{ width: 38, height: 38, borderRadius: 10, background: "var(--c-surface-2)", border: "1px solid var(--c-border-2)", color: "var(--c-text-2)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {dark ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
            <a href="/studio" style={sBtn}>Empezar gratis</a>
          </div>
        </div>
      </nav>

      <div className="kp-docs-grid">
        <aside className="kp-docs-side">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="kp-docs-grouplabel">{g.group}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {g.items.map((it) => (
                  <a key={it.href} href={it.href} className="kp-docs-link" data-active={pathname === it.href}>
                    {it.label}
                    {it.badge && <span className="kp-docs-badge">{it.badge}</span>}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <main className="kp-docs-main">{children}</main>
      </div>

      <footer style={{ borderTop: "1px solid var(--c-border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "26px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--c-text-3)" }}><strong style={{ color: "var(--c-text-2)" }}>Kyma</strong> · © 2026 · kyma.synthetic.com.ar</span>
          <div style={{ display: "flex", gap: 22 }}>
            <a className="kp-nav" href="/terminos">Términos</a>
            <a className="kp-nav" href="/privacidad">Privacidad</a>
            <a className="kp-nav" href="/studio">Studio</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
