'use client'
import React, { useContext } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { Context } from '../../helper/Context'

export default function UserPanelLayout({ children }) {
  const { userSidebar } = useContext(Context)

  return (
    <section className="w-full relative pt-14 bg-slate-50 min-h-screen overflow-x-hidden">
      <Navbar />
      <Sidebar />
      <main
        className={`transition-all duration-300 ease-in-out animate-in fade-in ${
          userSidebar ? 'lg:ml-64' : 'ml-0'
        }`}
      >
        {children}
      </main>
    </section>
  )
}
