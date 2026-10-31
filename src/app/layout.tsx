import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { appBaseUrl } from "@/server/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: appBaseUrl(),
  title: { default: "HedeflerBir", template: "%s · HedeflerBir" },
  description: "HedeflerBir öğrenme platformu: eğitimler, ödevler ve mentorluk tek yerde.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // next-themes sets the theme class on <html> from a blocking inline script before first paint
    // (no flash); suppressHydrationWarning covers that pre-hydration attribute change.
    <html lang="tr" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="hedeflerbir-theme"
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
