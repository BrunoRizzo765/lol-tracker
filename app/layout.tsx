import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoL Friends Dashboard",
  description: "Recent League of Legends matches and statistics for your friends.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
