'use client';

import React, { useState, useEffect, use } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import {
  FiArrowLeft,
  FiBookOpen,
  FiGlobe,
  FiUser,
  FiCalendar,
  FiClock,
  FiShare2,
  FiCheck
} from 'react-icons/fi';

export default function UserSingleBlogPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/public/blogs/${slug}`);
      if (res.data.success) {
        setBlog(res.data.data);
      } else {
        toast.error(res.data.message || 'Blog post not found');
      }
    } catch {
      toast.error('Failed to load blog article');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Article link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const getReadingTime = (htmlString) => {
    if (!htmlString) return '1 min read';
    const text = htmlString.replace(/<[^>]+>/g, '');
    const words = text.split(/\s+/).length;
    const mins = Math.ceil(words / 200);
    return `${mins} min read`;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-white rounded-xl animate-pulse" />
        <div className="h-64 bg-white rounded-3xl animate-pulse" />
        <div className="h-96 bg-white rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-8 w-full max-w-4xl mx-auto text-center space-y-4">
        <Toaster position="top-center" />
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <FiBookOpen size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Blog Article Not Found</h1>
        <p className="text-slate-500 text-sm">
          The requested article could not be found or may have been removed.
        </p>
        <Link
          href="/user/blogs"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary-dark transition-all"
        >
          <FiArrowLeft size={16} />
          <span>Back to All Blogs</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto space-y-8">
      <Toaster position="top-center" />

      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/user/blogs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-primary hover:bg-slate-50 rounded-2xl text-xs font-semibold transition-all shadow-2xs"
        >
          <FiArrowLeft size={14} />
          <span>Back to Blogs</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-2xl text-xs font-semibold transition-all shadow-2xs"
        >
          {copied ? <FiCheck className="text-emerald-500" size={14} /> : <FiShare2 size={14} />}
          <span>{copied ? 'Copied Link' : 'Share Article'}</span>
        </button>
      </div>

      {/* Article Header Card */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        {/* Tenant Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <FiGlobe size={13} />
          <span>{blog.tenant_name || 'Tenant Article'}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
          {blog.title}
        </h1>

        {/* Author & Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {(blog.creator_name || 'S')[0]}
            </div>
            <span>{blog.creator_name || 'Editorial Team'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <FiCalendar size={14} className="text-slate-400" />
            <span>
              {new Date(blog.created_at).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <FiClock size={14} className="text-slate-400" />
            <span>{getReadingTime(blog.description)}</span>
          </div>
        </div>

        {/* Featured Image */}
        {blog.image && (
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 max-h-[450px]">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Blog Content HTML */}
        <div className="pt-4 text-slate-800 leading-relaxed text-sm sm:text-base space-y-4">
          {blog.description ? (
            <div
              className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-primary prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: blog.description }}
            />
          ) : (
            <p className="text-slate-400 italic">No content description provided for this article.</p>
          )}
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="flex justify-center pt-4">
        <Link
          href="/user/blogs"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
        >
          <FiArrowLeft size={16} />
          <span>Explore More Articles</span>
        </Link>
      </div>
    </div>
  );
}
