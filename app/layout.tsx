import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import  SessionProvider  from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Wayra App',
  description: 'Sistema integral de gestión de inventarios para Wayra Mecanica Automotriz',
  icons: {
    icon: '/images/WayraNuevoLogo.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className='h-full'>
      <body className={`${inter.className} h-full`}>
        <SessionProvider>
          {children}
          <Toaster 
            position='top-right'
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              }, 
              success: {
                style: {
                  background: '#10B981',
                },
              },
               error: {
                style: {
                  background: '#EF4444',
                },
               },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}