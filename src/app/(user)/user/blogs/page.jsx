'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import {
  FiBookOpen,
  FiSearch,
  FiGlobe,
  FiUser,
  FiCalendar,
  FiArrowRight,
  FiClock
} from 'react-icons/fi';

export default function UserBlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [tenantsList, setTenantsList] = useState([]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await axios.get('/api/public/blogs');
      if (res.data.success) {
        setBlogs(res.data.data);
        const tenants = Array.from(
          new Set(res.data.data.map((b) => JSON.stringify({ id: b.tenant_id, name: b.tenant_name })))
        ).map((t) => JSON.parse(t));
        setTenantsList(tenants);
      }
    } catch {
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(search.toLowerCase()) ||
      (blog.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (blog.tenant_name || '').toLowerCase().includes(search.toLowerCase());

    const matchesTenant = selectedTenant ? String(blog.tenant_id) === String(selectedTenant) : true;

    return matchesSearch && matchesTenant;
  });

  const getExcerpt = (htmlString) => {
    if (!htmlString) return '';
    const cleanText = htmlString.replace(/<[^>]+>/g, '');
    return cleanText.length > 130 ? cleanText.substring(0, 130) + '...' : cleanText;
  };

  const getReadingTime = (htmlString) => {
    if (!htmlString) return '1 min read';
    const text = htmlString.replace(/<[^>]+>/g, '');
    const words = text.split(/\s+/).length;
    const mins = Math.ceil(words / 200);
    return `${mins} min read`;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8">
      <Toaster position="top-center" />

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTenant('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedTenant === ''
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Blogs
          </button>
          {tenantsList.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTenant(String(t.id))}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedTenant === String(t.id)
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FiGlobe size={12} />
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blog Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-white rounded-3xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FiBookOpen size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No blog posts found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            We couldn't find any articles matching your search criteria. Check back soon for new updates!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/user/blogs/${blog.slug}`}
              className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Cover Image */}
                <div className="h-52 bg-slate-100 relative overflow-hidden">
                  {blog.image ? (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-gradient-to-br from-primary/10 via-slate-50 to-primary/20">
                      <FiBookOpen size={40} className="text-primary" />
                      <span className="text-xs font-semibold text-slate-400">Read Article</span>
                    </div>
                  )}

                  {/* Tenant Tag Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-primary shadow-sm flex items-center gap-1.5 border border-slate-100">
                    <FiGlobe size={12} />
                    <span>{blog.tenant_name || 'Tenant'}</span>
                  </div>
                </div>

                {/* Article Info */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <FiCalendar size={13} />
                      {new Date(blog.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FiClock size={13} />
                      {getReadingTime(blog.description)}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {blog.title}
                  </h2>

                  <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                    {getExcerpt(blog.description)}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-primary group-hover:text-primary-dark">
                <span className="flex items-center gap-1.5">
                  <FiUser size={13} className="text-slate-400" />
                  <span className="text-slate-700">{blog.creator_name || 'Editorial Team'}</span>
                </span>

                <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Read Post</span>
                  <FiArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
