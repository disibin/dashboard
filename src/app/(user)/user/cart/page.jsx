'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiShoppingCart, FiTrash2, FiArrowLeft, FiShoppingBag,
  FiCreditCard, FiCheck, FiX, FiLoader, FiTag, FiBox
} from 'react-icons/fi';
import { formatCurrency, CURRENCY } from '@/lib/database/secret';

export default function UserCartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
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
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/cart');
      if (res.data.success) {
        setCartItems(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load cart');
      }
    } catch {
      toast.error('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (cartId, packageName) => {
    try {
      const res = await axios.delete(`/api/user/cart?cart_id=${cartId}`);
      if (res.data.success) {
        toast.success(`Removed "${packageName}" from cart`);
        setCartItems((prev) => prev.filter((item) => item.cart_id !== cartId));
      }
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) return;
    try {
      const res = await axios.delete('/api/user/cart?clear=true');
      if (res.data.success) {
        toast.success('Cart cleared');
        setCartItems([]);
      }
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!transactionId.trim()) {
      toast.error('Transaction ID is required for verification');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        package_ids: cartItems.map((item) => item.package_id),
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
        setCartItems([]);
        setTimeout(() => {
          router.push('/user/purchases');
        }, 800);
      } else {
        toast.error(res.data.message || 'Checkout failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to complete purchase');
    } finally {
      setSubmitting(false);
    }
  };

  // Pricing calculations
  const totalGross = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const totalNet = Math.max(0, totalGross - totalDiscount);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FiShoppingCart className="text-primary" /> My Package Cart
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review your selected packages and complete checkout
          </p>
        </div>

        <Link
          href="/user/packages"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <FiArrowLeft size={14} /> Continue Browsing
        </Link>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 text-center text-slate-400 flex flex-col items-center gap-2">
          <FiLoader className="animate-spin text-primary" size={28} />
          <p className="text-xs font-medium">Loading cart items...</p>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FiShoppingCart size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You haven't added any packages to your cart yet. Explore our software solutions and service packages to get started.
          </p>
          <Link
            href="/user/packages"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all"
          >
            <FiShoppingBag size={14} /> Explore Packages
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {cartItems.length} Package{cartItems.length === 1 ? '' : 's'} in Cart
              </span>
              <button
                onClick={handleClearCart}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <FiTrash2 size={13} /> Clear All
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {cartItems.map((item) => {
                const finalPrice = Math.max(0, (item.price || 0) - (item.discount || 0));

                return (
                  <div key={item.cart_id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <FiBox size={24} />
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {item.name}
                        </h3>
                        {item.tenant_name && (
                          <p className="text-[11px] text-slate-400">Platform: {item.tenant_name}</p>
                        )}
                        {item.discount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <FiTag size={9} /> Save {formatCurrency(item.discount)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-base font-bold text-slate-900 block">
                          {formatCurrency(finalPrice)}
                        </span>
                        {item.discount > 0 && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatCurrency(item.price)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.cart_id, item.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove package"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary & Checkout Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 lg:sticky lg:top-8">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <FiCreditCard className="text-primary" /> Order Summary
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({cartItems.length} items):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(totalGross)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Savings:</span>
                  <span className="font-bold">-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Estimated Total:</span>
                <span className="text-lg text-primary">{formatCurrency(totalNet)}</span>
              </div>
            </div>

            <button
              onClick={() => setCheckoutModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiShoppingBag size={16} />
              Proceed to Checkout ({formatCurrency(totalNet)})
            </button>

            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">🔒 Secure Checkout</p>
              <p>Your payment details will be verified by staff before your package deliverables are scheduled.</p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiCreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Order Checkout</h3>
                  <p className="text-xs text-slate-500">Payable: {formatCurrency(totalNet)}</p>
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
                  placeholder="e.g. 9J182947190"
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
                  placeholder="e.g. 017XXXXXXXX"
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
                  placeholder="https://... image link"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Order Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Any delivery instructions..."
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
