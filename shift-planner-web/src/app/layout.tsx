import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Vardiya Planlayıcı",
  description: "Çalışan Vardiya Planlama Sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark scroll-smooth">
      <body className="antialiased selection:bg-primary/30">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
