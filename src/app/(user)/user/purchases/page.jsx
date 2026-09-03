'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  FiCreditCard, FiCheckCircle, FiClock, FiAlertCircle, FiSearch,
  FiFileText, FiShoppingBag, FiSlash, FiUploadCloud, FiX, FiCheck, FiLoader, FiTrash2
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrency, CURRENCY } from '@/lib/database/secret';
import { printReceipt } from '@/lib/printableSlip';

export default function UserPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [payModalItem, setPayModalItem] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [note, setNote] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await axios.get('/api/user/purchases');
      if (res.data.success) {
        setPurchases(res.data.data);
      }
    } catch {
      toast.error('Failed to load purchases data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!payModalItem) return;
    if (!transactionId.trim()) {
      toast.error('Transaction ID is required');
      return;
    }

    setSubmittingPay(true);
    try {
      const res = await axios.post('/api/user/purchases/pay', {
        purchase_id: payModalItem.purchase_id,
        order_id: payModalItem.order_id || undefined,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        sender_number: senderNumber.trim() || undefined,
        proof_url: proofUrl.trim() || undefined,
        note: note.trim() || undefined
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Payment submitted for verification!');
        setPayModalItem(null);
        setTransactionId('');
        setSenderNumber('');
        setProofUrl('');
        setNote('');
        fetchPurchases();
      } else {
        toast.error(res.data.message || 'Failed to submit payment proof');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error submitting payment proof');
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleDeletePurchase = async (item) => {
    const isCompleted = (item.payment_status || '').toLowerCase() === 'paid' || (item.purchase_status || '').toLowerCase() === 'complete';
    if (isCompleted) {
      toast.error('Completed purchases and confirmed payments cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete this purchase order (${item.package_title || item.order_id || 'Item'})?`)) return;

    try {
      const res = await axios.delete(`/api/user/purchases?purchase_id=${item.purchase_id}`);
      if (res.data.success) {
        toast.success('Purchase order deleted');
        setPurchases(prev => prev.filter(p => p.purchase_id !== item.purchase_id));
      } else {
        toast.error(res.data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete purchase');
    }
  };

  const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'paid':
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FiCheckCircle size={11} /> Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <FiClock size={11} /> Pending Verification
          </span>
        );
      case 'due':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <FiAlertCircle size={11} /> Balance Due
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <FiSlash size={11} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <FiAlertCircle size={11} /> Unpaid
          </span>
        );
    }
  };

  const filteredPurchases = purchases.filter((item) => {
    const query = searchQuery.toLowerCase();
    const titleMatch =
      (item.package_title || '').toLowerCase().includes(query) ||
      (item.order_id || '').toLowerCase().includes(query) ||
      (item.transaction_id || '').toLowerCase().includes(query);

    const s = (item.payment_status || item.purchase_status || '').toLowerCase();
    if (filterStatus === 'paid') return titleMatch && (s === 'paid' || s === 'complete');
    if (filterStatus === 'pending') return titleMatch && s === 'pending';
    if (filterStatus === 'due') return titleMatch && (s === 'due' || s === 'unpaid');
    if (filterStatus === 'rejected') return titleMatch && s === 'rejected';
    return titleMatch;
  });

  const totalSpent = purchases.reduce((sum, item) => sum + Number(item.paid || 0), 0);
  const totalDue = purchases.reduce((sum, item) => sum + Number(item.due || 0), 0);
  const completedCount = purchases.filter((item) => item.payment_status === 'paid' || item.purchase_status === 'complete').length;

  return (
    <div className="p-4 sm:p-4 md:p-5 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FiShoppingBag className="text-primary" /> My Purchases & Billing
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Track your package purchases, payment verification statuses, and invoices
          </p>
        </div>
        <Link
          href="/user/packages"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-dark transition-all shadow-sm"
        >
          <FiShoppingBag size={14} />
          Explore Packages
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
            <FiCreditCard size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Paid</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(totalSpent)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <FiCheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Orders</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{completedCount} Item{completedCount === 1 ? '' : 's'}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <FiAlertCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending / Due</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(totalDue)}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by package name, order ID, trx..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'paid', label: 'Paid' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'due', label: 'Due / Unpaid' },
            { id: 'rejected', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center text-slate-400 flex flex-col items-center gap-2">
          <FiLoader className="animate-spin text-primary" size={26} />
          <p className="text-xs font-medium">Loading purchases...</p>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center space-y-3">
          <FiShoppingBag size={32} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-700">No purchases found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'No orders match your search filters.' : 'You have not made any package purchases yet.'}
          </p>
          <Link
            href="/user/packages"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors"
          >
            Explore Packages
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPurchases.map((item) => {
            const netPrice = Math.max(0, (item.price || 0) - (item.discount || 0));
            const isPayable = item.payment_status === 'unpaid' || item.payment_status === 'due' || item.payment_status === 'rejected';

            return (
              <div
                key={item.purchase_id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-xl">
                      #{item.order_id || `PUR-${item.purchase_id}`}
                    </span>
                    <StatusBadge status={item.payment_status} />
                  </div>

                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                    {item.package_title || 'Custom Package'}
                  </h3>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Package Price:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(netPrice)}</span>
                    </div>
                    {item.paid > 0 && (
                      <div className="flex items-center justify-between text-emerald-600">
                        <span>Paid Amount:</span>
                        <span className="font-bold">{formatCurrency(item.paid)}</span>
                      </div>
                    )}
                    {item.due > 0 && (
                      <div className="flex items-center justify-between text-amber-600">
                        <span className="font-semibold">Remaining Due:</span>
                        <span className="font-bold">{formatCurrency(item.due)}</span>
                      </div>
                    )}
                    {item.transaction_id && (
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Trx ID:</span>
                        <span className="font-mono font-bold text-slate-700">{item.transaction_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <FiClock size={12} /> {new Date(item.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isPayable && (
                      <button
                        onClick={() => {
                          setPayModalItem(item);
                          setPaymentMethod(item.payment_method || 'bkash');
                          setTransactionId(item.transaction_id || '');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <FiUploadCloud size={13} /> Pay / Submit
                      </button>
                    )}

                    <button
                      onClick={() => printReceipt(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <FiFileText size={13} /> Print Slip
                    </button>

                    {!((item.payment_status || '').toLowerCase() === 'paid' || (item.purchase_status || '').toLowerCase() === 'complete') && (
                      <button
                        onClick={() => handleDeletePurchase(item)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Purchase"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {payModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiUploadCloud size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Submit Payment Proof</h3>
                  <p className="text-xs text-slate-500">Order #{payModalItem.order_id || payModalItem.purchase_id}</p>
                </div>
              </div>
              <button
                onClick={() => !submittingPay && setPayModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['bkash', 'nagad', 'bank_transfer', 'rocket', 'card', 'manual'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        paymentMethod === m ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Transaction ID / Reference <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. TRX91823719"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Sender Phone / Account (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 017XXXXXXXX"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Receipt / Screenshot URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="Any extra info..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModalItem(null)}
                  disabled={submittingPay}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay || !transactionId.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingPay ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                  Submit For Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
