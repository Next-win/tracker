import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nieuwe website preview",
  description: "Bekijk de preview van onze nieuwe website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
