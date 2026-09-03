'use client'
import React, { useContext } from 'react'
import { Context } from '../../helper/Context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FiUser, 
  FiLifeBuoy, 
  FiStar, 
  FiSettings,
  FiLogOut,
  FiCreditCard,
  FiBell,
  FiShield,
  FiPackage,
  FiBox,
  FiBookOpen,
  FiShoppingBag,
  FiShoppingCart
} from 'react-icons/fi'
import { FaGlobeAsia } from 'react-icons/fa'

const Sidebar = () => {
  const { userSidebar, setUserSidebar, userData, logout } = useContext(Context)
  const pathname = usePathname()

  const sections = [
    {
      label: 'My Workspace',
      links: [
        { name: 'Profile',      href: '/user/profile',      icon: <FiUser /> },
        { name: 'My Projects',  href: '/user/projects',     icon: <FiShoppingBag /> },
        { name: 'Purchases',    href: '/user/purchases',    icon: <FiCreditCard /> },
        { name: 'My Cart',      href: '/user/cart',         icon: <FiShoppingCart /> },
      ],
    },
    {
      label: 'Products & Services',
      links: [
        { name: 'Software Products', href: '/user/products', icon: <FiPackage /> },
        { name: 'Packages',          href: '/user/packages', icon: <FiBox /> },
        { name: 'Blogs',             href: '/user/blogs',    icon: <FiBookOpen /> },
      ],
    },
    {
      label: 'Support & Comms',
      links: [
        { name: 'Support Tickets', href: '/user/tickets',      icon: <FiLifeBuoy /> },
        { name: 'My Review',       href: '/user/reviews',      icon: <FiStar /> },
        { name: 'Notifications',   href: '/user/notifications', icon: <FiBell /> },
      ],
    },
    {
      label: 'Preferences',
      links: [
        { name: 'Settings',      href: '/user/settings',      icon: <FiSettings /> },
        { name: 'Security',      href: '/user/security',      icon: <FiShield /> },
        { name: 'Main Website',  href: '/',                  icon: <FaGlobeAsia /> },
      ],
    },
  ]

  const isActive = (href) => {
    if (href === '/user') return pathname === '/user'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const closeMenu = () => setUserSidebar(false)

  return (
    <>
      {userSidebar && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out ${
          userSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-sm shrink-0">{link.icon}</span>
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-slate-100 space-y-2">
          {userData && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-900 truncate">{userData?.name || 'User Account'}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{userData?.email || 'Client'}</p>
            </div>
          )}
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-all duration-150"
          >
            <FiLogOut className="text-sm shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar