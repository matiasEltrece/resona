/* Helpers compartidos para las páginas del portal de docs (server components). */

export const h2: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "var(--c-text)", margin: "0 0 14px", fontFamily: "var(--font-head)" };

export function DocHeader({ eyebrow, title, intro }: { eyebrow: string; title: React.ReactNode; intro: string }) {
  return (
    <header style={{ marginBottom: 36 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ width: 22, height: 3, borderRadius: 2, background: "var(--accent-grad)" }} />
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--c-text-3)" }}>{eyebrow}</span>
      </div>
      <h1 style={{ fontSize: "clamp(30px,4vw,42px)", fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "var(--font-head)" }}>{title}</h1>
      <p style={{ marginTop: 12, fontSize: 17, color: "var(--c-text-2)", lineHeight: 1.6 }}>{intro}</p>
    </header>
  );
}

export function Code({ children }: { children: string }) {
  return (
    <pre style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: 14, padding: "18px 20px", overflowX: "auto", fontSize: 12.5, lineHeight: 1.6, fontFamily: "var(--font-mono)", color: "var(--c-text)" }}>
      {children}
    </pre>
  );
}

export function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr style={{ borderTop: "1px solid var(--c-border)" }}>
      <td style={{ padding: "9px 16px 9px 0", verticalAlign: "top", whiteSpace: "nowrap" }}><code style={{ color: "var(--accent-solid)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{k}</code></td>
      <td style={{ padding: "9px 0", fontSize: 14, color: "var(--c-text-2)" }}>{v}</td>
    </tr>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>{children}</tbody></table>;
}

/** Tarjeta-link para la home de docs. */
export function NavCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a href={href} className="kp-card-h" style={{ display: "block", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 16, padding: "20px 22px", textDecoration: "none", boxShadow: "var(--c-shadow-soft)" }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)", margin: "0 0 4px", fontFamily: "var(--font-head)" }}>{title} <span style={{ color: "var(--accent-solid)" }}>→</span></p>
      <p style={{ fontSize: 13.5, color: "var(--c-text-2)", margin: 0, lineHeight: 1.5 }}>{desc}</p>
    </a>
  );
}
