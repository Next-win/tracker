import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bericht van familie",
  description: "Een bericht van je familie",
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
