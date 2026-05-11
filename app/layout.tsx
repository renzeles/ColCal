import type { Metadata, Viewport } from "next";
import { IPhoneInstallPopup } from "@/components/IPhoneInstallPopup";
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
        {children}
        <IPhoneInstallPopup />
      </body>
    </html>
  );
}
