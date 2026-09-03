'use client';

import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Context } from '@/component/helper/Context';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiFolder, FiLifeBuoy, FiShoppingBag, FiBell, FiArrowRight,
  FiCheckCircle, FiClock, FiPlus, FiUser, FiSettings, FiStar,
  FiPackage, FiExternalLink, FiShield, FiBriefcase
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';

export default function UserDashboardHome() {
  const { userData } = useContext(Context);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profRes, projRes, tickRes, purRes, notifRes] = await Promise.all([
        axios.get('/api/user').catch(() => ({ data: { success: false } })),
        axios.get('/api/user/projects').catch(() => ({ data: { success: false } })),
        axios.get('/api/user/ticket').catch(() => ({ data: { success: false } })),
        axios.get('/api/user/purchases').catch(() => ({ data: { success: false } })),
        axios.get('/api/user/notifications').catch(() => ({ data: { success: false } })),
      ]);

      if (profRes.data?.success) setProfile(profRes.data.data);
      if (projRes.data?.success) setProjects(projRes.data.data || []);
      if (tickRes.data?.success) setTickets(tickRes.data.data || []);
      if (purRes.data?.success) setPurchases(purRes.data.data || []);
      if (notifRes.data?.success) setNotifications(notifRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to sync dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const user = profile || userData;

  // Calculated Metrics
  const activeProjectsCount = projects.length;
  const pendingTicketsCount = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
  const totalPurchasesCount = purchases.length;
  const totalInvested = purchases.reduce((sum, item) => sum + Number(item.paid || item.price || 0), 0);
  const unreadNotifCount = notifications.filter(n => !Boolean(n.is_read)).length;

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8">
      <Toaster position="top-center" />

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Valued Client'}
          </h1>
          <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
            Manage active projects, review purchase invoices, track support tickets, and update your profile credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            href="/user/tickets"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
          >
            <FiPlus size={16} /> New Support Ticket
          </Link>
          <Link
            href="/user/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all border border-slate-200 cursor-pointer"
          >
            <FiSettings size={16} /> Account Settings
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Active Projects */}
        <Link
          href="/user/projects"
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiFolder size={22} />
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
              View <FiArrowRight size={13} />
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              {loading ? '—' : activeProjectsCount}
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Active Projects
            </p>
          </div>
        </Link>

        {/* Metric 2: Pending Tickets */}
        <Link
          href="/user/tickets"
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiLifeBuoy size={22} />
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-600 transition-colors flex items-center gap-1">
              View <FiArrowRight size={13} />
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              {loading ? '—' : pendingTicketsCount}
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Open Support Inquiries
            </p>
          </div>
        </Link>

        {/* Metric 3: Total Purchases */}
        <Link
          href="/user/purchases"
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiShoppingBag size={22} />
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
              View <FiArrowRight size={13} />
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              {loading ? '—' : totalPurchasesCount}
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Purchases ({formatCurrency(totalInvested)})
            </p>
          </div>
        </Link>

        {/* Metric 4: Notifications */}
        <Link
          href="/user/notifications"
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform relative">
              <FiBell size={22} />
              {unreadNotifCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-600 transition-colors flex items-center gap-1">
              View <FiArrowRight size={13} />
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              {loading ? '—' : unreadNotifCount}
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Unread System Updates
            </p>
          </div>
        </Link>
      </div>

      {/* Two Column Section: Recent Projects & Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Projects */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FiBriefcase className="text-indigo-600" size={18} />
              Active Projects
            </h2>
            <Link href="/user/projects" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All ({projects.length})
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading active projects...</div>
          ) : projects.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <FiFolder size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-500">No active projects assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map((p, idx) => (
                <div
                  key={`${p.project_type}-${p.id || idx}`}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {p.project_title || p.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{p.tenant_name || 'Package'}</span>
                      <span>•</span>
                      <span className="capitalize text-emerald-600 font-semibold">{p.payment_status || 'Active'}</span>
                    </p>
                  </div>
                  <Link
                    href="/user/projects"
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition-all shrink-0"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FiLifeBuoy className="text-amber-600" size={18} />
              Recent Support Inquiries
            </h2>
            <Link href="/user/tickets" className="text-xs font-semibold text-amber-600 hover:underline">
              View All ({tickets.length})
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <FiLifeBuoy size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-500">No support tickets created yet.</p>
              <Link href="/user/tickets" className="text-xs text-primary font-semibold hover:underline block">
                + Open a Ticket
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.slice(0, 4).map((t) => (
                <Link
                  key={t.id}
                  href={`/user/tickets/${t.id}`}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors block"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-400">#{t.id}</span>
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{t.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{t.last_message || 'No messages'}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick Action Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Explore Products & Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link
            href="/user/products"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <FiPackage size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Software Suits</h4>
              <p className="text-xs text-slate-500">Explore apps & demos</p>
            </div>
          </Link>

          <Link
            href="/user/packages"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-100 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <FiBriefcase size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">Packages</h4>
              <p className="text-xs text-slate-500">View scope deliverables</p>
            </div>
          </Link>

          <Link
            href="/user/reviews"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <FiStar size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Give Feedback</h4>
              <p className="text-xs text-slate-500">Post client reviews</p>
            </div>
          </Link>

          <Link
            href="/user/profile"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-cyan-50/60 border border-slate-100 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
              <FiUser size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors">Client Profile</h4>
              <p className="text-xs text-slate-500">View contact details</p>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
