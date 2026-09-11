"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

export function StudioDialog({ title, eyebrow, children, onClose }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const before = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { dialog?.close(); if (before?.isConnected) before.focus(); };
  }, []);
  return <dialog ref={ref} className="studio-dialog panel" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); closeRef.current(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const r = event.currentTarget.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeRef.current();
    }}>
    <div className="studio-dialog-head">
      <div>{eyebrow && <p className="mini-label">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div>
      <button type="button" className="evidence-button quiet" onClick={onClose} aria-label={`Close ${title}`}>Close <span aria-hidden="true">×</span></button>
    </div>
    {children}
  </dialog>;
}
