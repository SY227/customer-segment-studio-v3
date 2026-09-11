"use client";

import { useEffect } from "react";

/** Decorative only. No data access, routing, analytics, or business-state changes. */
export function AtelierChrome() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let active: HTMLElement | null = null;
    let x = 0;
    let y = 0;
    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (active) {
        active.style.removeProperty("--sheen-x");
        active.style.removeProperty("--sheen-y");
        active.style.removeProperty("--portrait-tilt-x");
        active.style.removeProperty("--portrait-tilt-y");
      }
      active = null;
    };
    const move = (event: PointerEvent) => {
      if (reduced.matches || !fine.matches || event.pointerType !== "mouse") return;
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(".segment-card, .guild-header") : null;
      if (target !== active) { reset(); active = target; }
      if (!active) return;
      const rect = active.getBoundingClientRect();
      x = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1)));
      y = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(rect.height, 1)));
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!active) return;
        active.style.setProperty("--sheen-x", `${(x * 100).toFixed(2)}%`);
        active.style.setProperty("--sheen-y", `${(y * 100).toFixed(2)}%`);
        // Only the portrait stage tilts. Metrics, copy and hit areas stay level.
        active.style.setProperty("--portrait-tilt-x", `${((.5 - y) * 3).toFixed(2)}deg`);
        active.style.setProperty("--portrait-tilt-y", `${((x - .5) * 4).toFixed(2)}deg`);
      });
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    reduced.addEventListener("change", reset);
    fine.addEventListener("change", reset);
    return () => {
      reset();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      reduced.removeEventListener("change", reset);
      fine.removeEventListener("change", reset);
    };
  }, []);

  return <div className="atelier-ambient" aria-hidden="true"><i /><i /><i /></div>;
}

/** Nine facets reference the existing nine groups; this is not a new logo dependency. */
export function GuildSeal({ className = "" }: { className?: string }) {
  return (
    <svg className={`guild-seal ${className}`} viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth=".65" />
      <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth=".4" />
      <path d="M50 2V98M2 50H98M16 16L84 84M16 84L84 16" stroke="currentColor" strokeWidth=".45" />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 40} 50 50)`}>
          <path d="M50 14L55 29L50 34L45 29Z" fill="currentColor" opacity={i % 2 ? ".42" : ".9"} />
          <circle cx="50" cy="8" r="1.25" fill="currentColor" />
        </g>
      ))}
      <path d="M50 27L58 42L73 50L58 58L50 73L42 58L27 50L42 42Z" fill="var(--atelier-indigo, #51489a)" />
      <path d="M50 34L54 46L66 50L54 54L50 66L46 54L34 50L46 46Z" fill="#fcf8f0" />
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
    </svg>
  );
}

export function HeaderEngraving() {
  return <div className="header-engraving" aria-hidden="true"><GuildSeal /><span /><span /></div>;
}
