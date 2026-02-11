"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "../types";
import { normalizeKey } from "../lib/utils";
import {
  brandMarkCandidates,
  brandWideCandidates,
  leagueLogoCandidates,
  platformById,
  platformIconCandidates,
} from "../data";

/* =========================
   Global CSS tokens
   ========================= */

export const AMPERE_GLOBAL_CSS = `
:root{
  --bg0:#050505;
  --surface: rgba(255,255,255,0.05);
  --surface2: rgba(255,255,255,0.08);
  --stroke: rgba(255,255,255,0.10);
  --stroke2: rgba(255,255,255,0.14);
  --text: rgba(255,255,255,0.92);
  --muted: rgba(255,255,255,0.70);
  --muted2: rgba(255,255,255,0.55);
  --accent: rgba(58,167,255,1);
  --r-xl: 22px;
  --r-lg: 18px;
  --r-md: 14px;
  --shadow-lg: 0 20px 90px rgba(0,0,0,0.65);
  --shadow-md: 0 18px 60px rgba(0,0,0,0.55);
  --focus: rgba(58,167,255,0.90);
}
*{ box-sizing:border-box; }
button, a, input { -webkit-tap-highlight-color: transparent; }
.ampere-focus:focus-visible{
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0,0,0,0.55);
}
@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
`;

/* =========================
   Icons
   ========================= */

export function IconChevronDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-1l2-1.5-2-3.5-2.4.7a8 8 0 0 0-1.7-1l-.3-2.5H9l-.3 2.5a8 8 0 0 0-1.7 1L4.6 9l-2 3.5 2 1.5a7.9 7.9 0 0 0 .1 1L2.6 16.5l2 3.5 2.4-.7a8 8 0 0 0 1.7 1l.3 2.5h6l.3-2.5a8 8 0 0 0 1.7-1l2.4.7 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
export function IconLive() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 12a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 12a3.5 3.5 0 0 1 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
export function IconHeart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.6-9.2-9.2C1 7.8 3.5 5 6.6 5c1.8 0 3.3.9 4.2 2.1C11.7 5.9 13.2 5 15 5c3.1 0 5.6 2.8 3.8 6.8C19 16.4 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
export function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function IconReset() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15.4-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 0 1-15.4 6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function IconMic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function IconRemote() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="10" cy="16" r="1" fill="currentColor" />
      <circle cx="14" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

/* =========================
   SmartImg (no broken-image flashes)
   ========================= */

const FAILED_SRC = new Set<string>();
function rememberFailed(src: string) {
  try { FAILED_SRC.add(src); } catch {}
}

export function SmartImg({
  sources,
  alt = "",
  size = 32,
  rounded = 12,
  fit = "cover",
  fill,
  border = true,
  style,
  fallbackText,
}: {
  sources: string[];
  alt?: string;
  size?: number;
  rounded?: number;
  fit?: React.CSSProperties["objectFit"];
  fill?: boolean;
  border?: boolean;
  style?: React.CSSProperties;
  fallbackText?: string;
}) {
  const key = (sources ?? []).filter(Boolean).join("|");
  const [resolved, setResolved] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setResolved(null);

    const candidates = (sources ?? []).filter(Boolean).filter((s) => !FAILED_SRC.has(s));
    if (!candidates.length) return;

    let i = 0;
    const tryNext = () => {
      if (!alive) return;
      if (i >= candidates.length) return;
      const src = candidates[i++];
      const img = new Image();
      img.onload = () => alive && setResolved(src);
      img.onerror = () => { rememberFailed(src); tryNext(); };
      img.src = src;
    };

    tryNext();
    return () => { alive = false; };
  }, [key]);

  if (!resolved) {
    return (
      <span
        aria-hidden="true"
        style={{
          width: fill ? "100%" : size,
          height: fill ? "100%" : size,
          borderRadius: rounded,
          background: "rgba(255,255,255,0.10)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 950,
          color: "rgba(255,255,255,0.75)",
          border: border ? "1px solid rgba(255,255,255,0.10)" : "none",
          ...style,
        }}
      >
        {fallbackText ?? "•"}
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={resolved}
      alt={alt}
      width={fill ? undefined : size}
      height={fill ? undefined : size}
      style={{
        width: fill ? "100%" : size,
        height: fill ? "100%" : size,
        borderRadius: rounded,
        objectFit: fit,
        display: "block",
        border: border ? "1px solid rgba(255,255,255,0.10)" : "none",
        background: "rgba(255,255,255,0.06)",
        ...style,
      }}
    />
  );
}

