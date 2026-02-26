'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  BedDouble, 
  Calendar, 
  Receipt, 
  BarChart3, 
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'IPD', href: '/ipd', icon: BedDouble },
  { name: 'OPD', href: '/opd', icon: Calendar },
  { name: 'Billing', href: '/billing', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          type="button"
          className="fixed top-4 left-4 z-50 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          onClick={() => setIsOpen(true)}
        >
          <span className="sr-only">Open main menu</span>
          <Menu className="block h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent pathname={pathname} />
          </div>
          <div className="flex-shrink-0 w-14" />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
          <SidebarContent pathname={pathname} />
        </div>
      </div>
    </>
  )
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-slate-900">
        <h1 className="text-xl font-bold text-white">Adamrit HMS</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  }`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}