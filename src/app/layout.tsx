import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Snackdesk · Tu negocio, en orden",
    template: "%s · Snackdesk",
  },
  description:
    "Un espacio sencillo para administrar los clientes, eventos y números de tu negocio.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
