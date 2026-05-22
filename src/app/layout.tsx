import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthSessionProvider } from '@/components/providers/SessionProvider'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Agency OS — Управление агентством',
  description: 'Платформа управления маркетинговым агентством: клиенты, проекты, команда, финансы.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased bg-background text-foreground">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
