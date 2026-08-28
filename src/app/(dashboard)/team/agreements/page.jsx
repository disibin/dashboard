'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import {
  FiBookOpen, FiSearch, FiRefreshCw, FiLoader,
  FiPrinter, FiUser, FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiArrowRight
} from 'react-icons/fi';
import PrintableAgreement from '@/component/projects/PrintableAgreement';

export default function TeamAgreementsPage() {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [printableAgreement, setPrintableAgreement] = useState(null);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/team/agreements');
      if (res.data.success) {
        setAgreements(res.data.data);
      }
    } catch {
      toast.error('Failed to load agreements');
    } finally {
      setLoading(false);
    }
  };

  const filtered = agreements.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.project_title?.toLowerCase().includes(q) ||
      a.user_name?.toLowerCase().includes(q) ||
      a.user_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Toaster position="top-center" />

      {/* Printable Agreement Modal */}
      {printableAgreement && (
        <PrintableAgreement
          agreement={printableAgreement}
          project={{
            title: printableAgreement.project_title || `Project #${printableAgreement.project_id}`,
            user_name: printableAgreement.user_name,
            user_email: printableAgreement.user_email
          }}
          onClose={() => setPrintableAgreement(null)}
        />
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FiBookOpen size={20} />
            </span>
            Project Legal & Service Agreements
          </h1>
          <p className="text-slate-500 text-sm pl-11">
            Audit history of customer project agreement contracts and signature status
          </p>
        </div>

        <button
          onClick={fetchAgreements}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold transition-all text-xs self-start sm:self-auto shadow-sm"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} size={15} />
          Refresh Agreements
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search agreement title, project, client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-style pl-10 pr-9 text-sm py-2"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            Showing {filtered.length} of {agreements.length} agreements
          </span>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <FiLoader className="animate-spin mx-auto text-primary" size={28} />
            <p className="text-sm font-medium">Loading project agreements...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <FiBookOpen className="mx-auto text-slate-300" size={32} />
            <p className="font-bold text-slate-800 text-base">No agreements found</p>
            <p className="text-xs text-slate-500">There are no project agreements matching your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Agreement Document</th>
                  <th className="px-6 py-4">Linked Project</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Customer Account</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div>{a.title}</div>
                      <span className="text-[10px] text-slate-400 font-normal">Created: {new Date(a.created_at).toLocaleDateString()}</span>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      <Link
                        href={`/team/projects/${a.project_id}`}
                        className="hover:text-primary hover:underline flex items-center gap-1"
                      >
                        {a.project_title || `Project #${a.project_id}`} <FiArrowRight size={12} />
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600 space-y-0.5">
                      <p className="flex items-center gap-1 text-[11px]">
                        <FiCalendar size={11} className="text-slate-400" />
                        Start: {a.start_date ? new Date(a.start_date).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="flex items-center gap-1 text-[11px]">
                        <FiClock size={11} className="text-slate-400" />
                        Expire: {a.expire_date ? new Date(a.expire_date).toLocaleDateString() : 'No Expiry'}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <p className="font-bold text-slate-800">{a.user_name || 'Customer'}</p>
                      <p className="text-[10px] text-slate-400">{a.user_email}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        a.status === 'signed' || a.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : a.status === 'active'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {a.status || 'pending'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setPrintableAgreement(a)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-primary text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <FiExternalLink size={13} /> View Document
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
