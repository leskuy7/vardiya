import type { Metadata } from "next";
import "./globals.css";
import "@mantine/core/styles.css";
import { Providers } from "@/components/providers";
import { ColorSchemeScript } from "@mantine/core";

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
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className="antialiased selection:bg-primary/30">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
