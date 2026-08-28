'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiBox, FiPlus, FiSearch, FiEdit2, FiTrash2,
  FiCheck, FiX, FiTag, FiDollarSign
} from 'react-icons/fi';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [form, setForm] = useState({
    tenant_id: '',
    name: '',
    description: '',
    price: 0,
    discount: 0,
    feature_ids: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pkgRes, tenantRes, featRes] = await Promise.all([
        axios.get('/api/staff/packages'),
        axios.get('/api/staff/tenants').catch(() => ({ data: { data: [] } })),
        axios.get('/api/staff/product/features').catch(() => ({ data: { data: [] } })),
      ]);

      if (pkgRes.data.success) setPackages(pkgRes.data.data);
      if (tenantRes.data.data) setTenants(tenantRes.data.data);
      if (featRes.data.data) setFeatures(featRes.data.data);
    } catch (err) {
      toast.error('Failed to load package data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPkg(pkg);
      setForm({
        tenant_id: pkg.tenant_id || '',
        name: pkg.name || '',
        description: pkg.description || '',
        price: pkg.price || 0,
        discount: pkg.discount || 0,
        feature_ids: Array.isArray(pkg.features) ? pkg.features.map((f) => f.feature_id) : [],
      });
    } else {
      setEditingPkg(null);
      setForm({
        tenant_id: '',
        name: '',
        description: '',
        price: 0,
        discount: 0,
        feature_ids: [],
      });
    }
    setShowModal(true);
  };

  const toggleFeature = (fId) => {
    setForm((prev) => {
      const exists = prev.feature_ids.includes(fId);
      return {
        ...prev,
        feature_ids: exists ? prev.feature_ids.filter((id) => id !== fId) : [...prev.feature_ids, fId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Package name is required');

    setSubmitting(true);
    try {
      if (editingPkg) {
        const res = await axios.put('/api/staff/packages', { id: editingPkg.id, ...form });
        if (res.data.success) {
          toast.success(res.data.message);
          fetchInitialData();
          setShowModal(false);
        }
      } else {
        const res = await axios.post('/api/staff/packages', form);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchInitialData();
          setShowModal(false);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save package');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/staff/packages?id=${deleteId}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setPackages((prev) => prev.filter((p) => p.id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = packages.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.tenant_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiBox size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Packages Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage service packages, tenant assignments, pricing tiers, and bundled features.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
        >
          <FiPlus size={16} /> Create Package
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
          <FiSearch className="text-slate-400 ml-2" size={18} />
          <input
            type="text"
            placeholder="Search packages by name or tenant..."
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
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Packages</span>
          <span className="text-2xl font-extrabold text-amber-600">{packages.length}</span>
        </div>
      </div>

      {/* Package Cards Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          Loading packages...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiBox size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No packages found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((pkg) => {
            const finalPrice = Math.max(0, pkg.price - (pkg.discount || 0));
            return (
              <div
                key={pkg.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                        {pkg.tenant_name || 'Global'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-2">{pkg.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-slate-900">${finalPrice}</div>
                      {pkg.discount > 0 && (
                        <div className="text-xs text-slate-400 line-through">${pkg.price}</div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {pkg.description || 'No description provided.'}
                  </p>

                  {/* Features list */}
                  <div className="space-y-2 border-t border-slate-100 pt-4 mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Included Features ({Array.isArray(pkg.features) ? pkg.features.length : 0})
                    </span>
                    {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
                      pkg.features.map((f) => (
                        <div key={f.feature_id} className="flex items-center gap-2 text-xs text-slate-700">
                          <FiCheck className="text-emerald-500 shrink-0" size={14} />
                          <span>{f.feature_name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs italic text-slate-400">No features assigned</span>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[11px] text-slate-400">{fmtDate(pkg.created_at)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(pkg)}
                      className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                      title="Edit Package"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(pkg.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Delete Package"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal — Add / Edit Package */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 border border-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPkg ? 'Edit Package' : 'Create New Package'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
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
                  <option value="">Global / All Tenants</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.url})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Package Name</label>
                <input
                  type="text"
                  placeholder="e.g. Starter Plan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <label className={labelCls}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Package features overview..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Feature checkboxes */}
              <div>
                <label className={labelCls}>Select Included Features</label>
                {features.length === 0 ? (
                  <p className="text-xs italic text-slate-400">No features created yet in Products & Features</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-2xl bg-slate-50/50">
                    {features.map((f) => {
                      const selected = form.feature_ids.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleFeature(f.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-left transition-colors border ${
                            selected
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          <FiCheck size={14} className={selected ? 'text-white' : 'text-slate-300'} />
                          <span className="truncate">{f.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingPkg ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-7 border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <FiTrash2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Package?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this package? Active client purchases will retain records.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
