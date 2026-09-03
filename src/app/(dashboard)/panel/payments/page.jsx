'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  FiCreditCard, FiCheckCircle, FiAlertCircle, FiSearch, FiDollarSign,
  FiUser, FiClock, FiCheck, FiX, FiSlash, FiLoader, FiEye, FiTrash2,
  FiExternalLink, FiFileText, FiRefreshCw
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrency, CURRENCY } from '@/lib/database/secret';
import { printReceipt } from '@/lib/printableSlip';

export default function StaffPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [inspectPayment, setInspectPayment] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve'); 
  const [partialAmount, setPartialAmount] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const [printableItem, setPrintableItem] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/staff/payments');
      if (res.data.success) {
        setPayments(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load payments');
      }
    } catch {
      toast.error('Failed to load payment transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessVerification = async (e) => {
    e.preventDefault();
    if (!inspectPayment) return;

    setUpdating(true);
    try {
      const payload = {
        payment_id: inspectPayment.payment_id,
        action: reviewAction,
        paid: reviewAction === 'partial' ? Number(partialAmount) : undefined,
        note: reviewNote.trim() || undefined
      };

      const res = await axios.patch('/api/staff/payments', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Payment updated successfully!');
        setInspectPayment(null);
        setPartialAmount('');
        setReviewNote('');
        fetchPayments();
      } else {
        toast.error(res.data.message || 'Verification update failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update payment');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment record? This cannot be undone.')) return;
    try {
      const res = await axios.delete(`/api/staff/payments?payment_id=${paymentId}`);
      if (res.data.success) {
        toast.success('Payment transaction deleted');
        if (inspectPayment?.payment_id === paymentId) setInspectPayment(null);
        fetchPayments();
      } else {
        toast.error(res.data.message || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete transaction');
    }
  };

  const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FiCheckCircle size={11} /> Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <FiClock size={11} /> Pending Check
          </span>
        );
      case 'due':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FiAlertCircle size={11} /> Due Balance
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <FiSlash size={11} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <FiAlertCircle size={11} /> Unpaid
          </span>
        );
    }
  };

  const filteredPayments = payments.filter((item) => {
    const textMatch = (
      (item.user_name || '') + ' ' +
      (item.user_email || '') + ' ' +
      (item.order_id || '') + ' ' +
      (item.transaction_id || '') + ' ' +
      (item.sender_number || '') + ' ' +
      (item.payment_method || '')
    ).toLowerCase().includes(searchQuery.toLowerCase());

    const s = (item.payment_status || '').toLowerCase();
    if (statusFilter === 'all') return textMatch;
    if (statusFilter === 'pending') return textMatch && s === 'pending';
    if (statusFilter === 'paid') return textMatch && s === 'paid';
    if (statusFilter === 'due') return textMatch && (s === 'due' || s === 'unpaid');
    if (statusFilter === 'rejected') return textMatch && s === 'rejected';
    return textMatch;
  });

  const totalRevenue = payments.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);
  const totalOutstanding = payments.reduce((sum, item) => sum + Number(item.due_amount || 0), 0);
  const pendingCount = payments.filter((item) => (item.payment_status || '').toLowerCase() === 'pending').length;
  const paidCount = payments.filter((item) => (item.payment_status || '').toLowerCase() === 'paid').length;

  return (
    <div className="p-4 sm:p-4 md:p-5 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
            <FiCreditCard className="text-primary" /> Payment Management & Verification
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Verify customer transaction IDs, approve orders, and manage financial ledgers
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
          Refresh Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <FiDollarSign size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</p>
            <h3 className="text-xl font-semibold text-slate-900 mt-0.5">{formatCurrency(totalRevenue)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <FiClock size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Review</p>
            <h3 className="text-xl font-semibold text-amber-600 mt-0.5">{pendingCount} Action{pendingCount === 1 ? '' : 's'}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
            <FiAlertCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Due Balance</p>
            <h3 className="text-xl font-semibold text-slate-900 mt-0.5">{formatCurrency(totalOutstanding)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600">
            <FiCheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Payments</p>
            <h3 className="text-xl font-semibold text-slate-900 mt-0.5">{paidCount} Paid</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by client, order ID, trx..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'pending', label: `Pending Check (${pendingCount})` },
            { id: 'paid', label: 'Paid' },
            { id: 'due', label: 'Due' },
            { id: 'rejected', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-4 text-center text-slate-400 flex flex-col items-center gap-2">
            <FiLoader className="animate-spin text-primary" size={26} />
            <p className="text-xs font-medium">Loading ledger records...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-4 text-center space-y-2">
            <FiFileText size={32} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-700">No transactions found</h3>
            <p className="text-xs text-slate-500">There are no payment records matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Order / ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Deliverables / Items</th>
                  <th className="py-3 px-4">Method & Trx ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((item) => {
                  const itemsList = Array.isArray(item.items) ? item.items : [];
                  const isPending = (item.payment_status || '').toLowerCase() === 'pending';

                  return (
                    <tr key={item.payment_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        {item.purchase_id ? (
                          <Link
                            href={`/panel/purchases/${item.purchase_id}`}
                            className="font-mono font-semibold text-slate-900 hover:text-primary block"
                            title="View Purchase Details"
                          >
                            Purchase #{item.purchase_id}
                          </Link>
                        ) : (
                          <span className="font-mono font-semibold text-slate-900 block">
                            Payment #{item.payment_id || item.id}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-xs">
                            {(item.user_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{item.user_name}</p>
                            <p className="text-[10px] text-slate-400">{item.user_email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-[200px]">
                        {itemsList.length > 0 ? (
                          <div className="space-y-0.5">
                            {itemsList.map((p, idx) => (
                              <p key={idx} className="font-medium text-slate-800 truncate">
                                • {p.package_name || 'Package'}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Custom Purchase</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="capitalize font-semibold text-slate-800 block text-[11px]">
                            {item.payment_method ? item.payment_method.replace('_', ' ') : 'Manual'}
                          </span>
                          {item.transaction_id ? (
                            <span className="font-mono text-[11px] font-semibold text-primary block">
                              {item.transaction_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">No Trx ID</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block text-sm">
                          {formatCurrency(item.total_price)}
                        </span>
                        {item.due_amount > 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold block">
                            Due: {formatCurrency(item.due_amount)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={item.payment_status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setInspectPayment(item);
                              setReviewAction('approve');
                              setPartialAmount(String(item.due_amount || item.total_price));
                              setReviewNote('');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                              isPending
                                ? 'bg-primary hover:bg-primary-dark text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <FiEye size={12} />
                            {isPending ? 'Check & Verify' : 'Details'}
                          </button>

                          <button
                            onClick={() => printReceipt(item)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Print Payment Slip"
                          >
                            <FiFileText size={13} />
                          </button>

                          <button
                            onClick={() => handleDeletePayment(item.payment_id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {inspectPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiCreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Payment Verification</h3>
                  {inspectPayment.purchase_id ? (
                    <Link
                      href={`/panel/purchases/${inspectPayment.purchase_id}`}
                      target="_blank"
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mt-0.5"
                    >
                      Purchase #{inspectPayment.purchase_id}
                      <FiExternalLink size={11} />
                    </Link>
                  ) : (
                    <p className="text-xs text-slate-500">Payment #{inspectPayment.payment_id || inspectPayment.id}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => !updating && setInspectPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Customer:</span>
                <span className="font-semibold text-slate-800">{inspectPayment.user_name}</span>
                <p className="text-[11px] text-slate-500">{inspectPayment.user_email}</p>
                {inspectPayment.user_phone && (
                  <p className="text-[11px] text-slate-500">{inspectPayment.user_phone}</p>
                )}
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Payment Status:</span>
                <div className="mt-0.5"><StatusBadge status={inspectPayment.payment_status} /></div>
                <p className="text-[11px] text-slate-500 mt-1">Date: {new Date(inspectPayment.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Purchased Packages
              </span>
              <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-100 divide-y divide-slate-100">
                {(Array.isArray(inspectPayment.items) && inspectPayment.items.length > 0 ? inspectPayment.items : [{ package_name: 'Custom Order', price: inspectPayment.total_price }]).map((p, i) => (
                  <div key={i} className="py-1.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{p.package_name}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(p.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs bg-amber-50/30 p-4 rounded-2xl border border-amber-100/60">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                Customer Submitted Payment Info
              </span>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-400">Method: </span>
                  <strong className="capitalize text-slate-800">{inspectPayment.payment_method ? inspectPayment.payment_method.replace('_', ' ') : 'Manual'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Transaction ID: </span>
                  <strong className="font-mono text-primary">{inspectPayment.transaction_id || 'None Provided'}</strong>
                </div>
                {inspectPayment.sender_number && (
                  <div>
                    <span className="text-slate-400">Sender Account: </span>
                    <strong className="text-slate-800">{inspectPayment.sender_number}</strong>
                  </div>
                )}
                {inspectPayment.proof_url && (
                  <div className="col-span-2">
                    <span className="text-slate-400">Proof Screenshot: </span>
                    <a
                      href={inspectPayment.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold inline-flex items-center gap-1 ml-1"
                    >
                      View Receipt Link <FiExternalLink size={11} />
                    </a>
                  </div>
                )}
                {inspectPayment.note && (
                  <div className="col-span-2 pt-1">
                    <span className="text-slate-400 block font-medium">Customer Note:</span>
                    <p className="text-slate-700 bg-white/70 p-2 rounded-xl border border-amber-100 mt-0.5">
                      {inspectPayment.note}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleProcessVerification} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Verification Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'approve', label: 'Approve (Paid)', icon: FiCheck, color: 'hover:border-emerald-500' },
                    { id: 'partial', label: 'Partial Payment', icon: FiDollarSign, color: 'hover:border-blue-500' },
                    { id: 'reject', label: 'Reject / Invalid', icon: FiSlash, color: 'hover:border-rose-500' }
                  ].map((act) => {
                    const Icon = act.icon;
                    const isSel = reviewAction === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setReviewAction(act.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSel
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : `bg-white text-slate-700 border-slate-200 ${act.color}`
                        }`}
                      >
                        <Icon size={13} />
                        {act.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {reviewAction === 'partial' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Received Amount ({CURRENCY})
                  </label>
                  <input
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="Enter received amount..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Staff Verification Remark / Note <span className="text-slate-400 font-normal">(Sent to customer if rejected or partial)</span>
                </label>
                <input
                  type="text"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    reviewAction === 'reject'
                      ? 'e.g. Transaction ID was not found on our bank statement.'
                      : 'Optional remarks or verification reference...'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectPayment(null)}
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : reviewAction === 'reject'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  {updating ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
