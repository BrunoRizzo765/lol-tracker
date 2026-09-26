import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "LoL Friends Tracker",
  description: "Quién está en partida, el rango de cada uno y el historial del grupo.",
};

export const viewport: Viewport = {
  themeColor: "#05070d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${display.variable}`}>
      <body>
        <div className="ambient" aria-hidden />
        {children}
      </body>
    </html>
  );
}