/* =========================
   Modal (focus trapped)
   ========================= */

export function Modal({
  open,
  title,
  onClose,
  children,
  maxWidth = 980,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const prevBodyOverflowRef = useRef<string>("");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const titleId = useMemo(() => `modal_${normalizeKey(title)}_${Math.random().toString(16).slice(2)}`, [title]);

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = (document.activeElement as HTMLElement) ?? null;
    prevBodyOverflowRef.current = document.body.style.overflow ?? "";
    document.body.style.overflow = "hidden";

    const getFocusable = (root: HTMLElement) => {
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      );
      return nodes.filter((el) => {
        const disabled = (el as HTMLButtonElement).disabled;
        const ariaDisabled = el.getAttribute("aria-disabled") === "true";
        const hidden = el.getAttribute("aria-hidden") === "true";
        return !disabled && !ariaDisabled && !hidden && el.offsetParent !== null;
      });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onCloseRef.current?.(); return; }
      if (e.key === "Tab") {
        const root = panelRef.current;
        if (!root) return;
        const focusables = getFocusable(root);
        if (!focusables.length) { e.preventDefault(); root.focus(); return; }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || !root.contains(active) || active === first) { e.preventDefault(); last.focus(); }
        } else {
          if (!active || !root.contains(active) || active === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    document.addEventListener("keydown", onKey);

    requestAnimationFrame(() => {
      const root = panelRef.current;
      if (!root) return;
      const focusables = getFocusable(root);
      const active = document.activeElement as HTMLElement | null;
      if (active && root.contains(active)) return;
      if (focusables.length) focusables[0].focus();
      else root.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBodyOverflowRef.current ?? "";
      requestAnimationFrame(() => lastActiveRef.current?.focus?.());
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.62)",
        backdropFilter: "blur(10px)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCloseRef.current?.(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          width: `min(${maxWidth}px, 100%)`,
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--stroke)",
          background: "rgba(12,12,12,0.98)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          outline: "none",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "14px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(58,167,255,0.10), rgba(0,0,0,0.00) 60%), rgba(0,0,0,0.35)",
          }}
        >
          <div id={titleId} style={{ fontSize: 18, fontWeight: 950, color: "white" }}>{title}</div>
          <button
            type="button"
            onClick={() => onCloseRef.current?.()}
            className="ampere-focus"
            aria-label="Close modal"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 14, maxHeight: "72vh", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* =========================
   Pills / Chips / Dropdown / Accordion
   ========================= */

export function PillButton({
  label,
  iconSources,
  iconNode,
  active,
  onClick,
  fullWidth,
  multiline,
  ariaLabel,
  subtle,
}: {
  label: string;
  iconSources?: string[];
  iconNode?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  multiline?: boolean;
  ariaLabel?: string;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ampere-focus"
      aria-label={ariaLabel ?? label}
      aria-pressed={!!active}
      style={{
        width: fullWidth ? "100%" : undefined,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 999,
        border: active ? "1px solid rgba(58,167,255,0.38)" : "1px solid var(--stroke)",
        background: active
          ? "linear-gradient(180deg, rgba(58,167,255,0.18), rgba(0,0,0,0.06)), rgba(255,255,255,0.06)"
          : subtle ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
        color: "white",
        cursor: "pointer",
        fontWeight: 950,
        userSelect: "none",
        minWidth: 0,
        position: "relative",
        boxShadow: active ? "0 0 0 1px rgba(58,167,255,0.10) inset" : undefined,
      }}
    >
      {iconNode ? (
        <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
          {iconNode}
        </span>
      ) : iconSources?.length ? (
        <span style={{ flex: "0 0 auto" }}>
          <SmartImg sources={iconSources} size={24} rounded={9} fit="contain" fallbackText={label.slice(0, 1).toUpperCase()} />
        </span>
      ) : (
        <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 9, background: "rgba(255,255,255,0.10)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, flex: "0 0 auto" }}>
          •
        </span>
      )}

      <span
        style={{
          flex: "1 1 auto",
          opacity: 0.95,
          whiteSpace: multiline ? "normal" : "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: multiline ? 1.15 : 1,
          textAlign: "center",
          paddingRight: active ? 16 : 0,
        }}
      >
        {label}
      </span>

      {active ? (
        <span aria-hidden="true" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 10, height: 10, borderRadius: 999, background: "rgba(58,167,255,0.95)", boxShadow: "0 0 0 4px rgba(58,167,255,0.14)" }} />
      ) : null}
    </button>
  );
}

