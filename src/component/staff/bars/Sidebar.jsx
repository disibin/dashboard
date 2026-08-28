'use client'
import Link from 'next/link'
import React, { useContext } from 'react'
import { Context } from '../../helper/Context'
import { usePathname } from 'next/navigation'
import {
  FiActivity,
  FiPieChart,
  FiBriefcase,
  FiLifeBuoy,
  FiUser,
  FiStar,
  FiShield,
  FiInbox,
  FiBox,
  FiUsers,
  FiCreditCard,
  FiFileText,
  FiLogOut,
  FiMessageSquare,
  FiClipboard,
  FiBookOpen,
  FiLayout,
  FiMail,
  FiUserCheck,
  FiAlertCircle,
  FiSettings,
  FiTag,
  FiHelpCircle,
  FiGlobe,
  FiCheckSquare,
} from 'react-icons/fi'
import { FaGlobeAsia, FaHandshake } from 'react-icons/fa'

const roleLinks = {
  manager: [
    {
      label: 'Overview',
      links: [
        { name: 'Dashboard',     href: '/panel',                       icon: <FiPieChart /> },
        { name: 'Activity Log',  href: '/panel/activity-log',          icon: <FiActivity /> },
      ],
    },
    {
      label: 'People & Staff',
      links: [
        { name: 'Staff Members',  href: '/panel/staff-member',           icon: <FiShield /> },
        { name: 'Users',         href: '/panel/users',                 icon: <FiUsers /> },
        { name: 'Client Leads',  href: '/panel/leads/clients',         icon: <FiUserCheck /> },
        { name: 'Business Leads',href: '/panel/leads/business',        icon: <FiUserCheck /> },
        { name: 'Careers',       href: '/panel/career',                icon: <FiBriefcase /> },
        { name: 'Job Applications', href: '/panel/career/applications', icon: <FiBriefcase /> },
      ],
    },
    {
      label: 'Operations & Work',
      links: [
        { name: 'Tenants',       href: '/panel/tenants',               icon: <FiGlobe /> },
        { name: 'Products',      href: '/panel/products',              icon: <FiBox /> },
        { name: 'Packages',      href: '/panel/packages',              icon: <FiBox /> },
        { name: 'Services',      href: '/panel/services',              icon: <FiBriefcase /> },
        { name: 'Features',      href: '/panel/products/features',     icon: <FiTag /> },
        { name: 'Board',         href: '/panel/board',                 icon: <FiLayout /> },
        { name: 'Partners',      href: '/panel/partners',              icon: <FaHandshake /> },
        { name: 'Payments',      href: '/panel/payments',              icon: <FiCreditCard /> },
        { name: 'Payroll & Salary', href: '/panel/payroll',            icon: <FiCreditCard /> },
        { name: 'Reports',       href: '/panel/reports',               icon: <FiFileText /> },
        { name: 'Privacy Policy', href: '/panel/privacy-policy',        icon: <FiFileText /> },
        { name: 'Terms of Service', href: '/panel/terms-of-service',    icon: <FiFileText /> },
        { name: 'Refund Policy', href: '/panel/refund-policy',          icon: <FiFileText /> },
        { name: 'FAQs',          href: '/panel/faqs',                  icon: <FiHelpCircle /> },
      ],
    },
    {
      label: 'Support & Comms',
      links: [
        { name: 'Support Inbox', href: '/panel/support',               icon: <FiAlertCircle /> },
        { name: 'Tickets',       href: '/panel/tickets',               icon: <FiLifeBuoy /> },
        { name: 'Reviews',       href: '/panel/reviews',               icon: <FiStar /> },
        { name: 'Newsletter',    href: '/panel/news-letter',           icon: <FiMail /> },
        { name: 'Staff Notes',    href: '/panel/notes',                 icon: <FiFileText /> },
        { name: 'Staff To-Dos',   href: '/panel/todos',                 icon: <FiCheckSquare /> },
        { name: 'Staff Chat',     href: '/panel/chat',                  icon: <FiMessageSquare /> },
      ],
    },
    {
      label: 'Logs & Audit',
      links: [
        { name: 'Staff Login Logs', href: '/panel/staff-login-logs',     icon: <FiInbox /> },
        { name: 'User Login Logs', href: '/panel/user-login-logs',     icon: <FiInbox /> },
      ],
    },
  ],
  support: [
    {
      label: 'Overview',
      links: [
        { name: 'Dashboard',     href: '/panel',                       icon: <FiPieChart /> },
        { name: 'My Profile',    href: '/panel/profile',               icon: <FiUser /> },
      ],
    },
    {
      label: 'Support & Comms',
      links: [
        { name: 'Support Inbox', href: '/panel/support',               icon: <FiAlertCircle /> },
        { name: 'Tickets',       href: '/panel/tickets',               icon: <FiLifeBuoy /> },
        { name: 'Services',      href: '/panel/services',              icon: <FiBriefcase /> },
        { name: 'Projects Board',href: '/panel/board',                 icon: <FiLayout /> },
        { name: 'Staff Notes',    href: '/panel/notes',                 icon: <FiFileText /> },
        { name: 'Staff To-Dos',   href: '/panel/todos',                 icon: <FiCheckSquare /> },
        { name: 'Staff Chat',     href: '/panel/chat',                  icon: <FiMessageSquare /> },
      ],
    },
  ],
  developer: [
    {
      label: 'Overview',
      links: [
        { name: 'Dashboard',     href: '/panel',                       icon: <FiPieChart /> },
        { name: 'My Profile',    href: '/panel/profile',               icon: <FiUser /> },
      ],
    },
    {
      label: 'Development & Tasks',
      links: [
        { name: 'Projects Board',href: '/panel/board',                 icon: <FiLayout /> },
        { name: 'Staff Notes',    href: '/panel/notes',                 icon: <FiFileText /> },
        { name: 'Staff To-Dos',   href: '/panel/todos',                 icon: <FiCheckSquare /> },
        { name: 'Staff Chat',     href: '/panel/chat',                  icon: <FiMessageSquare /> },
      ],
    },
  ],
}

