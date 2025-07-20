import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { HydrationProvider } from '@/components/providers/HydrationProvider'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ZyxAI - AI Voice Agent CRM',
  description: 'Enterprise AI Voice Agent CRM for wholesalers',
  keywords: ['AI', 'Voice Agent', 'CRM', 'Wholesale', 'Business'],
  authors: [{ name: 'ZyxAI Team' }],
  creator: 'ZyxAI',
  publisher: 'ZyxAI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  openGraph: {
    title: 'ZyxAI - AI Voice Agent CRM',
    description: 'Enterprise AI Voice Agent CRM for wholesalers',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZyxAI - AI Voice Agent CRM',
    description: 'Enterprise AI Voice Agent CRM for wholesalers',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <HydrationProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <AuthProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </HydrationProvider>
      </body>
    </html>
  )
}
