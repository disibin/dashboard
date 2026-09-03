'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiExternalLink, FiLoader, FiAlertCircle, FiPackage
} from 'react-icons/fi';

export default function UserProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/public/product/${slug}`);
      if (res.data.success) {
        setProduct(res.data.data);
      } else {
        toast.error(res.data.message || 'Product not found');
      }
    } catch {
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-400 space-y-3 max-w-xl mx-auto">
        <Toaster position="top-center" />
        <FiLoader className="animate-spin mx-auto text-primary" size={28} />
        <p className="text-xs font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-5 max-w-xl mx-auto text-center space-y-3">
        <Toaster position="top-center" />
        <FiAlertCircle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-base font-semibold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500">The requested product could not be found or has been removed.</p>
        <Link
          href="/user/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors"
        >
          <FiArrowLeft size={14} /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link
          href="/user/products"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium transition-colors"
        >
          <FiArrowLeft size={15} /> Back to Products
        </Link>
        <span className="text-xs font-mono text-slate-400">ID: #{product.id}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <FiPackage size={22} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{product.title || product.name}</h1>
            <p className="text-xs text-slate-400">Added {new Date(product.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {product.image && (
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        {product.link && (
          <div className="pt-2">
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              <span>Visit Live Product Demo</span>
              <FiExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
