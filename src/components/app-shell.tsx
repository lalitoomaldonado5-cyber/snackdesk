"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wallet,
  ReceiptText,
  Settings,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  ArrowUpRight,
} from "lucide-react";
import { logout } from "@/services/auth";
import { initials } from "@/lib/format";
import { Brand } from "./design/brand";
import { Dropdown, Modal } from "./design/primitives";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/events", label: "Eventos", icon: CalendarDays },
  { href: "/payments", label: "Pagos", icon: Wallet },
  { href: "/expenses", label: "Gastos", icon: ReceiptText },
  { href: "/settings", label: "Configuración", icon: Settings },
];
type ShellProps = {
  businessName: string;
  userName: string;
  role: string;
  logoSrc: string | null;
  children: React.ReactNode;
  preview?: boolean;
};
function Navigation({
  businessName,
  logoSrc,
  preview,
  routePath,
  close,
}: Pick<ShellProps, "businessName" | "logoSrc" | "preview"> & {
  routePath: string;
  close?: () => void;
}) {
  return (
    <div className="sd-navigation">
      <Link
        href={preview ? "/demo" : "/dashboard"}
        className="sd-sidebar-brand"
        onClick={close}
      >
        <Brand />
      </Link>
      <div className="sd-workspace">
        <div className="sd-workspace-icon">
          {logoSrc ? (
            <Image
              unoptimized
              src={logoSrc}
              alt="Logo del negocio"
              width={35}
              height={35}
            />
          ) : (
            initials(businessName)
          )}
        </div>
        <div>
          <strong title={businessName}>{businessName}</strong>
          <small>Tu espacio de trabajo</small>
        </div>
      </div>
      <span className="sd-nav-label">MI NEGOCIO</span>
      <nav aria-label="Navegación principal" className="sd-nav-links">
        {navigation.map((item) => {
          const active = routePath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={
                preview
                  ? `/demo${item.href === "/dashboard" ? "" : item.href}`
                  : item.href
              }
              className={`sd-nav-item ${active ? "active" : ""} ${item.href === "/settings" ? "settings" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={close}
            >
              <item.icon size={18} strokeWidth={1.5} aria-hidden="true" />
              {item.label}
              {active && <ChevronRight size={13} aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>
      <div className="sd-sidebar-footer">
        <p>
          El orden detrás
          <br />
          de cada celebración.
        </p>
        <small>Tu negocio, en orden.</small>
      </div>
    </div>
  );
}
export function AppShell({
  businessName,
  userName,
  role,
  logoSrc,
  children,
  preview = false,
}: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const routePath = preview
    ? pathname.replace(/^\/demo/, "") || "/dashboard"
    : pathname;
  const current =
    navigation.find((item) => routePath.startsWith(item.href)) || navigation[0];
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);
  return (
    <div className="app-shell shell-v2">
      <a href="#main-content" className="sd-skip">
        Saltar al contenido
      </a>
      <aside className="sd-sidebar">
        <Navigation
          businessName={businessName}
          logoSrc={logoSrc}
          preview={preview}
          routePath={routePath}
        />
      </aside>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tu espacio de trabajo"
        className="sd-drawer"
      >
        <Navigation
          businessName={businessName}
          logoSrc={logoSrc}
          preview={preview}
          routePath={routePath}
          close={() => setOpen(false)}
        />
      </Modal>
      <header className="sd-topbar">
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-haspopup="dialog"
          className="sd-icon-button sd-mobile-toggle"
          onClick={() => setOpen(true)}
        >
          <Menu size={21} />
        </button>
        <div className="sd-breadcrumb">
          <span>{businessName}</span>
          <ChevronRight size={12} aria-hidden="true" />
          <strong>{current.label}</strong>
        </div>
        <Dropdown
          label={
            <>
              <span className="sd-user-avatar" aria-hidden="true">
                {initials(userName)}
              </span>
              <span className="sd-user-details">
                <span className="sd-user-name">{userName}</span>
                <span className="sd-user-role">
                  {role === "owner" ? "Propietario" : "Miembro"}
                </span>
              </span>
              <span className="sr-only">Opciones de cuenta de {userName}</span>
              <ChevronDown size={13} aria-hidden="true" />
            </>
          }
        >
          <Link href={preview ? "/demo/settings" : "/settings"}>
            <Settings size={16} />
            Configuración
          </Link>
          {preview ? (
            <Link href="/login">
              <ArrowUpRight size={16} />
              Ir a mi cuenta
            </Link>
          ) : (
            <form action={logout}>
              <button type="submit">
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </form>
          )}
        </Dropdown>
      </header>
      {preview && (
        <div className="sd-preview-banner">
          Vista de ejemplo · Los datos son ficticios y no se guardan cambios.
          <Link href="/login">Ir a mi cuenta</Link>
        </div>
      )}
      <main id="main-content" tabIndex={-1} className="content">
        {children}
      </main>
    </div>
  );
}
