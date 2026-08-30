'use client'
import React, { useContext, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Context } from '../../helper/Context'
import { hasPanelAccess } from '@/lib/auth/permissions'
import {
  FiSidebar, FiSearch, FiX, FiPieChart, FiUser, FiActivity,
  FiShield, FiUsers, FiUserCheck, FiBriefcase, FiGlobe, FiBox,
  FiTag, FiLayout, FiCreditCard, FiFileText, FiCheckSquare,
  FiMessageSquare, FiAlertCircle, FiLifeBuoy, FiStar, FiMail,
  FiInbox, FiHelpCircle, FiArrowRight, FiBookOpen,
  FiMenu
} from 'react-icons/fi'
import { FaHandshake } from 'react-icons/fa'

const ALL_PANEL_ROUTES = [
  { name: 'Dashboard Overview', href: '/panel', category: 'Overview', icon: FiPieChart },
  { name: 'My Profile', href: '/panel/profile', category: 'Overview', icon: FiUser },
  { name: 'Activity Log', href: '/panel/activity-log', category: 'Audit', icon: FiActivity },
  { name: 'Staff Members', href: '/panel/staff-member', category: 'People', icon: FiShield },
  { name: 'Users', href: '/panel/users', category: 'People', icon: FiUsers },
  { name: 'Client Leads', href: '/panel/leads/clients', category: 'People', icon: FiUserCheck },
  { name: 'Business Leads', href: '/panel/leads/business', category: 'People', icon: FiUserCheck },
  { name: 'Careers', href: '/panel/career', category: 'People', icon: FiBriefcase },
  { name: 'Tenants', href: '/panel/tenants', category: 'Operations', icon: FiGlobe },
  { name: 'Products', href: '/panel/products', category: 'Operations', icon: FiBox },
  { name: 'Packages', href: '/panel/packages', category: 'Operations', icon: FiBox },
  { name: 'Services', href: '/panel/services', category: 'Operations', icon: FiBriefcase },
  { name: 'Blogs', href: '/panel/blogs', category: 'Operations', icon: FiBookOpen },
  { name: 'Features', href: '/panel/products/features', category: 'Operations', icon: FiTag },
  { name: 'Projects Board', href: '/panel/board', category: 'Operations', icon: FiLayout },
  { name: 'Partners', href: '/panel/partners', category: 'Operations', icon: FaHandshake },
  { name: 'Payments', href: '/panel/payments', category: 'Finance', icon: FiCreditCard },
  { name: 'Payroll & Salary', href: '/panel/payroll', category: 'Finance', icon: FiCreditCard },
  { name: 'Reports', href: '/panel/reports', category: 'Analytics', icon: FiFileText },
  { name: 'Staff Notes', href: '/panel/notes', category: 'Staff Tools', icon: FiFileText },
  { name: 'Staff To-Dos', href: '/panel/todos', category: 'Staff Tools', icon: FiCheckSquare },
  { name: 'Staff Chat', href: '/panel/chat', category: 'Staff Tools', icon: FiMessageSquare },
  { name: 'Support Inbox', href: '/panel/support', category: 'Support', icon: FiAlertCircle },
  { name: 'Support Tickets', href: '/panel/tickets', category: 'Support', icon: FiLifeBuoy },
  { name: 'Reviews', href: '/panel/reviews', category: 'Support', icon: FiStar },
  { name: 'Newsletter', href: '/panel/news-letter', category: 'Comms', icon: FiMail },
  { name: 'Staff Login Logs', href: '/panel/staff-login-logs', category: 'Audit', icon: FiInbox },
  { name: 'User Login Logs', href: '/panel/user-login-logs', category: 'Audit', icon: FiInbox },
  { name: 'Privacy Policy', href: '/panel/privacy-policy', category: 'Legal', icon: FiFileText },
  { name: 'Terms of Service', href: '/panel/terms-of-service', category: 'Legal', icon: FiFileText },
  { name: 'Refund Policy', href: '/panel/refund-policy', category: 'Legal', icon: FiFileText },
  { name: 'FAQs', href: '/panel/faqs', category: 'Help', icon: FiHelpCircle },
];

const Navbar = () => {
  const { dashboardSidebar, setDashboardSidebar, staffData, staffLogout } = useContext(Context)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()

  const role = staffData?.role || 'manager'
  const accessibleRoutes = ALL_PANEL_ROUTES.filter(route => hasPanelAccess(route.href, role))

  const filteredRoutes = accessibleRoutes.filter(route =>
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
      {/* Left Branding & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDashboardSidebar(!dashboardSidebar)}
          className="cursor-pointer px-3 py-1.5 rounded-xl  text-slate-700 hover:text-slate-900 transition-all flex items-center gap-2 shadow-xs group"
          title={dashboardSidebar ? "Hide Sidebar Menu" : "Show Sidebar Menu"}
          aria-label="Toggle sidebar menu"
        >
          <FiMenu size={18} className={`transition-transform duration-200 ${dashboardSidebar ? 'rotate-180 text-primary' : 'text-slate-500'}`} />
          
        </button>

        <Link href="/panel" className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="hidden md:inline font-semibold text-slate-900">Management</span>
        </Link>
      </div>

      <div className="relative flex-1 max-w-md mx-4" ref={dropdownRef}>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl transition-all ${
            isOpen ? 'bg-white border-primary ring-2 ring-primary/20 shadow-sm' : 'hover:border-slate-300'
          }`}
        >
          <FiSearch className="text-slate-400 shrink-0" size={16} />
          <input
            type="text"
            placeholder="Search panel folders... (Ctrl+K)"
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
            <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
              <span>Accessible Folders ({filteredRoutes.length})</span>
              <span className="capitalize text-primary font-semibold">Role: {role}</span>
            </div>

            {filteredRoutes.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                No accessible folders found for "{search}"
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

      {/* Right User Logout & Status */}
      <div className="flex items-center gap-3 shrink-0">
        {staffData?.name && (
          <span className="hidden sm:block text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full capitalize">
            {staffData.name} ({staffData.role})
          </span>
        )}
        <button
          onClick={staffLogout}
          className="px-4 py-1.5 rounded-xl cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Navbar
