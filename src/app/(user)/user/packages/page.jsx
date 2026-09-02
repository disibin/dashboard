'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiBox, FiSearch, FiX, FiShoppingBag, FiCheck,
  FiLoader, FiCreditCard, FiTrash2, FiShoppingCart
} from 'react-icons/fi';
import PackageCard from '@/component/user/cards/PackageCard';
import { CURRENCY, formatCurrency } from '@/lib/database/secret';

export default function UserPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Cart IDs stored in DB
  const [cartPackageIds, setCartPackageIds] = useState([]);

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPackages, setCheckoutPackages] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPackagesAndCart();
  }, []);

  const fetchPackagesAndCart = async () => {
    setLoading(true);
    try {
      const [pkgRes, cartRes] = await Promise.all([
        axios.get('/api/public/package'),
        axios.get('/api/user/cart').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (pkgRes.data.success) {
        setPackages(pkgRes.data.data);
      }

      if (cartRes?.data?.success && Array.isArray(cartRes.data.data)) {
        setCartPackageIds(cartRes.data.data.map((item) => item.package_id));
      }
    } catch {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  // Add to DB user_cart
  const handleAddToCart = async (pkg) => {
    const isAlreadyInCart = cartPackageIds.includes(pkg.id);

    try {
      if (isAlreadyInCart) {
        toast('Already in your cart!', { icon: '🛒' });
      } else {
        const res = await axios.post('/api/user/cart', { package_id: pkg.id });
        if (res.data.success) {
          setCartPackageIds((prev) => [...prev, pkg.id]);
          toast.success(`Added "${pkg.name}" to cart!`);
        }
      }
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  // Buy Now: Add to DB cart and redirect directly to /user/cart
  const handleBuyNow = async (pkg) => {
    try {
      if (!cartPackageIds.includes(pkg.id)) {
        await axios.post('/api/user/cart', { package_id: pkg.id });
        setCartPackageIds((prev) => [...prev, pkg.id]);
      }
      router.push('/user/cart');
    } catch {
      router.push('/user/cart');
    }
  };

  const handleOpenMultiCheckout = () => {
    const selectedPkgs = packages.filter((p) => cartPackageIds.includes(p.id));
    if (selectedPkgs.length === 0) {
      toast.error('Your cart is empty. Add packages to cart first.');
      return;
    }
    setCheckoutPackages(selectedPkgs);
    setCheckoutModalOpen(true);
  };

  const handleRemoveFromCheckout = async (pkgId) => {
    const updated = checkoutPackages.filter((p) => p.id !== pkgId);
    setCheckoutPackages(updated);
    setCartPackageIds((prev) => prev.filter((id) => id !== pkgId));
    await axios.delete(`/api/user/cart?package_id=${pkgId}`).catch(() => {});
    if (updated.length === 0) {
      setCheckoutModalOpen(false);
    }
  };

  const handleCompleteCheckout = async (e) => {
    e.preventDefault();
    if (checkoutPackages.length === 0) {
      toast.error('No packages selected for purchase');
      return;
    }

    if (!transactionId.trim()) {
      toast.error('Please enter the Transaction ID / Reference for payment verification');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        package_ids: checkoutPackages.map((p) => p.id),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        sender_number: senderNumber.trim() || undefined,
        note: orderNote.trim() || undefined,
        proof_url: proofUrl.trim() || undefined
      };

      const res = await axios.post('/api/user/packages/checkout', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Order submitted successfully!');
        setCartPackageIds([]);
        setCheckoutModalOpen(false);
        setTimeout(() => {
          router.push('/user/purchases');
        }, 800);
      } else {
        toast.error(res.data.message || 'Checkout failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to complete checkout');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = packages.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.tenant_name || '').toLowerCase().includes(search.toLowerCase())
  );

  // Totals calculation
  const totalCartGross = checkoutPackages.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const totalCartDiscount = checkoutPackages.reduce((sum, p) => sum + Number(p.discount || 0), 0);
  const totalCartNet = Math.max(0, totalCartGross - totalCartDiscount);

  const cartCount = cartPackageIds.length;
  const cartTotalAmount = packages
    .filter((p) => cartPackageIds.includes(p.id))
    .reduce((sum, p) => sum + Math.max(0, Number(p.price || 0) - Number(p.discount || 0)), 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 pb-24">
      <Toaster position="top-center" />

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiBox size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Software & Service Packages</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Choose single packages or add multiple packages to your cart to purchase together.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/user/cart"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs cursor-pointer shrink-0"
          >
            <FiShoppingCart size={15} />
            <span>My Cart</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {cartCount > 0 && (
            <button
              onClick={handleOpenMultiCheckout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-dark transition-all shadow-sm cursor-pointer shrink-0"
            >
              <FiShoppingBag size={15} />
              Checkout ({cartCount}) • {formatCurrency(cartTotalAmount)}
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 max-w-md">
        <FiSearch className="text-slate-400 ml-2" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search packages by title or platform..."
          className="input-style text-xs flex-1 border-none shadow-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-slate-600">
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400 flex flex-col items-center gap-2">
          <FiLoader className="animate-spin text-primary" size={26} />
          <p className="text-xs">Loading available packages...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiBox size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No packages match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((pkg, idx) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={idx}
              isSelected={cartPackageIds.includes(pkg.id)}
              onToggleSelect={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          ))}
        </div>
      )}

      {/* Sticky Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {cartCount}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Packages in your cart</p>
                <p className="text-base font-bold text-white">
                  Total: {formatCurrency(cartTotalAmount)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/user/cart"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                View Cart
              </Link>
              <button
                onClick={handleOpenMultiCheckout}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <FiShoppingBag size={14} />
                Checkout Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Purchase & Payment Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiCreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Checkout & Payment</h3>
                  <p className="text-xs text-slate-500">
                    {checkoutPackages.length === 1 ? '1 Package' : `${checkoutPackages.length} Packages`} selected for purchase
                  </p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setCheckoutModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Itemized Order Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Order Summary ({checkoutPackages.length} items)
              </span>

              <div className="divide-y divide-slate-200/60 max-h-40 overflow-y-auto pr-1">
                {checkoutPackages.map((pkg) => {
                  const net = Math.max(0, (pkg.price || 0) - (pkg.discount || 0));
                  return (
                    <div key={pkg.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{pkg.name}</p>
                        {pkg.discount > 0 && (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            Discount: -{CURRENCY}{pkg.discount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-slate-900">{CURRENCY}{net}</span>
                        {checkoutPackages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCheckout(pkg.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700">Total Payable:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatCurrency(totalCartNet)}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleCompleteCheckout} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Payment Method <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'bkash', label: 'bKash' },
                    { id: 'nagad', label: 'Nagad' },
                    { id: 'bank_transfer', label: 'Bank Transfer' },
                    { id: 'rocket', label: 'Rocket' },
                    { id: 'card', label: 'Credit Card' },
                    { id: 'manual', label: 'Other / Manual' }
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
                  placeholder="e.g., 9J8472910X or Bank Transfer Slip Ref"
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
                  placeholder="e.g., 017XXXXXXXX or Account Name"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Payment Slip / Receipt Image Link <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://... image link or drive receipt"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Order Instructions / Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Any special remarks or deadline notes..."
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
                  Confirm & Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
