'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { use } from 'react';
import { FiArrowLeft, FiPackage } from 'react-icons/fi';
import Link from 'next/link';
import ProductForm from '@/component/forms/ProductForm';

const ProductEditPage = ({ params }) => {
  const { slug } = use(params);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`/api/staff/product/${slug}`);
      if (res.data.success) {
        setProduct(res.data.data);
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Failed to fetch product');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/panel/products"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors shrink-0 shadow-2xs"
            title="Back to Products"
          >
            <FiArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">
                {product?.name === 'enter title' ? 'New Product' : product?.name || 'Edit Product'}
              </h1>
              {product && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  product.is_published ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {product.is_published ? 'Published' : 'Draft'}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5 font-mono">{slug}</p>
          </div>
        </div>
      </div>

      {product ? (
        <ProductForm
          initialData={product}
          onCancel={() => window.history.back()}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <FiPackage size={36} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-bold text-slate-700">Product details loading or not found...</p>
          <Link href="/panel/products" className="text-primary hover:underline text-xs font-semibold mt-2 inline-block">
            Return to Products List
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductEditPage;
