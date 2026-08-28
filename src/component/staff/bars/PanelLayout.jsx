'use client'
import React, { useContext } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { Context } from '../../helper/Context'
import { usePathname } from 'next/navigation'
import { hasPanelAccess } from '@/lib/auth/permissions'
import { FiShield, FiArrowLeft } from 'react-icons/fi'
import Link from 'next/link'

export default function PanelLayout({ children }) {
  const { dashboardSidebar, staffData } = useContext(Context)
  const pathname = usePathname()

  const isAllowed = staffData ? hasPanelAccess(pathname, staffData.role) : true

  return (
    <section className="w-full relative pt-14 bg-slate-50 min-h-screen overflow-x-hidden">
      <Navbar />
      <Sidebar />
      <main
        className={`transition-all duration-300 ease-in-out animate-in fade-in ${
          dashboardSidebar ? 'lg:ml-64' : 'ml-0'
        }`}
      >
        {!isAllowed ? (
          <div className="p-12 flex flex-col items-center justify-center text-center min-h-[70vh]">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <FiShield size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Access Restricted</h2>
            <p className="text-slate-500 text-sm max-w-md mt-2">
              Your current staff role (<span className="font-bold capitalize text-slate-800">{staffData?.role}</span>) does not have permission to view <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{pathname}</code>.
            </p>
            <Link
              href="/panel"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-md"
            >
              <FiArrowLeft size={16} /> Return to Dashboard
            </Link>
          </div>
        ) : (
          children
        )}
      </main>
    </section>
  )
}
