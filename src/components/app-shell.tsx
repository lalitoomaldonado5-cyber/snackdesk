"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wallet,
  ReceiptText,
  Settings,
  Layers3,
  ChevronRight,
  LogOut,
  Sprout,
  Menu,
} from "lucide-react";
import { logout } from "@/services/auth";
import { initials } from "@/lib/format";
const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/events", label: "Eventos", icon: CalendarDays },
  { href: "/payments", label: "Pagos", icon: Wallet },
  { href: "/expenses", label: "Gastos", icon: ReceiptText },
  { href: "/settings", label: "Configuración", icon: Settings },
];
export function AppShell({
  businessName,
  userName,
  role,
  logoSrc,
  children,
  preview = false,
}: {
  businessName: string;
  userName: string;
  role: string;
  logoSrc: string | null;
  children: React.ReactNode;
  preview?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const routePath = preview
    ? pathname.replace(/^\/demo/, "") || "/dashboard"
    : pathname;
  const current =
    navigation.find((n) => routePath.startsWith(n.href)) || navigation[0];
  return (
    <div className="app-shell">
      <button
        aria-label="Cerrar menú"
        className={`mobile-scrim ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside
        id="sidebar"
        className={`sidebar ${open ? "open" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <Link href={preview ? "/demo" : "/dashboard"} className="brand">
          <span className="brand-mark">
            <Layers3 size={21} />
          </span>
          snackdesk<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-tag">
          <div className="workspace-avatar">
            {logoSrc ? (
              <Image
                unoptimized
                src={logoSrc}
                alt="Logo del negocio"
                width={33}
                height={33}
              />
            ) : (
              initials(businessName)
            )}
          </div>
          <div>
            <strong title={businessName}>{businessName}</strong>
            <small>Mi espacio de trabajo</small>
          </div>
        </div>
        <span className="nav-label">PRINCIPAL</span>
        <nav aria-label="Navegación principal">
          {navigation.map((n) => (
            <Link
              href={
                preview
                  ? `/demo${n.href === "/dashboard" ? "" : n.href}`
                  : n.href
              }
              key={n.href}
              className={`nav-item ${current.href === n.href ? "active" : ""}`}
              aria-current={current.href === n.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <n.icon size={17} strokeWidth={1.7} />
              {n.label}
              {current.href === n.href && (
                <ChevronRight className="nav-arrow" size={13} />
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sprout size={19} color="#869c7c" />
            <strong>Pequeños detalles. Grandes eventos.</strong>
            <p>Tu negocio en orden, para enfocarte en lo que mejor haces.</p>
          </div>
          <div className="version">
            Snackdesk · MVP<span>v0.1</span>
          </div>
        </div>
      </aside>
      <header className="topbar">
        <button
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="sidebar"
          className="icon-button mobile-toggle"
          onClick={() => setOpen(!open)}
        >
          <Menu size={19} />
        </button>
        <div className="breadcrumb">
          <span>{businessName}</span>
          <ChevronRight size={12} />
          <strong>{current.label}</strong>
        </div>
        <div className="user-menu">
          <div className="user-avatar">{initials(userName)}</div>
          <div>
            <div className="user-name">{userName}</div>
            <div className="user-role">
              {role === "owner" ? "Propietario" : "Miembro"}
            </div>
          </div>
          {preview ? (
            <Link
              href="/setup"
              className="icon-button"
              aria-label="Configurar aplicación"
            >
              <LogOut size={15} />
            </Link>
          ) : (
            <form action={logout}>
              <button
                className="icon-button"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={15} />
              </button>
            </form>
          )}
        </div>
      </header>
      {preview && (
        <div className="preview-banner">
          Datos de ejemplo · Esta vista no guarda cambios.
          <Link href="/setup">Conectar mi negocio</Link>
        </div>
      )}
      <main className="content">{children}</main>
    </div>
  );
}
