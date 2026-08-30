'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import {
  FiBookOpen,
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiGlobe,
  FiUser,
  FiCalendar,
  FiExternalLink,
  FiFilter
} from 'react-icons/fi';

export default function BlogsManagerPage() {
  const [blogs, setBlogs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [blogsRes, tenantsRes] = await Promise.all([
        axios.get('/api/staff/blogs'),
        axios.get('/api/staff/tenants').catch(() => ({ data: { success: false } })),
      ]);

      if (blogsRes.data.success) {
        setBlogs(blogsRes.data.data);
      }
      if (tenantsRes.data.success) {
        setTenants(tenantsRes.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete blog "${title}"?`)) return;

    setDeletingId(id);
    try {
      const res = await axios.delete(`/api/staff/blogs?id=${id}`);
      if (res.data.success) {
        toast.success('Blog deleted successfully');
        setBlogs((prev) => prev.filter((b) => b.id !== id));
      } else {
        toast.error(res.data.message || 'Failed to delete blog');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete blog');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(search.toLowerCase()) ||
      blog.slug.toLowerCase().includes(search.toLowerCase()) ||
      (blog.tenant_name || '').toLowerCase().includes(search.toLowerCase());

    const matchesTenant = selectedTenant ? String(blog.tenant_id) === String(selectedTenant) : true;

    return matchesSearch && matchesTenant;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FiBookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Blog Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Create, edit, and publish blog articles for specific tenants.
            </p>
          </div>
        </div>

        <Link
          href="/panel/blogs/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all shadow-md shadow-primary/20 shrink-0"
        >
          <FiPlus size={18} />
          <span>Create New Blog</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, slug or tenant..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold shrink-0">
            <FiFilter size={14} />
            <span>Tenant:</span>
          </div>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="w-full md:w-56 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800 font-medium"
          >
            <option value="">All Tenants</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Blogs List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse p-4" />
          ))}
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FiBookOpen size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No blogs found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {search || selectedTenant ? 'Try adjusting your search or filter.' : 'Get started by creating your first blog article!'}
          </p>
          {!search && !selectedTenant && (
            <Link
              href="/panel/blogs/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:bg-primary-dark transition-all mt-2"
            >
              <FiPlus size={16} />
              <span>Create Blog</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Image Banner */}
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  {blog.image ? (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-gradient-to-br from-primary/10 to-slate-100">
                      <FiBookOpen size={36} className="text-primary" />
                      <span className="text-xs font-semibold">No Image</span>
                    </div>
                  )}

                  {/* Tenant Tag */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary shadow-sm flex items-center gap-1.5 border border-slate-100">
                    <FiGlobe size={12} />
                    <span>{blog.tenant_name || 'Tenant'}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h2 className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug hover:text-primary transition-colors">
                    {blog.title}
                  </h2>

                  <p className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg truncate border border-slate-100">
                    /{blog.slug}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <FiUser size={13} className="text-slate-400" />
                      {blog.creator_name || 'Staff'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiCalendar size={13} className="text-slate-400" />
                      {new Date(blog.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/user/blogs/${blog.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <FiExternalLink size={13} />
                  <span>Preview</span>
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/panel/blogs/${blog.id}`}
                    className="p-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-primary transition-all text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FiEdit size={14} />
                    <span>Edit</span>
                  </Link>

                  <button
                    onClick={() => handleDelete(blog.id, blog.title)}
                    disabled={deletingId === blog.id}
                    className="p-2 rounded-xl text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FiTrash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
