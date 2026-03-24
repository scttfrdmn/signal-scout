import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import './globals.css'

const ALLOWED_DOMAINS = ['playgroundlogic.co', 'enso.co']

export const metadata: Metadata = {
  title: 'Signal Scout — ENSO',
  description: 'Surface organizations at brand inflection moments.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (user) {
    const email = user.primaryEmailAddress?.emailAddress ?? ''
    const allowed = ALLOWED_DOMAINS.some(d => email.endsWith(`@${d}`))
    if (!allowed) {
      redirect('/unauthorized')
    }
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap"
            rel="stylesheet"
          />
        </head>
        <body
          style={{
            fontFamily: "'DM Mono', monospace",
            background: '#ebebeb',
            minHeight: '100vh',
          }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
