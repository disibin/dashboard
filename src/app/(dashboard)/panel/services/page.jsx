'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiBriefcase, FiPlus, FiSearch, FiTrash2,
  FiDollarSign, FiX, FiUser, FiGlobe, FiCheck
} from 'react-icons/fi';
import TiptapEditor from '@/component/helper/TiptapEditor';
import ServiceCard from '@/component/staff/cards/ServiceCard';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tenant_id: '',
    name: '',
    description: '',
    price: 0,
    discount: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const [payServiceId, setPayServiceId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [srvRes, tenantRes] = await Promise.all([
        axios.get('/api/staff/services'),
        axios.get('/api/staff/tenants').catch(() => ({ data: { data: [] } })),
      ]);

      if (srvRes.data.success) setServices(srvRes.data.data);
      if (tenantRes.data.data) setTenants(tenantRes.data.data);
    } catch (err) {
      toast.error('Failed to load service data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Service name is required');

    setSubmitting(true);
    try {
      const res = await axios.post('/api/staff/services', form);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchInitialData();
        setShowForm(false);
        setForm({ tenant_id: '', name: '', description: '', price: 0, discount: 0 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (srvId, newStatus) => {
    try {
      const res = await axios.patch('/api/staff/services', { id: srvId, status: newStatus });
      if (res.data.success) {
        toast.success('Status updated');
        setServices((prev) =>
          prev.map((s) => (s.id === srvId ? { ...s, status: newStatus } : s))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleRecordPayment = async (e, service) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid positive amount');

    setPaying(true);
    try {
      const res = await axios.patch('/api/staff/services', {
        id: service.id,
        add_payment: amount,
      });
      if (res.data.success) {
        toast.success('Payment recorded successfully');
        fetchInitialData();
        setPayServiceId(null);
        setPayAmount('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete service "${name}"?`)) return;
    try {
      const res = await axios.delete(`/api/staff/services?id=${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.tenant_name || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-6 w-full space-y-6 min-h-screen">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6  shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <FiBriefcase size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Services Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage client services, service statuses, custom billing, and TipTap description specs.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-md cursor-pointer"
        >
          {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showForm ? 'Close Form' : 'Add Client Service'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-7 border border-cyan-100 shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Add New Service</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Tenant Assignment</label>
              <select
                value={form.tenant_id}
                onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
                className={inputCls}
              >
                <option value="">Global / No Specific Tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.url})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Service Title *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Price ($)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Discount ($)</label>
                <input
                  type="number"
                  min="0"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Service Description & Scope (TipTap Editor)</label>
              <TiptapEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <FiCheck size={16} />
                {submitting ? 'Saving Service...' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 max-w-md">
        <FiSearch className="text-slate-400 ml-2" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services..."
          className="input-style text-sm flex-1 border-none shadow-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-slate-600">
            <FiX size={16} />
          </button>
        )}
      </div>

      <div className=" overflow-hidden">
      {loading ? (
        <div className="bg-white p-12  text-center text-slate-400">Loading services...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12  text-center text-slate-400">
          <FiBriefcase size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No services found</p>
        </div>
      ) : (
        <div className="space-y-4 min-h-screen">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((srv, idx) => (
              <ServiceCard
                key={srv.id}
                service={srv}
                index={idx}
                isStaff={true}
                onDelete={handleDelete}
                onRecordPayment={(service) => setPayServiceId(payServiceId === service.id ? null : service.id)}
              />
            ))}
          </div>

          {payServiceId && (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm animate-in fade-in duration-200">
              {(() => {
                const srv = services.find((s) => s.id === payServiceId);
                if (!srv) return null;

                return (
                  <form
                    onSubmit={(e) => handleRecordPayment(e, srv)}
                    className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-semibold text-slate-800">
                      Record Payment for &quot;{srv.name}&quot; (Due: ${srv.due_amount || Math.max(0, srv.price - (srv.discount || 0))}):
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        min="1"
                        max={srv.due_amount || Math.max(0, srv.price - (srv.discount || 0))}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Amount ($)"
                        className="input-style text-xs py-2 bg-white flex-1 sm:w-44"
                        required
                      />
                      <button
                        type="submit"
                        disabled={paying}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {paying ? 'Saving...' : 'Record Payment'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayServiceId(null)}
                        className="p-2 text-slate-400 hover:text-slate-600 shrink-0"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  </form>
                );
              })()}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
