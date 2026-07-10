import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import { Toaster } from "@/components/ui/toaster";
import { InkBackdrop } from "@/components/brand/ink-backdrop";
import { OfflineBanner } from "@/components/system/offline-banner";
import "./globals.css";

// Serifa de display editorial (opsz alto p/ títulos com contraste).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InkVision — sua próxima tatuagem, visualizada antes da agulha",
    template: "%s · InkVision",
  },
  description:
    "Encontre estúdios e tatuadores, aprove a arte no chat e veja a tatuagem aplicada na sua própria pele com IA. Agende e pague num só lugar.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  appleWebApp: { capable: true, title: "InkVision", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    siteName: "InkVision",
    locale: "pt_BR",
    title: "InkVision — sua próxima tatuagem, visualizada antes da agulha",
    description:
      "Encontre estúdios e tatuadores, aprove a arte no chat e veja a tatuagem na sua pele com IA.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InkVision",
    description:
      "Encontre tatuadores, aprove a arte e veja a tatuagem na sua pele com IA. Agende e pague num só lugar.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#14110e" },
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fraunces.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <InkBackdrop />
        <ThemeProvider>
          <OfflineBanner />
          {children}
        </ThemeProvider>
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
