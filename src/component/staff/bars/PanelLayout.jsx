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
          <div className="p-5 flex flex-col items-center justify-center text-center min-h-[70vh]">
            <div className="w-14 h-14 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <FiShield size={28} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Access Restricted</h2>
            <p className="text-slate-500 text-xs max-w-md mt-1.5">
              Your current staff role (<span className="font-semibold capitalize text-slate-800">{staffData?.role}</span>) does not have permission to view <code className="bg-slate-100 px-2 py-0.5 rounded-xl text-xs">{pathname}</code>.
            </p>
            <Link
              href="/panel"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-xs"
            >
              <FiArrowLeft size={15} /> Return to Dashboard
            </Link>
          </div>
        ) : (
          children
        )}
      </main>
    </section>
  )
}
