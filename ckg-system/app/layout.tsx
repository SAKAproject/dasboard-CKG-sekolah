import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sistem CKG — Cek Kesehatan Gratis',
  description:
    'Sistem Informasi Cek Kesehatan Gratis (CKG) untuk anak sekolah SD/MI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  )
}