export function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <button
      type="button"
      className="ampere-focus"
      onClick={onRemove}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid rgba(58,167,255,0.22)",
        background: "rgba(58,167,255,0.10)",
        color: "white",
        fontWeight: 950,
        cursor: onRemove ? "pointer" : "default",
        whiteSpace: "nowrap",
      }}
      aria-label={onRemove ? `Remove ${label}` : label}
    >
      <span style={{ opacity: 0.95 }}>{label}</span>
      {onRemove ? <span style={{ opacity: 0.85, fontWeight: 950 }}>✕</span> : null}
    </button>
  );
}

const DropdownCtx = React.createContext<{ close: () => void } | null>(null);

export function Dropdown({
  label,
  iconLeft,
  children,
  minWidth = 280,
}: {
  label: string;
  iconLeft?: React.ReactNode;
  children: React.ReactNode;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const on = (e: MouseEvent) => { if (!ref.current) return; if (!ref.current.contains(e.target as any)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", on);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", on); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="ampere-focus"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 999,
          border: open ? "1px solid rgba(58,167,255,0.26)" : "1px solid var(--stroke)",
          background: open ? "rgba(58,167,255,0.10)" : "rgba(255,255,255,0.04)",
          color: "white",
          cursor: "pointer",
          fontWeight: 950,
          whiteSpace: "nowrap",
          boxShadow: open ? "0 0 0 1px rgba(58,167,255,0.10) inset" : undefined,
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {iconLeft ? <span style={{ display: "inline-flex" }}>{iconLeft}</span> : null}
        <span style={{ opacity: 0.95 }}>{label}</span>
        <IconChevronDown />
      </button>

      {open ? (
        <>
          <div aria-hidden="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", zIndex: 88 }} onMouseDown={() => setOpen(false)} />
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 10px)",
              minWidth,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(10,10,10,0.995)",
              backdropFilter: "blur(16px)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
              zIndex: 89,
            }}
          >
            <DropdownCtx.Provider value={{ close: () => setOpen(false) }}>
              <div style={{ padding: 10, display: "grid", gap: 8 }}>{children}</div>
            </DropdownCtx.Provider>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function MenuItem({
  title,
  subtitle,
  onClick,
  right,
}: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  const ctx = React.useContext(DropdownCtx);

  return (
    <button
      type="button"
      onClick={() => { ctx?.close(); onClick?.(); }}
      className="ampere-focus"
      role="menuitem"
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.10)",
        padding: 12,
        color: "white",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 950, opacity: 0.94 }}>{title}</div>
        {subtitle ? <div style={{ marginTop: 4, fontWeight: 850, opacity: 0.68, fontSize: 12 }}>{subtitle}</div> : null}
      </div>
      {right ? <div style={{ opacity: 0.9, fontWeight: 950 }}>{right}</div> : null}
    </button>
  );
}

export function FilterAccordion({
  title,
  right,
  children,
  defaultOpen,
  isMobile,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isMobile: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => { if (!isMobile) setOpen(true); }, [isMobile]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <button
        type="button"
        onClick={() => (isMobile ? setOpen((s) => !s) : null)}
        className="ampere-focus"
        style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, background: "transparent", border: "none", color: "white", cursor: isMobile ? "pointer" : "default", padding: 0 }}
        aria-expanded={open}
      >
        <span style={{ fontSize: 18, fontWeight: 950 }}>{title}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, opacity: 0.8, fontWeight: 900, fontSize: 13 }}>
          {right}
          {isMobile ? <span style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 120ms ease" }}><IconChevronDown /></span> : null}
        </span>
      </button>
      {open ? children : null}
    </div>
  );
}

/* =========================
   Cards / Grids
   ========================= */

