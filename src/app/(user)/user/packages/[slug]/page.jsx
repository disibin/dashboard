'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiCheck, FiLoader, FiAlertCircle, FiBox,
  FiShoppingBag, FiTag, FiX, FiCreditCard, FiShoppingCart
} from 'react-icons/fi';
import { formatCurrency, CURRENCY } from '@/lib/database/secret';

export default function UserPackageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug;

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleAddToCart = async () => {
    if (!pkg?.id) return;
    try {
      const res = await axios.post('/api/user/cart', { package_id: pkg.id });
      if (res.data.success) {
        toast.success(`"${pkg.name}" added to cart!`);
      }
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!pkg?.id) return;
    try {
      await axios.post('/api/user/cart', { package_id: pkg.id });
      router.push('/user/cart');
    } catch {
      router.push('/user/cart');
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!pkg?.id) return;

    if (!transactionId.trim()) {
      toast.error('Please enter the Transaction ID / Reference');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        package_ids: [pkg.id],
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        sender_number: senderNumber.trim() || undefined,
        note: orderNote.trim() || undefined,
        proof_url: proofUrl.trim() || undefined
      };

      const res = await axios.post('/api/user/packages/checkout', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Order placed successfully!');
        setCheckoutModalOpen(false);
        setTimeout(() => {
          router.push('/user/purchases');
        }, 800);
      } else {
        toast.error(res.data.message || 'Failed to place order');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to complete purchase');
    } finally {
      setSubmitting(false);
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
    <div className="p-4 w-full space-y-6">
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

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full sm:flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiShoppingCart size={16} />
            <span>Add to Cart</span>
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="w-full sm:flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiShoppingBag size={16} />
            <span>Buy Now • {formatCurrency(netPrice)}</span>
          </button>
        </div>
      </div>

      {/* Checkout Modal for this package */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiCreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Purchase {pkg.name}</h3>
                  <p className="text-xs text-slate-500">Total Payable: {formatCurrency(netPrice)}</p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setCheckoutModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Payment Method <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bkash', label: 'bKash' },
                    { id: 'nagad', label: 'Nagad' },
                    { id: 'bank_transfer', label: 'Bank' },
                    { id: 'rocket', label: 'Rocket' },
                    { id: 'card', label: 'Card' },
                    { id: 'manual', label: 'Other' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        paymentMethod === m.id
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Transaction ID / Bank Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRX192847190"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Sender Phone / Account Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01XXXXXXXXX"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Payment Slip / Proof Link <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://... image url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Special Instructions / Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Notes for the team..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !transactionId.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
