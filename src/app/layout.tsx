import '../styles/globals.css'
import { Inter } from 'next/font/google'
import React from 'react'

import { seo } from '@/configs'
import { MouseFollower } from '@/components'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  ...seo
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang='en'>
      <body
        className={`bg-backgroundPrimary w-screen px-20 py-24 h-screen text-white ${inter.className}`}
      >
        <React.Fragment>
          <MouseFollower />
          {children}
        </React.Fragment>
      </body>
    </html>
  )
}
