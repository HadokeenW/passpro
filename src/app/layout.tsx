import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/business/Toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PASSPro — Gestion de club & Contrôle d'accès RFID",
  description: "Solution on-premise de gestion de club de fitness et contrôle d'accès RFID temps réel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased font-sans min-h-screen bg-[#F6F8FB] text-[#0F172A]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
