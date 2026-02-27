// @ts-nocheck
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
  X,
  ClipboardList,
  FileText,
  Home,
  Stethoscope,
  Pill,
  AlertTriangle,
  DoorOpen,
  UserCheck,
  Activity,
  FlaskConical,
  Scan,
  Package,
  HeartHandshake,
  ShieldCheck,
  Syringe,
  Building2,
  User,
  Scissors
} from 'lucide-react'

const navigationGroups = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Patients', href: '/patients', icon: Users },
    ]
  },
  {
    title: 'IPD',
    items: [
      { name: 'IPD Dashboard', href: '/todays-ipd', icon: BedDouble },
      { name: 'Currently Admitted', href: '/currently-admitted', icon: UserCheck },
      { name: 'Discharged Patients', href: '/discharged-patients', icon: DoorOpen },
      { name: 'Room Management', href: '/room-management', icon: Home },
      { name: 'Accommodation', href: '/accommodation', icon: Home },
      { name: 'Treatment Sheet', href: '/treatment-sheet', icon: ClipboardList },
    ]
  },
  {
    title: 'OPD',
    items: [
      { name: 'OPD Dashboard', href: '/todays-opd', icon: Calendar },
    ]
  },
  {
    title: 'Patient Management',
    items: [
      { name: 'Patient Dashboard', href: '/patient-dashboard', icon: Activity },
      { name: 'Patient Overview', href: '/patient-overview', icon: Users },
      { name: 'Patient Profile', href: '/patient-profile', icon: Users },
      { name: 'Diagnoses', href: '/diagnoses', icon: Stethoscope },
      { name: 'Complications', href: '/complications', icon: AlertTriangle },
      { name: 'Prescriptions', href: '/prescriptions', icon: Pill },
    ]
  },
  {
    title: 'Billing & Finance',
    items: [
      { name: 'Old Bills', href: '/old-bills', icon: Receipt },
      { name: 'Daywise Bills', href: '/daywise-bills', icon: Receipt },
      { name: 'Accounting', href: '/accounting', icon: BarChart3 },
      { name: 'Cash Book', href: '/cash-book', icon: FileText },
      { name: 'Day Book', href: '/day-book', icon: FileText },
      { name: 'Patient Ledger', href: '/patient-ledger', icon: Users },
      { name: 'Ledger Statement', href: '/ledger-statement', icon: FileText },
      { name: 'Bill Submission', href: '/bill-submission', icon: ClipboardList },
      { name: 'Bill Aging', href: '/bill-aging-statement', icon: BarChart3 },
      { name: 'Financial Summary', href: '/financial-summary', icon: BarChart3 },
      { name: 'Advance Statement', href: '/advance-statement-report', icon: FileText },
      { name: 'Expected Payments', href: '/expected-payment-date-report', icon: Calendar },
      { name: 'Corporate', href: '/corporate', icon: Home },
      { name: 'Corporate Bulk Payments', href: '/corporate-bulk-payments', icon: Receipt },
      { name: 'IT Transactions', href: '/it-transaction-register', icon: FileText },
    ]
  },
  {
    title: 'Clinical',
    items: [
      { name: 'Lab', href: '/lab', icon: FlaskConical },
      { name: 'Radiology', href: '/radiology', icon: Scan },
      { name: 'Pharmacy', href: '/pharmacy', icon: Package },
      { name: 'Clinical Services', href: '/clinical-services', icon: HeartHandshake },
      { name: 'Mandatory Service', href: '/mandatory-service', icon: ShieldCheck },
    ]
  },
  {
    title: 'Surgeons & Consultants',
    items: [
      { name: 'Hope Surgeons', href: '/hope-surgeons', icon: Scissors },
      { name: 'Hope Consultants', href: '/hope-consultants', icon: Stethoscope },
      { name: 'Hope Anaesthetists', href: '/hope-anaesthetists', icon: Stethoscope },
      { name: 'Ayushman Surgeons', href: '/ayushman-surgeons', icon: Scissors },
      { name: 'Ayushman Consultants', href: '/ayushman-consultants', icon: Stethoscope },
      { name: 'Ayushman Anaesthetists', href: '/ayushman-anaesthetists', icon: Stethoscope },
      { name: 'ESIC Surgeons', href: '/esic-surgeons', icon: Scissors },
      { name: 'CGHS Surgery', href: '/cghs-surgery', icon: Scissors },
      { name: 'CGHS Surgery Master', href: '/cghs-surgery-master', icon: Scissors },
    ]
  },
  {
    title: 'Masters',
    items: [
      { name: 'Implant Master', href: '/implant-master', icon: Syringe },
      { name: 'Referees', href: '/referees', icon: Building2 },
      { name: 'Users', href: '/users', icon: User },
    ]
  },
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
        <nav className="flex-1 px-2 py-4 space-y-4">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="mt-1 space-y-1">
                {group.items.map((item) => {
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
                        className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                        }`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}
