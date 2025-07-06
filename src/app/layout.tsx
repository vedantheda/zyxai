import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthProvider";
import { GlobalErrorBoundary } from "@/components/providers/ErrorBoundaryProvider";
import { AuthErrorProvider } from "@/components/ui/AuthErrorBoundary";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { ToastProvider } from "@/components/ui/toast";


const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});
export const metadata: Metadata = {
  title: "ZyxAI - AI Voice-Powered Business Automation Platform",
  description:
    "Enterprise-grade business automation platform powered by advanced AI voice technology. Streamline operations, automate workflows, and enhance customer interactions through intelligent voice assistants.",
  keywords: [
    "AI voice automation",
    "business automation",
    "voice AI platform",
    "workflow automation",
    "AI voice assistants",
    "enterprise automation",
    "Vapi integration",
    "Eleven Labs",
  ],
  authors: [{ name: "ZyxAI" }],
  creator: "ZyxAI",
  publisher: "ZyxAI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zyxai.app",
    title: "ZyxAI - AI Voice-Powered Business Automation Platform",
    description:
      "Enterprise-grade business automation platform powered by advanced AI voice technology. Streamline operations and enhance customer interactions.",
    siteName: "ZyxAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZyxAI - AI Voice-Powered Business Automation Platform",
    description:
      "Enterprise-grade business automation platform powered by advanced AI voice technology. Streamline operations and enhance customer interactions.",
    creator: "@zyxai",
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
      <head>
      </head>
      <body className={`${dmSans.variable} font-sans`}>
        <GlobalErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <AuthErrorProvider>
              <AuthProvider>
                <NotificationProvider>
                  <ToastProvider>

                    {children}
                  </ToastProvider>
                </NotificationProvider>
              </AuthProvider>
            </AuthErrorProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