export function Section({
  title,
  rightText,
  onRightClick,
  children,
}: {
  title: string;
  rightText?: string;
  onRightClick?: () => void;
  children: React.ReactNode;
}) {
  const showHeader = !!title || !!rightText;
  if (!showHeader) return <>{children}</>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 950, color: "white" }}>{title}</div>
        {rightText ? (
          <button type="button" onClick={onRightClick} className="ampere-focus" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.76)", cursor: "pointer", fontWeight: 950, fontSize: 13, whiteSpace: "nowrap" }}>
            {rightText}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function CardThumb({ card, heroH, onOpen }: { card: Card; heroH: number; onOpen: (c: Card) => void }) {
  const platform = card.platformId ? platformById(card.platformId) : undefined;
  const badgeRight = card.badgeRight ?? platform?.label ?? card.platformLabel ?? "";

  const platformWatermarkSources = card.platformId
    ? [...platformIconCandidates(card.platformId), ...brandWideCandidates()]
    : [...brandWideCandidates(), ...brandMarkCandidates()];

  const leagueSources = leagueLogoCandidates(card.league);
  const platformIcon = card.platformId ? platformIconCandidates(card.platformId) : [];

  return (
    <button type="button" onClick={() => onOpen(card)} className="ampere-focus" style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", borderRadius: 18, overflow: "hidden" }}>
      <div style={{ position: "relative", height: heroH, background: "radial-gradient(900px 260px at 30% 0%, rgba(58,167,255,0.18), rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.20))" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.22, pointerEvents: "none", display: "grid", placeItems: "center", padding: 16 }}>
          <SmartImg sources={platformWatermarkSources} size={900} rounded={0} border={false} fit="contain" fill style={{ filter: "saturate(0.95) contrast(1.05)" }} fallbackText="AMPÈRE" />
        </div>

        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 8 }}>
          {card.badge ? (
            <span style={{ padding: "5px 9px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", background: card.badge === "LIVE" ? "rgba(255,72,72,0.22)" : card.badge === "UPCOMING" ? "rgba(58,167,255,0.20)" : "rgba(255,255,255,0.12)", color: "white", fontWeight: 950, fontSize: 11, letterSpacing: 0.6 }}>
              {card.badge}
            </span>
          ) : null}
        </div>

        <div style={{ position: "absolute", top: 8, right: 8 }}>
          {badgeRight ? (
            <span style={{ padding: "5px 9px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.40)", color: "white", fontWeight: 950, fontSize: 11, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={badgeRight}>
              {badgeRight}
            </span>
          ) : null}
        </div>

        <div style={{ position: "absolute", left: 10, bottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
          {leagueSources.length ? <SmartImg sources={leagueSources} size={26} rounded={10} fit="contain" fallbackText={(card.league ?? "L")[0]} /> : null}
          {platformIcon.length ? <SmartImg sources={platformIcon} size={26} rounded={10} fit="contain" fallbackText={(platform?.label ?? "P")[0]} /> : null}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ color: "white", fontWeight: 950, fontSize: 15, lineHeight: 1.15 }}>{card.title}</div>
        {card.subtitle ? <div style={{ color: "rgba(255,255,255,0.72)", marginTop: 4, fontWeight: 850, fontSize: 12 }}>{card.subtitle}</div> : null}
        {card.metaLeft || card.metaRight ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 8, color: "rgba(255,255,255,0.55)", fontWeight: 900, fontSize: 11 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.metaLeft ?? ""}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.metaRight ?? ""}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}

export function CardGrid({ cards, cardMinW, heroH, onOpen, skeleton }: { cards: Card[]; cardMinW: number; heroH: number; onOpen: (c: Card) => void; skeleton?: boolean }) {
  if (skeleton) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cardMinW}px, 1fr))`, gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
            <div style={{ height: heroH, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ padding: 12, display: "grid", gap: 8 }}>
              <div style={{ height: 14, background: "rgba(255,255,255,0.08)", borderRadius: 8 }} />
              <div style={{ height: 12, width: "70%", background: "rgba(255,255,255,0.06)", borderRadius: 8 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cardMinW}px, 1fr))`, gap: 12 }}>
      {cards.map((c) => <CardThumb key={c.id} card={c} heroH={heroH} onOpen={onOpen} />)}
      {!cards.length ? <div style={{ opacity: 0.75, fontWeight: 950 }}>No items.</div> : null}
    </div>
  );
}

export function PagedCardGrid({ cards, cardMinW, heroH, onOpen, pageSize = 24 }: { cards: Card[]; cardMinW: number; heroH: number; onOpen: (c: Card) => void; pageSize?: number }) {
  const [shown, setShown] = useState(pageSize);
  useEffect(() => setShown(pageSize), [cards, pageSize]);

  const slice = cards.slice(0, shown);
  const more = shown < cards.length;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <CardGrid cards={slice} cardMinW={cardMinW} heroH={heroH} onOpen={onOpen} />
      {more ? (
        <button type="button" onClick={() => setShown((n) => Math.min(cards.length, n + pageSize))} className="ampere-focus" style={{ padding: "12px 14px", borderRadius: 16, border: "1px solid rgba(58,167,255,0.22)", background: "rgba(58,167,255,0.10)", color: "white", fontWeight: 950, cursor: "pointer", width: "100%" }}>
          Load more ({slice.length}/{cards.length})
        </button>
      ) : null}
    </div>
  );
}
