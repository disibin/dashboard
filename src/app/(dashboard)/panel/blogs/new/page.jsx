'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import {
  FiArrowLeft,
  FiUploadCloud,
  FiTrash2,
  FiSave,
  FiGlobe,
  FiLoader
} from 'react-icons/fi';
import TiptapEditor from '@/component/helper/TiptapEditor';

export default function NewBlogPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageId, setImageId] = useState('');

  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await axios.get('/api/staff/tenants');
      if (res.data.success) {
        setTenants(res.data.data);
        if (res.data.data.length > 0) {
          setTenantId(res.data.data[0].id);
        }
      }
    } catch {
      toast.error('Failed to load tenants list');
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await axios.post('/api/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setImageUrl(res.data.data.url);
        setImageId(res.data.data.public_id);
        toast.success('Image uploaded successfully');
      } else {
        toast.error(res.data.message || 'Image upload failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (imageId) {
      try {
        await axios.delete(`/api/image?public_id=${imageId}`);
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err);
      }
    }
    setImageUrl('');
    setImageId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      return toast.error('Title is required');
    }
    if (!tenantId) {
      return toast.error('Tenant selection is required');
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        tenant_id: Number(tenantId),
        description,
        image: imageUrl || null,
        image_id: imageId || null,
      };

      const res = await axios.post('/api/staff/blogs', payload);

      if (res.data.success) {
        toast.success('Blog created successfully!');
        router.push('/panel/blogs');
      } else {
        toast.error(res.data.message || 'Failed to create blog');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create blog');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6">
      <Toaster position="top-center" />

      {/* Navigation & Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/panel/blogs"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors shrink-0 shadow-2xs"
            title="Back to Blogs List"
          >
            <FiArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Blog</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Fill out the details below to write and publish a blog article.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Blog Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10 Tips for Software Development in 2026"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-900"
              required
            />
          </div>

          {/* Tenant Selector (Mandatory Required) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FiGlobe className="text-primary" size={14} />
              Tenant (Required) <span className="text-rose-500">*</span>
            </label>
            {loadingTenants ? (
              <div className="h-12 bg-slate-50 border border-slate-200 rounded-2xl animate-pulse" />
            ) : (
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.url})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Featured Image Uploader */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Featured Image
            </label>

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-56 max-w-md group">
                <img
                  src={imageUrl}
                  alt="Blog featured image"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md hover:bg-rose-700 transition-colors"
                  >
                    <FiTrash2 size={14} />
                    <span>Remove Image</span>
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                {uploadingImage ? (
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <FiLoader className="animate-spin" size={20} />
                    <span>Uploading image...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <FiUploadCloud size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Click to upload cover image</p>
                      <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Description (Tiptap Rich Text Editor) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Blog Content / Description
            </label>
            <TiptapEditor
              value={description}
              onChange={(html) => setDescription(html)}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/panel/blogs"
            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                <span>Creating Blog...</span>
              </>
            ) : (
              <>
                <FiSave size={18} />
                <span>Publish Blog</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
