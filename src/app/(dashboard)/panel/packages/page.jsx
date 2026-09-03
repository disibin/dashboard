'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiBox, FiPlus, FiSearch, FiEdit2, FiTrash2,
  FiCheck, FiX, FiUpload, FiLoader
} from 'react-icons/fi';
import Image from 'next/image';
import TiptapEditor from '@/component/helper/TiptapEditor';
import PackageCard from '@/component/staff/cards/PackageCard';

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [form, setForm] = useState({
    tenant_id: '',
    name: '',
    description: '',
    price: 0,
    discount: 0,
    image: '',
    image_id: '',
    feature_ids: [],
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      toast.error('Failed to load package data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (pkg = null) => {
    if (pkg) {
      setEditingPkg(pkg);
      setForm({
        tenant_id: pkg.tenant_id || '',
        name: pkg.name || '',
        description: pkg.description || '',
        price: pkg.price || 0,
        discount: pkg.discount || 0,
        image: pkg.image || '',
        image_id: pkg.image_id || '',
        feature_ids: Array.isArray(pkg.features) ? pkg.features.map((f) => f.feature_id) : [],
      });
      setImagePreview(pkg.image || '');
      setImageFile(null);
    } else {
      setEditingPkg(null);
      setForm({
        tenant_id: '',
        name: '',
        description: '',
        price: 0,
        discount: 0,
        image: '',
        image_id: '',
        feature_ids: [],
      });
      setImagePreview('');
      setImageFile(null);
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPkg(null);
    setForm({ tenant_id: '', name: '', description: '', price: 0, discount: 0, image: '', image_id: '', feature_ids: [] });
    setImagePreview('');
    setImageFile(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm((prev) => ({ ...prev, image: '', image_id: '' }));
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
      let finalImageUrl = form.image;
      let finalImageId = form.image_id;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await axios.post('/api/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data.success) {
          finalImageUrl = uploadRes.data.data.url;
          finalImageId = uploadRes.data.data.public_id;
        } else {
          throw new Error(uploadRes.data.message || 'Image upload failed');
        }
      }

      const payload = {
        ...form,
        image: finalImageUrl,
        image_id: finalImageId,
      };

      if (editingPkg) {
        const res = await axios.put('/api/staff/packages', { id: editingPkg.id, ...payload });
        if (res.data.success) {
          toast.success(res.data.message);
          fetchInitialData();
          handleCloseForm();
        }
      } else {
        const res = await axios.post('/api/staff/packages', payload);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchInitialData();
          handleCloseForm();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save package');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name, public_id) => {
    if (!window.confirm(`Delete package "${name}"?`)) return;
    try {
      if (public_id) {
        await axios.delete(`/api/image?public_id=${encodeURIComponent(public_id)}`).catch(() => {});
      }
      const res = await axios.delete(`/api/staff/packages?id=${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setPackages((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = packages.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.tenant_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiBox size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Packages Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage service packages, tenant assignments, pricing tiers, package banners, and TipTap description specs.
            </p>
          </div>
        </div>

        <button
          onClick={() => (showForm ? handleCloseForm() : handleOpenForm())}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-md cursor-pointer"
        >
          {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showForm ? 'Close Form' : 'Create Package'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-7 border border-amber-100 shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingPkg ? `Edit Package: "${editingPkg.name}"` : 'Create New Package'}
            </h3>
            <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className={labelCls}>Package Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className={labelCls}>Package Banner Image</label>
                {imagePreview ? (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                    <Image
                      width={50}
                      height={50}
                      src={imagePreview}
                      alt="Selected package banner"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {imageFile ? imageFile.name : 'Current Image'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB (Uploads on save)` : form.image_id || 'Cloudinary'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Remove Image"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="package-image-upload"
                    />
                    <label
                      htmlFor="package-image-upload"
                      className="flex items-center justify-center gap-2 p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:border-amber-300 transition-all cursor-pointer"
                    >
                      <FiUpload size={16} className="text-slate-400" />
                      <span>Select Banner Image</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>Package Description & Features Overview (TipTap Editor)</label>
              <TiptapEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
              />
            </div>

            <div>
              <label className={labelCls}>Select Bundled Features</label>
              {features.length === 0 ? (
                <p className="text-xs italic text-slate-400">No features created yet in Products & Features</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {features.map((f) => {
                    const selected = form.feature_ids.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFeature(f.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer border ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900'
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <FiLoader size={16} className="animate-spin" />
                    <span>Uploading &amp; Saving...</span>
                  </>
                ) : (
                  <>
                    <FiCheck size={16} />
                    <span>{editingPkg ? 'Update Package' : 'Save Package'}</span>
                  </>
                )}
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
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Packages</span>
          <span className="text-2xl font-semibold text-amber-600">{packages.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center text-slate-400">
          Loading packages...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiBox size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No packages found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pkg, idx) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={idx}
              onEdit={handleOpenForm}
              onDelete={handleDelete}
              isStaff={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
