import Link from "next/link";
import { ArrowLeft, Inbox, Plus } from "lucide-react";
import { statuses, type EventStatus } from "@/types/domain";
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  back,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
  back?: string;
}) {
  return (
    <div className="page-heading">
      <div>
        {back && (
          <Link className="back-link" href={back}>
            <ArrowLeft size={15} /> Volver
          </Link>
        )}
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <Link className="button primary" href={action.href}>
          <Plus size={17} />
          {action.label}
        </Link>
      )}
    </div>
  );
}
export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`badge ${status}`}>
      <span />
      {statuses[status]}
    </span>
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
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={24} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <Link href={href} className="button primary">
          <Plus size={16} />
          {label}
        </Link>
      )}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error" | "success";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`notice ${tone}`}
    >
      {children}
    </div>
  );
}
