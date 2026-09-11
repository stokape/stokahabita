import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stoka Habita · Demo local",
  description: "Gestión para tu condominio",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
