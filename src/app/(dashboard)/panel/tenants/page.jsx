'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiGlobe, FiPlus, FiSearch, FiEdit2, FiTrash2,
  FiExternalLink, FiX, FiCheck
} from 'react-icons/fi';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [form, setForm] = useState({ name: '', url: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await axios.get('/api/staff/tenants');
      if (res.data.success) {
        setTenants(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (tenant = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setForm({ name: tenant.name, url: tenant.url });
    } else {
      setEditingTenant(null);
      setForm({ name: '', url: '' });
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTenant(null);
    setForm({ name: '', url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      return toast.error('Name and URL are required');
    }

    setSubmitting(true);
    try {
      if (editingTenant) {
        const res = await axios.put('/api/staff/tenants', {
          id: editingTenant.id,
          name: form.name,
          url: form.url,
        });
        if (res.data.success) {
          toast.success(res.data.message);
          setTenants((prev) =>
            prev.map((t) => (t.id === editingTenant.id ? res.data.data : t))
          );
          handleCloseForm();
        }
      } else {
        const res = await axios.post('/api/staff/tenants', form);
        if (res.data.success) {
          toast.success(res.data.message);
          setTenants((prev) => [res.data.data, ...prev]);
          handleCloseForm();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete tenant "${name}"?`)) return;
    try {
      const res = await axios.delete(`/api/staff/tenants?id=${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setTenants((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.url.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-6 w-full space-y-6">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FiGlobe size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Tenants Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage organization tenants, domain URLs, and client instance environments.
            </p>
          </div>
        </div>

        <button
          onClick={() => (showForm ? handleCloseForm() : handleOpenForm())}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-md cursor-pointer"
        >
          {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showForm ? 'Close Form' : 'Add New Tenant'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-7 border border-indigo-100 shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingTenant ? `Edit Tenant: "${editingTenant.name}"` : 'Add New Tenant'}
            </h3>
            <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tenant Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Domain URL *</label>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
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
                {submitting ? 'Saving Tenant...' : editingTenant ? 'Update Tenant' : 'Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
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

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Tenants</span>
          <span className="text-2xl font-semibold text-indigo-600">{tenants.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading tenants...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FiGlobe size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-sm">No tenants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Tenant Name</th>
                  <th className="py-4 px-6">URL / Domain</th>
                  <th className="py-4 px-6">Created Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-400 text-xs">#{tenant.id}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{tenant.name}</td>
                    <td className="py-4 px-6">
                      <a
                        href={`https://${tenant.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline"
                      >
                        {tenant.url} <FiExternalLink size={13} />
                      </a>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">{fmtDate(tenant.created_at)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenForm(tenant)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                          title="Edit Tenant"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tenant.id, tenant.name)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Delete Tenant"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
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
