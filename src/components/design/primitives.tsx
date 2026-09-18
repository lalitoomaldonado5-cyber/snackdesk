"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  X,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
}) {
  return <button className={`sd-button ${variant} ${className}`} {...props} />;
}
export function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`sd-card ${className}`} {...props}>
      {children}
    </section>
  );
}
export function Alert({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "success" | "error";
}) {
  const Icon = tone === "success" ? CheckCircle2 : CircleAlert;
  return (
    <div
      className={`sd-alert ${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
export function EmptyState({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="sd-empty">
      <CalendarDays size={24} strokeWidth={1.3} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <Link className="sd-text-link" href={href}>
          {label}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`sd-skeleton ${className}`} aria-hidden="true" />;
}
export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  return (
    <span className="sd-tooltip-wrap">
      {children}
      <span className="sd-tooltip" aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
  closeLabel = "Cerrar menú",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`sd-modal sd-v2 ${className}`}
      aria-labelledby={id}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sd-modal-body">
        <div className="sd-modal-heading">
          <h2 id={id}>{title}</h2>
          <button
            type="button"
            className="sd-icon-button"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
/** Native disclosure: Tab/Enter/Space work without pretending to be an ARIA menu. */
export function Dropdown({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function close(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node))
        ref.current?.removeAttribute("open");
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <details
      className="sd-dropdown"
      ref={ref}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          ref.current?.removeAttribute("open");
          ref.current?.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>{label}</summary>
      <div className="sd-dropdown-content">{children}</div>
    </details>
  );
}
