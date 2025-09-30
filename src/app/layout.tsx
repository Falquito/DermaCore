import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareLink",
  description: "CareLink Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}