import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClientBody } from "./ClientBody";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import { ToastProvider } from "@/components/ui/toast";
import { RoutePrefetcher } from "@/components/RoutePrefetcher";
import { HydrationProvider } from "@/components/providers/HydrationProvider";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { SessionTimeoutWarning } from "@/components/security/SessionTimeoutWarning";
import { NavigationPerformanceMonitor } from "@/components/performance/NavigationPerformanceMonitor";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Neuronize - AI-Powered Tax Practice Management",
  description:
    "Enterprise-grade tax practice management platform with AI-powered document processing, automated client onboarding, and intelligent tax form auto-fill capabilities.",
  keywords: [
    "tax practice management",
    "AI tax software",
    "automated tax preparation",
    "document processing",
    "tax practice automation",
    "enterprise tax software",
  ],
  authors: [{ name: "Neuronize" }],
  creator: "Neuronize",
  publisher: "Neuronize",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://neuronize.app",
    title: "Neuronize - AI-Powered Tax Practice Management",
    description:
      "Enterprise-grade tax practice management platform with AI-powered document processing and automated workflows.",
    siteName: "Neuronize",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neuronize - AI-Powered Tax Practice Management",
    description:
      "Enterprise-grade tax practice management platform with AI-powered document processing and automated workflows.",
    creator: "@neuronize",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} font-sans`}>
        <HydrationProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <LoadingProvider>
              <AuthProvider>
                <TRPCProvider>
                  <ToastProvider>
                    <RoutePrefetcher />
                    <NavigationPerformanceMonitor />
                    <SessionTimeoutWarning />
                    <ClientBody>{children}</ClientBody>
                  </ToastProvider>
                </TRPCProvider>
              </AuthProvider>
            </LoadingProvider>
          </ThemeProvider>
        </HydrationProvider>
      </body>
    </html>
  );
}
