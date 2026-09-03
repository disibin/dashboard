'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  FaHandshake, FaPlus, FaTrash, FaEdit,
  FaSearch, FaTimes, FaGlobe, FaEnvelope
} from 'react-icons/fa';
import { FiLoader, FiPaperclip, FiX } from 'react-icons/fi';

export default function TeamPartnersManagement() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [form, setForm] = useState({ company_name: '', business_url: '', email: '', image: '', image_id: '' });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/public/partner');
      if (res.data.success) {
        setPartners(res.data.data);
      }
    } catch {
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPartner(null);
    setForm({ company_name: '', business_url: '', email: '', image: '', image_id: '' });
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setForm({
      company_name: partner.company_name || '',
      business_url: partner.business_url || '',
      email: partner.email || '',
      image: partner.image || '',
      image_id: partner.image_id || ''
    });
    setImageFile(null);
    setImagePreview(partner.image || '');
    setIsModalOpen(true);
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
    setForm(prev => ({ ...prev, image: '', image_id: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim()) return toast.error('Company name is required');
    if (!imagePreview) return toast.error('Company logo image is required');
    if (!form.email.trim()) return toast.error('Contact email is required');

    setSaving(true);
    try {
      let finalImageUrl = form.image;
      let finalImageId = form.image_id;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const res = await axios.post('/api/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success) {
          finalImageUrl = res.data.data.url;
          finalImageId = res.data.data.public_id;
        } else {
          throw new Error(res.data.message || 'Logo upload failed');
        }
      }

      const payload = {
        ...form,
        image: finalImageUrl,
        image_id: finalImageId,
      };

      if (editingPartner) {
        const res = await axios.patch('/api/public/partner', { id: editingPartner.id, ...payload });
        if (res.data.success) {
          toast.success('Partner updated successfully');
          setPartners(prev => prev.map(p => p.id === editingPartner.id ? res.data.data : p));
          setIsModalOpen(false);
        } else {
          toast.error(res.data.message || 'Failed to update partner');
        }
      } else {
        const res = await axios.post('/api/public/partner', payload);
        if (res.data.success) {
          toast.success('Partner created successfully');
          setPartners(prev => [res.data.data, ...prev]);
          setIsModalOpen(false);
        } else {
          toast.error(res.data.message || 'Failed to create partner');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to save partner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partner) => {
    if (!window.confirm(`Delete partner "${partner.company_name}"? This cannot be undone.`)) return;

    setDeletingId(partner.id);
    try {
      if (partner.image_id) {
        await axios.delete(`/api/image?public_id=${encodeURIComponent(partner.image_id)}`).catch(() => {});
      }
      const res = await axios.delete(`/api/public/partner?id=${partner.id}`);
      if (res.data.success) {
        toast.success('Partner deleted');
        setPartners(prev => prev.filter(p => p.id !== partner.id));
      } else {
        toast.error(res.data.message || 'Failed to delete partner');
      }
    } catch {
      toast.error('Failed to delete partner');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPartners = partners.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.company_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-4 md:p-7 max-w-6xl mx-auto w-full space-y-5">
      <Toaster position="top-center" />

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FaHandshake size={18} />
            </span>
            Partners Management
          </h1>
          <p className="text-slate-500 text-xs pl-10">
            Manage official business partners displayed across public pages
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-xs transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <FaPlus size={13} />
          Add New Partner
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/60">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-style pl-9 pr-8 text-xs py-1.5"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <FaTimes size={13} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-5 text-center text-slate-400 space-y-2">
            <FiLoader className="animate-spin mx-auto text-primary" size={24} />
            <p className="text-xs font-medium">Loading partner list...</p>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="py-5 text-center space-y-3 px-4">
            <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FaHandshake size={28} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-semibold text-slate-800 text-sm">No partners found</h3>
              <p className="text-xs text-slate-500">
                {search ? 'No partners match your search term.' : 'Add your first partner to showcase on public pages.'}
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              + Add First Partner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5">
            {filteredPartners.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.company_name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="font-semibold text-primary text-base">{p.company_name?.charAt(0)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-xs truncate group-hover:text-primary transition-colors">
                        {p.company_name}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate">/{p.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                      title="Edit Partner"
                    >
                      <FaEdit size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                      title="Delete Partner"
                    >
                      {deletingId === p.id ? <FiLoader className="animate-spin" size={13} /> : <FaTrash size={13} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <a
                    href={p.business_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary truncate font-medium text-[11px]"
                  >
                    <FaGlobe size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{p.business_url}</span>
                  </a>
                  <div className="flex items-center gap-1.5 text-slate-500 truncate text-[11px]">
                    <FaEnvelope size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{p.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FaHandshake className="text-primary" size={16} />
                {editingPartner ? 'Edit Partner' : 'Add New Partner'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Business Website URL *
                  </label>
                  <input
                    type="url"
                    value={form.business_url}
                    onChange={e => setForm(p => ({ ...p, business_url: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Company Logo *
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <div className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                      <img src={imagePreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-slate-900/80 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        <FiX size={10} />
                      </button>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <FiPaperclip size={13} />
                    {imagePreview ? 'Replace Logo' : 'Select Logo File'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? <FiLoader className="animate-spin" size={13} /> : null}
                  {saving ? 'Saving...' : editingPartner ? 'Update Partner' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
