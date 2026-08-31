'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiCheck, FiLoader, FiAlertCircle, FiBox, FiPlay, FiTag
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';

export default function UserPackageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug;

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (slug) fetchPackage();
  }, [slug]);

  const fetchPackage = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/public/package/${slug}`);
      if (res.data.success) {
        setPkg(res.data.data);
      } else {
        toast.error(res.data.message || 'Package not found');
      }
    } catch {
      toast.error('Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async () => {
    if (!pkg?.id) return;
    setStarting(true);
    try {
      const res = await axios.post('/api/user/packages/start', { package_id: pkg.id });
      if (res.data.success) {
        toast.success('Project started! Redirecting to project chat...');
        const chat = res.data.data.chat;
        if (chat?.id) {
          router.push(`/user/projects/${chat.id}`);
        } else {
          router.push('/user/projects');
        }
      } else {
        toast.error(res.data.message || 'Failed to start project');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start project');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 max-w-xl mx-auto">
        <Toaster position="top-center" />
        <FiLoader className="animate-spin mx-auto text-primary" size={28} />
        <p className="text-xs font-medium">Loading package details...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-3">
        <Toaster position="top-center" />
        <FiAlertCircle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-base font-semibold text-slate-800">Package Not Found</h2>
        <p className="text-xs text-slate-500">The requested package could not be found or has been removed.</p>
        <Link
          href="/user/packages"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
        >
          <FiArrowLeft size={14} /> Back to Packages
        </Link>
      </div>
    );
  }

  const netPrice = Math.max(0, (pkg.price || 0) - (pkg.discount || 0));

  return (
    <div className="p-4 w-full space-y-6 max-w-4xl mx-auto">
      <Toaster position="top-center" />

      {/* Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link
          href="/user/packages"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors"
        >
          <FiArrowLeft size={15} /> Back to Packages
        </Link>
        <span className="text-xs font-mono text-slate-400">ID: #{pkg.id}</span>
      </div>

      {/* Card Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FiBox size={20} />
              </span>
              <h1 className="text-xl font-bold text-slate-900">{pkg.name}</h1>
            </div>
            {pkg.tenant_name && (
              <p className="text-xs text-slate-500 pl-10">Platform: <span className="font-semibold text-slate-700">{pkg.tenant_name}</span></p>
            )}
          </div>

          {/* Pricing */}
          <div className="text-right bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[160px]">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-black text-slate-900">{formatCurrency(netPrice)}</span>
              {pkg.discount > 0 && (
                <span className="text-xs text-slate-400 line-through">{formatCurrency(pkg.price)}</span>
              )}
            </div>
            {pkg.discount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                <FiTag size={10} /> Save {formatCurrency(pkg.discount)}
              </span>
            )}
          </div>
        </div>

        {/* Image Preview if available */}
        {pkg.image && (
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Description */}
        {pkg.description && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Package Details</h3>
            <div
              className="text-xs leading-relaxed text-slate-700 prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: pkg.description }}
            />
          </div>
        )}

        {/* Features Checklist */}
        {pkg.features && pkg.features.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Included Features & Scope</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pkg.features.map((feat) => (
                <div key={feat.id} className="flex items-center gap-2 text-xs text-slate-700 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FiCheck size={12} />
                  </span>
                  <span>{feat.feature_name} {feat.value ? `: ${feat.value}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleStartProject}
            disabled={starting}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {starting ? <FiLoader className="animate-spin" size={16} /> : <FiPlay size={16} />}
            <span>Start Project Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
