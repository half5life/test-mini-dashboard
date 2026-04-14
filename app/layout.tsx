import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mini Dashboard',
  description: 'Orders Mini Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-slate-900">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
