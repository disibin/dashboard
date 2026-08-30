'use client'
import React, { useContext, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Context } from '../../helper/Context'
import {
  FiSidebar, FiSearch, FiX, FiUser, FiCreditCard, FiPackage,
  FiBox, FiBriefcase, FiFolder, FiBookOpen, FiLifeBuoy, FiStar,
  FiBell, FiSettings, FiShield, FiArrowRight,
  FiMenu
} from 'react-icons/fi'

const USER_PANEL_ROUTES = [
  { name: 'Profile', href: '/user/profile', category: 'Workspace', icon: FiUser },
  { name: 'Purchases', href: '/user/purchases', category: 'Workspace', icon: FiCreditCard },
  { name: 'Software Products', href: '/user/products', category: 'Services & Projects', icon: FiPackage },
  { name: 'Service Packages', href: '/user/packages', category: 'Services & Projects', icon: FiBox },
  { name: 'My Services', href: '/user/services', category: 'Services & Projects', icon: FiBriefcase },
  { name: 'My Projects', href: '/user/projects', category: 'Services & Projects', icon: FiFolder },
  { name: 'Blogs & News', href: '/user/blogs', category: 'Services & Projects', icon: FiBookOpen },
  { name: 'Support Tickets', href: '/user/tickets', category: 'Support & Comms', icon: FiLifeBuoy },
  { name: 'My Review', href: '/user/reviews', category: 'Support & Comms', icon: FiStar },
  { name: 'Notifications', href: '/user/notifications', category: 'Support & Comms', icon: FiBell },
  { name: 'Settings', href: '/user/settings', category: 'Preferences', icon: FiSettings },
  { name: 'Security', href: '/user/security', category: 'Preferences', icon: FiShield },
]

const Navbar = () => {
  const { userSidebar, setUserSidebar, userData, logout } = useContext(Context)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()

  const filteredRoutes = USER_PANEL_ROUTES.filter(route =>
    route.name.toLowerCase().includes(search.toLowerCase()) ||
    route.category.toLowerCase().includes(search.toLowerCase()) ||
    route.href.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSelectRoute = (href) => {
    setIsOpen(false)
    setSearch('')
    router.push(href)
  }

  return (
    <header className="w-full h-14 fixed top-0 left-0 right-0 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setUserSidebar(!userSidebar)}
          className="cursor-pointer px-3 py-1.5  text-slate-700 hover:text-slate-900 transition-all flex items-center gap-2 shadow-xs"
          title={userSidebar ? "Hide Menu" : "Show Menu"}
          aria-label="Toggle menu"
        >
          <FiMenu size={18} className={`transition-transform duration-200 ${userSidebar ? 'rotate-180 text-primary' : 'text-slate-500'}`} />
          
        </button>

        <Link href="/user" className="text-lg font-semibold text-slate-900 tracking-tight hidden sm:block">
          Dashboard
        </Link>
      </div>

      {/* User Navbar Search */}
      <div className="relative flex-1 max-w-md mx-4" ref={dropdownRef}>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl transition-all ${
            isOpen ? 'bg-white border-primary ring-2 ring-primary/20 shadow-sm' : 'hover:border-slate-300'
          }`}
        >
          <FiSearch className="text-slate-400 shrink-0" size={16} />
          <input
            type="text"
            placeholder="Search pages... (Ctrl+K)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 focus:outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden max-h-80 overflow-y-auto z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
              <span>Quick Navigation ({filteredRoutes.length})</span>
            </div>

            {filteredRoutes.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                No matching pages found for "{search}"
              </div>
            ) : (
              filteredRoutes.map((route) => {
                const IconComponent = route.icon
                return (
                  <button
                    key={route.href}
                    onClick={() => handleSelectRoute(route.href)}
                    className="w-full cursor-pointer text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors shrink-0">
                        <IconComponent size={16} />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-primary transition-colors">
                        {route.name}
                      </p>
                    </div>

                    <FiArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all transform -translate-x-1 group-hover:translate-x-0" />
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {userData?.name && (
          <span className="hidden sm:block text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            {userData.name}
          </span>
        )}
        <button
          onClick={logout}
          className="px-4 py-1.5 rounded-xl cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Navbar
