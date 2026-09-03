'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiShoppingBag, FiArrowLeft, FiUser, FiMail, FiPhone, FiMapPin,
  FiCheckCircle, FiClock, FiSlash, FiAlertCircle, FiCreditCard,
  FiExternalLink, FiBox, FiCheck, FiLoader, FiFolder, FiDollarSign,
  FiFileText, FiRefreshCw
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrency } from '@/lib/database/secret';
import { printReceipt } from '@/lib/printableSlip';

export default function SinglePurchaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  const [reviewAction, setReviewAction] = useState('complete');
  const [createProject, setCreateProject] = useState(true);

  useEffect(() => {
    if (rawId) fetchDetails();
  }, [rawId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/staff/purchases/${encodeURIComponent(rawId)}`);
      if (res.data.success) {
        setData(res.data.data);
      } else {
        toast.error(res.data.message || 'Purchase record not found');
      }
    } catch {
      toast.error('Failed to load purchase order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (statusVal) => {
    if (!data?.purchase) return;

    setUpdating(true);
    try {
      const payload = {
        purchase_id: data.purchase.purchase_id,
        status: statusVal,
        create_project: createProject
      };

      const res = await axios.patch('/api/staff/purchases', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Order status updated successfully!');
        fetchDetails();
      } else {
        toast.error(res.data.message || 'Failed to update order');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FiCheckCircle size={12} /> Order Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <FiClock size={12} /> Pending Review
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <FiSlash size={12} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <FiAlertCircle size={12} /> Incomplete Order
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-4 w-full min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Toaster position="top-center" />
        <FiLoader className="animate-spin text-primary" size={32} />
        <p className="text-sm font-medium text-slate-500">Loading purchase order details...</p>
      </div>
    );
  }

  if (!data || !data.purchase) {
    return (
      <div className="p-4 w-full max-w-xl mx-auto text-center py-12 space-y-4">
        <Toaster position="top-center" />
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <FiAlertCircle size={36} className="mx-auto text-rose-500" />
          <h2 className="text-xl font-bold text-slate-900">Purchase Order Not Found</h2>
          <p className="text-xs text-slate-500">No order record matches ID "{rawId}".</p>
          <Link
            href="/panel/purchases"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-primary transition-all shadow-md"
          >
            <FiArrowLeft size={14} /> Back to Purchases
          </Link>
        </div>
      </div>
    );
  }

  const { purchase, payments = [], features = [], project } = data;
  const mainPayment = payments[0] || null;

  return (
    <div className="p-4 sm:p-4 md:p-5 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between gap-4">
        <Link
          href="/panel/purchases"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
        >
          <FiArrowLeft size={15} /> Back to Purchase Orders
        </Link>

        <button
          onClick={fetchDetails}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
        >
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Order #{purchase.order_id || purchase.purchase_id}
            </h1>
            <StatusBadge status={purchase.purchase_status} />
          </div>
          <p className="text-xs text-slate-500">
            Placed on {new Date(purchase.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => printReceipt(purchase)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-primary text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <FiFileText size={13} /> Print Payment Slip
          </button>

          {purchase.purchase_status !== 'complete' && (
            <button
              onClick={() => handleUpdateStatus('complete')}
              disabled={updating}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {updating ? <FiLoader className="animate-spin" size={13} /> : <FiCheck size={13} />}
              Mark Complete
            </button>
          )}

          {purchase.purchase_status !== 'cancelled' && (
            <button
              onClick={() => handleUpdateStatus('cancelled')}
              disabled={updating}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FiSlash size={13} /> Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FiBox className="text-primary" /> Package & Order Deliverables
            </h2>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {purchase.package_image ? (
                <img
                  src={purchase.package_image}
                  alt={purchase.package_name}
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-100 shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FiBox size={32} />
                </div>
              )}

              <div className="space-y-1.5 min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900">{purchase.package_name || 'Software Package'}</h3>
                {purchase.package_description && (
                  <p className="text-xs text-slate-500 leading-relaxed">{purchase.package_description}</p>
                )}

                <div className="flex items-center gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Package Price</span>
                    <span className="font-bold text-slate-900">{formatCurrency(purchase.price)}</span>
                  </div>

                  {purchase.discount > 0 && (
                    <div>
                      <span className="text-slate-400 block">Discount Savings</span>
                      <span className="font-bold text-emerald-600">-{formatCurrency(purchase.discount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {features.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block">Included Deliverable Features ({features.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {features.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <FiCheckCircle className={f.value !== false ? "text-emerald-500 shrink-0" : "text-slate-300 shrink-0"} size={14} />
                      <span className="font-medium text-slate-800">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FiCreditCard className="text-sky-600" /> Payment Transaction Details
            </h2>

            {!mainPayment ? (
              <p className="text-xs text-slate-400 py-2">No payment transaction records linked to this order.</p>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Payment Method</span>
                    <span className="font-bold capitalize text-slate-800">{mainPayment.payment_method ? mainPayment.payment_method.replace('_', ' ') : 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Transaction ID</span>
                    <span className="font-mono font-bold text-primary">{mainPayment.transaction_id || 'None'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Paid Amount</span>
                    <span className="font-bold text-slate-900">{formatCurrency(mainPayment.paid || mainPayment.price || purchase.price)}</span>
                  </div>

                  {mainPayment.sender_number && (
                    <div>
                      <span className="text-slate-400 block">Sender Phone</span>
                      <span className="font-semibold text-slate-800">{mainPayment.sender_number}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block">Payment Status</span>
                    <span className="font-bold uppercase text-emerald-700">{mainPayment.status}</span>
                  </div>
                </div>

                {mainPayment.proof_url && (
                  <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100 space-y-2">
                    <span className="font-bold text-amber-800 block">Payment Proof Document</span>
                    <a
                      href={mainPayment.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-primary font-bold text-xs hover:underline shadow-xs"
                    >
                      View Attached Receipt <FiExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FiUser className="text-primary" /> Customer Info
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                  {(purchase.user_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{purchase.user_name || 'User'}</p>
                  <p className="text-slate-400 font-mono text-[11px]">User #{purchase.user_id}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block">Email Address</span>
                  <a href={`mailto:${purchase.user_email}`} className="font-semibold text-slate-800 hover:text-primary truncate block">
                    {purchase.user_email}
                  </a>
                </div>

                <div>
                  <span className="text-slate-400 block">Phone Number</span>
                  <span className="font-semibold text-slate-800">{purchase.user_phone || 'N/A'}</span>
                </div>

                {purchase.user_city && (
                  <div>
                    <span className="text-slate-400 block">Location</span>
                    <span className="font-semibold text-slate-800">{[purchase.user_city, purchase.user_country].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href={`/panel/users/${encodeURIComponent(purchase.user_email || '')}`}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-primary text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FiUser size={13} /> View Full Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FiFolder className="text-primary" /> Project Workspace
            </h2>

            {project ? (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-900">{project.title}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                    {project.status}
                  </span>
                </div>
                <Link
                  href={`/panel/projects/${project.id}`}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  Open Project Discussion <FiExternalLink size={13} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500 leading-relaxed">
                  No active project workspace discussion is linked to this purchase order yet.
                </p>
                <button
                  onClick={() => handleUpdateStatus(purchase.purchase_status || 'complete')}
                  disabled={updating}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {updating ? <FiLoader className="animate-spin" size={13} /> : <FiFolder size={13} />}
                  Provision Project Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
