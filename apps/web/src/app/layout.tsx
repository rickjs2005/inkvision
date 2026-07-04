import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
    { media: "(prefers-color-scheme: dark)", color: "#141416" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
