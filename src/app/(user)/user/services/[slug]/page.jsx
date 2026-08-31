'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiTool, FiLoader, FiAlertCircle, FiTag
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';

export default function UserServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug;

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchService();
  }, [slug]);

  const fetchService = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/public/service/${slug}`);
      if (res.data.success) {
        setService(res.data.data);
      } else {
        toast.error(res.data.message || 'Service not found');
      }
    } catch {
      toast.error('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 max-w-xl mx-auto">
        <Toaster position="top-center" />
        <FiLoader className="animate-spin mx-auto text-primary" size={28} />
        <p className="text-xs font-medium">Loading service details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-3">
        <Toaster position="top-center" />
        <FiAlertCircle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-base font-semibold text-slate-800">Service Not Found</h2>
        <p className="text-xs text-slate-500">The requested service could not be found or has been removed.</p>
        <Link
          href="/user/services"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
        >
          <FiArrowLeft size={14} /> Back to Services
        </Link>
      </div>
    );
  }

  const netPrice = Math.max(0, (service.price || 0) - (service.discount || 0));

  return (
    <div className="p-4 w-full space-y-6 max-w-4xl mx-auto">
      <Toaster position="top-center" />

      {/* Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link
          href="/user/services"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors"
        >
          <FiArrowLeft size={15} /> Back to Services
        </Link>
        <span className="text-xs font-mono text-slate-400">ID: #{service.id}</span>
      </div>

      {/* Service Details Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <FiTool size={20} />
              </span>
              <h1 className="text-xl font-bold text-slate-900">{service.name}</h1>
            </div>
            {service.tenant_name && (
              <p className="text-xs text-slate-500 pl-10">Platform: <span className="font-semibold text-slate-700">{service.tenant_name}</span></p>
            )}
          </div>

          {/* Pricing */}
          <div className="text-right bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[160px]">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-black text-slate-900">{formatCurrency(netPrice)}</span>
              {service.discount > 0 && (
                <span className="text-xs text-slate-400 line-through">{formatCurrency(service.price)}</span>
              )}
            </div>
            {service.discount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                <FiTag size={10} /> Save {formatCurrency(service.discount)}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Service Description</h3>
            <div
              className="text-xs leading-relaxed text-slate-700 prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: service.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
