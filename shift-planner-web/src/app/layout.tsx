import type { Metadata } from "next";
import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Providers } from "@/components/providers";
import { ColorSchemeScript } from "@mantine/core";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="tr" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={`${spaceGrotesk.className} antialiased selection:bg-primary/30`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
