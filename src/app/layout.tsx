import '../styles/globals.css'
import { Inter } from 'next/font/google'

import { seo } from '@/configs'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  ...seo
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang='en'>
      <body
        className={`bg-backgroundPrimary w-screen h-screen px-20 py-24 text-white ${inter.className}`}
      >
        {children}
      </body>
    </html>
  )
}
