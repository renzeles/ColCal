import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colcal — Calendario colaborativo",
  description: "Tu calendario, compartido con quien quieras.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
