'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiUser, FiMail, FiPhone, FiMapPin,
  FiCalendar, FiUserCheck, FiUserX, FiLifeBuoy,
  FiStar, FiClock, FiLoader, FiAlertCircle, FiFolder,
  FiShoppingBag, FiCreditCard, FiShoppingCart, FiShield,
  FiCheckCircle, FiXCircle, FiExternalLink, FiDollarSign
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';
import { printReceipt } from '@/lib/printableSlip';

export default function TeamUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const rawParam = params?.username;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [printableSlipItem, setPrintableSlipItem] = useState(null);

  useEffect(() => {
    if (rawParam) fetchUserProfile();
  }, [rawParam]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setForbidden(false);
    try {
      let cleanParam = rawParam;
      try {
        cleanParam = decodeURIComponent(rawParam);
        if (cleanParam.includes('%')) {
          cleanParam = decodeURIComponent(cleanParam);
        }
      } catch {}

      const res = await axios.get(`/api/staff/users/${encodeURIComponent(cleanParam)}`);
      if (res.data.success) {
        setProfileData(res.data.data);
      } else {
        toast.error(res.data.message || 'User profile not found');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setForbidden(true);
      } else {
        toast.error('Failed to load user profile');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 w-full min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Toaster position="top-center" />
        <FiLoader className="animate-spin text-primary" size={32} />
        <p className="text-sm font-medium text-slate-500">Loading user profile records...</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="p-4 w-full space-y-4 max-w-xl mx-auto text-center py-12">
        <Toaster position="top-center" />
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
            <FiShield size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Manager Access Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Only staff members with Manager role are authorized to view full user profile details, projects, payments, and account history.
          </p>
          <Link
            href="/panel/users"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-primary text-white rounded-xl font-semibold text-xs transition-all shadow-md"
          >
            <FiArrowLeft size={14} /> Back to Registered Users
          </Link>
        </div>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div className="p-4 w-full space-y-4 max-w-xl mx-auto text-center py-12">
        <Toaster position="top-center" />
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <FiAlertCircle className="mx-auto text-secondary" size={36} />
          <h2 className="text-xl font-bold text-slate-900">User Profile Not Found</h2>
          <p className="text-xs text-slate-500">No registered account matches "{rawParam}".</p>
          <Link
            href="/panel/users"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-primary text-white rounded-xl font-semibold text-xs transition-all shadow-md"
          >
            <FiArrowLeft size={14} /> Back to Registered Users
          </Link>
        </div>
      </div>
    );
  }

  const { user, projects = [], purchases = [], payments = [], cart = [], tickets = [], reviews = [], loginLogs = [] } = profileData;

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (Number(p.paid) || Number(p.price) || 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiUser, count: null },
    { id: 'projects', label: 'Projects', icon: FiFolder, count: projects.length },
    { id: 'purchases', label: 'Purchases', icon: FiShoppingBag, count: purchases.length },
    { id: 'payments', label: 'Payments', icon: FiCreditCard, count: payments.length },
    { id: 'cart', label: 'Cart', icon: FiShoppingCart, count: cart.length },
    { id: 'tickets', label: 'Support', icon: FiLifeBuoy, count: tickets.length },
    { id: 'reviews', label: 'Reviews', icon: FiStar, count: reviews.length },
    { id: 'logs', label: 'Activity Logs', icon: FiClock, count: loginLogs.length },
  ];

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/panel/users"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
          >
            <FiArrowLeft size={15} /> Back to Registered Users
          </Link>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              user.is_active !== false
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {user.is_active !== false ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
              {user.is_active !== false ? 'Active Account' : 'Disabled Account'}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              user.is_verified
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-secondary/10 text-secondary border border-secondary/20'
            }`}>
              {user.is_verified ? <FiUserCheck size={12} /> : <FiUserX size={12} />}
              {user.is_verified ? 'Verified Account' : 'Unverified Account'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary font-semibold text-2xl flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
            {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                ID #{user.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1">
            <p className="text-slate-400 font-medium flex items-center gap-1">
              <FiMail size={12} className="text-primary" /> Email Address
            </p>
            <a href={`mailto:${user.email}`} className="font-semibold text-slate-800 hover:text-primary truncate block">
              {user.email}
            </a>
          </div>

          <div className="space-y-1">
            <p className="text-slate-400 font-medium flex items-center gap-1">
              <FiPhone size={12} className="text-primary" /> Phone Number
            </p>
            <p className="font-semibold text-slate-800">{user.phone || 'N/A'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-slate-400 font-medium flex items-center gap-1">
              <FiMapPin size={12} className="text-rose-500" /> Location / Address
            </p>
            <p className="font-semibold text-slate-800">
              {[user.address_line1, user.city, user.state, user.country].filter(Boolean).join(', ') || 'N/A'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-slate-400 font-medium flex items-center gap-1">
              <FiCalendar size={12} className="text-secondary" /> Account Created
            </p>
            <p className="font-semibold text-slate-800">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-primary-light' : 'text-slate-400'} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FiFolder size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Projects</p>
                <p className="text-xl font-bold text-slate-900">{projects.length}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FiShoppingBag size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Purchases</p>
                <p className="text-xl font-bold text-slate-900">{purchases.length}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <FiDollarSign size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Paid</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <FiLifeBuoy size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Support Tickets</p>
                <p className="text-xl font-bold text-slate-900">{tickets.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FiFolder className="text-primary" /> Active Projects
                </h3>
                <button onClick={() => setActiveTab('projects')} className="text-xs text-primary font-semibold hover:underline">
                  View All ({projects.length})
                </button>
              </div>

              {projects.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No active projects associated with this user.</p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {projects.slice(0, 4).map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{p.title}</p>
                        <p className="text-[11px] text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-primary/10 text-primary">
                        {p.status || 'waiting'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FiShoppingBag className="text-emerald-600" /> Package Orders
                </h3>
                <button onClick={() => setActiveTab('purchases')} className="text-xs text-primary font-semibold hover:underline">
                  View All ({purchases.length})
                </button>
              </div>

              {purchases.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No package purchases recorded for this user.</p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {purchases.slice(0, 4).map((pur) => (
                    <div key={pur.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{pur.package_name || 'Package Order'}</p>
                        <p className="text-[11px] text-slate-400">Order: #{pur.order_id || pur.id}</p>
                      </div>
                      <span className="font-bold text-slate-900">{formatCurrency(pur.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiFolder className="text-primary" /> User Projects ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No project discussions created by or assigned to this user.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {projects.map((p) => (
                <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors p-2 rounded-xl">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                    {p.description && <p className="text-slate-500 line-clamp-1">{p.description}</p>}
                    <p className="text-[11px] text-slate-400">Created: {new Date(p.created_at).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-primary/10 text-primary border border-primary/20">
                      {p.status || 'waiting'}
                    </span>
                    <Link
                      href={`/panel/projects/${p.id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-primary text-white rounded-xl font-semibold text-xs transition-all flex items-center gap-1"
                    >
                      View Workspace <FiExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiShoppingBag className="text-emerald-600" /> Package Purchases ({purchases.length})
          </h2>

          {purchases.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No package purchases found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Package Name</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-800">#{pur.order_id || pur.id}</td>
                      <td className="p-3 font-semibold text-slate-900">{pur.package_name || 'N/A'}</td>
                      <td className="p-3 font-bold text-slate-900">{formatCurrency(pur.price)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                          pur.status === 'complete'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : pur.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {pur.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(pur.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiCreditCard className="text-sky-600" /> Payments & Transactions ({payments.length})
          </h2>

          {payments.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No payment transactions recorded for this user.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3">Txn ID / Order</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Paid / Price</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Sender Phone</th>
                    <th className="p-3">Proof Link</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {pay.transaction_id || `#${pay.order_id || pay.id}`}
                      </td>
                      <td className="p-3 uppercase font-semibold text-slate-700">{pay.payment_method || 'N/A'}</td>
                      <td className="p-3 font-bold text-slate-900">{formatCurrency(pay.paid || pay.price)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                          pay.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : pay.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{pay.sender_number || 'N/A'}</td>
                      <td className="p-3">
                        {pay.proof_url ? (
                          <a href={pay.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline flex items-center gap-1">
                            Proof <FiExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">{new Date(pay.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cart' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiShoppingCart className="text-amber-600" /> Active Cart Items ({cart.length})
          </h2>

          {cart.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No items currently in user's cart.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {cart.map((item) => (
                <div key={item.cart_id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">{item.package_name || 'Cart Item'}</p>
                    <p className="text-[11px] text-slate-400">Added: {new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiLifeBuoy className="text-secondary" /> Support Tickets ({tickets.length})
          </h2>

          {tickets.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No support tickets submitted by this user.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {tickets.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <Link href={`/panel/tickets/${t.id}`} className="font-bold text-slate-900 text-sm hover:text-primary transition-colors">
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-400">Created {new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <Link
                    href={`/panel/tickets/${t.id}`}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-primary text-white rounded-xl font-semibold text-xs transition-all"
                  >
                    Open Ticket →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiStar className="text-amber-500" /> Submitted Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No reviews submitted by this user.</p>
          ) : (
            <div className="space-y-3 text-xs">
              {reviews.map((r) => (
                <div key={r.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                      <span className="font-bold text-slate-800 ml-1">{r.rating} / 5</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {r.is_approved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium">{r.comment}</p>
                  {r.reply && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-primary-dark font-semibold">
                      Staff Reply: {r.reply}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiClock className="text-slate-500" /> Activity & Login Logs ({loginLogs.length})
          </h2>

          {loginLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No activity logs recorded.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {loginLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-slate-600">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800">{log.description || log.action}</p>
                    <p className="text-[10px] text-slate-400">{log.action}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
