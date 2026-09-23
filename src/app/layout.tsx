import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource-variable/manrope";
import "./frontend-v2.css";
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
