"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { C, F } from "@/lib/theme";
import { useConfig } from "@/hooks/useConfig";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/venues", label: "Venues" },
  { href: "/guests", label: "Guests" },
  { href: "/budget", label: "Budget" },
  { href: "/timeline", label: "Timeline" },
  { href: "/vendors", label: "Vendors" },
  { href: "/digest", label: "Digest" },
  { href: "/settings", label: "Settings" },
];

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { config } = useConfig();

  // The login screen renders without the app chrome (no nav / header).
  if (pathname === "/login") {
    return <div style={{ minHeight: "100vh", background: C.bg }}>{children}</div>;
  }

  const couple =
    config?.partner1Name || config?.partner2Name
      ? `${config?.partner1Name ?? ""} & ${config?.partner2Name ?? ""}`
      : "Our Wedding";
  const where = [config?.venue, config?.location].filter(Boolean).join(", ");

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "18px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{ font: `600 26px ${F.display}`, color: C.ink, margin: 0 }}>{couple}</h1>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <div style={{ color: C.inkSoft, fontSize: 14 }}>
                {config?.date ? config.date : "Set your date"}
                {where ? ` · ${where}` : ""}
              </div>
              <button
                onClick={logout}
                style={{ background: "transparent", border: "none", color: C.inkSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline" }}
              >
                Log out
              </button>
            </div>
          </div>
          <nav aria-label="Primary" className="wp-nav">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "10px 10px 0 0",
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    color: active ? C.primary : C.inkSoft,
                    borderBottom: `3px solid ${active ? C.primary : "transparent"}`,
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}>
        {children}
      </main>
    </div>
  );
}
