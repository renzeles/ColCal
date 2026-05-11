import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenddi",
  description: "Crea y envía eventos directamente a Google Calendar u Outlook.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5efe2",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#f5efe2] text-stone-900 antialiased">
        {/* Mobile-only top banner */}
        <Link
          href="/for-iphone"
          className="sm:hidden block text-center bg-[#fbf6ee] border-b border-[#8b5a3c]/15 py-1.5 text-[11px] font-bold tracking-wider uppercase text-[#8b5a3c] hover:bg-[#f5e9d4] transition-colors"
        >
          📱 For iPhone — install guide ↗
        </Link>
        {children}
        {/* Desktop footer link */}
        <footer className="hidden sm:block text-center py-6 px-4">
          <Link
            href="/for-iphone"
            className="text-[11px] font-semibold tracking-wider uppercase text-stone-400 hover:text-[#8b5a3c] transition-colors"
          >
            for iPhone ↗
          </Link>
        </footer>
      </body>
    </html>
  );
}
