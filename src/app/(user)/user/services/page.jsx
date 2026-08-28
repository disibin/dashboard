'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FiBriefcase, FiSearch, FiGlobe, FiX, FiCheckCircle } from 'react-icons/fi';

export default function UserServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get('/api/user/services');
      if (res.data.success) {
        setServices(res.data.data);
      }
    } catch {
      toast.error('Failed to load my services');
    } finally {
      setLoading(false);
    }
  };

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.tenant_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (st) => {
    switch (st) {
      case 'active':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'completed':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-600 border-amber-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
      <Toaster position="top-center" />

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <FiBriefcase size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Custom Services</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Review active client services, billing amounts, service status, and scope deliverables.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 max-w-md">
        <FiSearch className="text-slate-400 ml-2" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-style text-sm flex-1 border-none shadow-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-slate-600">
            <FiX size={16} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your services...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FiBriefcase size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-sm">No custom services assigned yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Service Name</th>
                  <th className="py-4 px-6">Tenant</th>
                  <th className="py-4 px-6">Net Price</th>
                  <th className="py-4 px-6">Service Status</th>
                  <th className="py-4 px-6">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((srv) => {
                  const netPrice = Math.max(0, srv.price - (srv.discount || 0));

                  return (
                    <tr key={srv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{srv.name}</div>
                        {srv.description && (
                          <div
                            className="text-xs text-slate-500 line-clamp-2 mt-1 prose prose-slate max-w-none"
                            dangerouslySetInnerHTML={{ __html: srv.description }}
                          />
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 font-semibold">
                        {srv.tenant_name ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
                            <FiGlobe size={12} /> {srv.tenant_name}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">${netPrice}</div>
                        <div className="text-[11px] text-slate-400">
                          Paid: ${srv.paid_amount || 0} · Due: ${srv.due_amount || netPrice}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full border uppercase tracking-wider inline-block ${getStatusBadge(
                            srv.status
                          )}`}
                        >
                          {srv.status}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                            srv.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : srv.payment_status === 'due'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          <FiCheckCircle size={11} /> {srv.payment_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
