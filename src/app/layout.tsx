import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Adamrit HMS - Hospital Management System',
  description: 'Hope Hospital - Historical Data Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Hope Hospital — Historical Data
                  </h1>
                </div>
              </header>
              <main className="flex-1 overflow-auto bg-gray-50 p-6">
                {children}
              </main>
              <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
                <a href="https://drmhope.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">drmhope.com</a> | A Bettroi Product
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}