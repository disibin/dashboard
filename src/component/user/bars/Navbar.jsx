'use client'
import Link from 'next/link'
import React, { useContext } from 'react'
import { Context } from '../../helper/Context'
import { FiSidebar } from 'react-icons/fi'

const Navbar = () => {
  const { userSidebar, setUserSidebar, userData, logout } = useContext(Context)

  return (
    <header className="w-full h-14 fixed top-0 left-0 right-0 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setUserSidebar(!userSidebar)}
          className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-all flex items-center gap-2 shadow-xs"
          title={userSidebar ? "Hide Menu" : "Show Menu"}
          aria-label="Toggle menu"
        >
          <FiSidebar size={18} className={`transition-transform duration-200 ${userSidebar ? 'rotate-180 text-indigo-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline text-xs font-bold tracking-tight">
            Menu
          </span>
        </button>

        <Link href="/user" className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
            U
          </span>
          <span>User Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {userData?.name && (
          <span className="hidden sm:block text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            {userData.name}
          </span>
        )}
        <button
          onClick={logout}
          className="px-4 py-1.5 rounded-xl cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Navbar