const Sidebar = () => {
  const { dashboardSidebar, setDashboardSidebar, staffData, staffLogout } = useContext(Context)
  const pathname = usePathname()

  const role = staffData?.role || 'manager'
  const sections = roleLinks[role] || roleLinks.manager

  const isActive = (href) => {
    if (href === '/panel') return pathname === '/panel'
    if (href === '/panel/products') return pathname === '/panel/products' || (pathname.startsWith('/panel/products/') && !pathname.startsWith('/panel/products/features'))
    if (href === '/panel/career') return pathname === '/panel/career' || (pathname.startsWith('/panel/career/') && !pathname.startsWith('/panel/career/applications'))
    if (href === '/panel/leads/clients') return pathname === '/panel/leads/clients' || pathname.startsWith('/panel/leads/clients/')
    if (href === '/panel/leads/business') return pathname === '/panel/leads/business' || pathname.startsWith('/panel/leads/business/')
    return pathname === href || pathname.startsWith(href + '/')
  }
  const closeMenu = () => setDashboardSidebar(false)

  return (
    <>
      {/* Mobile overlay */}
      {dashboardSidebar && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out ${
          dashboardSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-base shrink-0">{link.icon}</span>
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Account Settings
            </p>
            <div className="flex flex-col gap-0.5">
              <Link
                href="/panel/profile"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive('/panel/profile')
                    ? 'bg-primary/10 text-primary font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FiUser className="text-base shrink-0" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/panel/settings"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive('/panel/settings')
                    ? 'bg-primary/10 text-primary font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FiSettings className="text-base shrink-0" />
                <span>Settings</span>
              </Link>
              <Link
                href="/panel/security"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive('/panel/security')
                    ? 'bg-primary/10 text-primary font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FiShield className="text-base shrink-0" />
                <span>Security</span>
              </Link>
              
            </div>
          </div>
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-900 truncate">{staffData?.name || 'Staff Member'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
              {staffData?.role || 'Staff'}
            </p>
          </div>
          <button
            onClick={staffLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all duration-200"
          >
            <FiLogOut className="text-base shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
