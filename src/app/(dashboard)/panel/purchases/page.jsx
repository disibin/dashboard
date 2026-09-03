'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  FiShoppingBag, FiCheckCircle, FiAlertCircle, FiSearch, FiDollarSign,
  FiUser, FiClock, FiCheck, FiX, FiSlash, FiLoader, FiEye, FiTrash2,
  FiExternalLink, FiFileText, FiRefreshCw, FiBox, FiArrowRight
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrency } from '@/lib/database/secret';
import { printReceipt } from '@/lib/printableSlip';

export default function StaffPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [inspectPurchase, setInspectPurchase] = useState(null);
  const [printableItem, setPrintableItem] = useState(null);
  const [targetStatus, setTargetStatus] = useState('complete');
  const [createProject, setCreateProject] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/staff/purchases');
      if (res.data.success) {
        setPurchases(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load purchases');
      }
    } catch {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePurchase = async (e) => {
    e.preventDefault();
    if (!inspectPurchase) return;

    setUpdating(true);
    try {
      const payload = {
        purchase_id: inspectPurchase.purchase_id,
        status: targetStatus,
        create_project: createProject
      };

      const res = await axios.patch('/api/staff/purchases', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Order status updated successfully!');
        setInspectPurchase(null);
        fetchPurchases();
      } else {
        toast.error(res.data.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePurchase = async (purchaseId) => {
    if (!confirm('Are you sure you want to delete this purchase order record? This cannot be undone.')) return;
    try {
      const res = await axios.delete(`/api/staff/purchases?purchase_id=${purchaseId}`);
      if (res.data.success) {
        toast.success('Purchase order deleted');
        if (inspectPurchase?.purchase_id === purchaseId) setInspectPurchase(null);
        fetchPurchases();
      } else {
        toast.error(res.data.message || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete purchase record');
    }
  };

  const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FiCheckCircle size={11} /> Complete
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <FiClock size={11} /> Pending Check
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <FiSlash size={11} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <FiAlertCircle size={11} /> Incomplete
          </span>
        );
    }
  };

  const filteredPurchases = purchases.filter((item) => {
    const textMatch = (
      (item.user_name || '') + ' ' +
      (item.user_email || '') + ' ' +
      (item.order_id || '') + ' ' +
      (item.package_name || '') + ' ' +
      (item.transaction_id || '')
    ).toLowerCase().includes(searchQuery.toLowerCase());

    const s = (item.purchase_status || '').toLowerCase();
    if (statusFilter === 'all') return textMatch;
    if (statusFilter === 'complete') return textMatch && s === 'complete';
    if (statusFilter === 'pending') return textMatch && s === 'pending';
    if (statusFilter === 'incomplete') return textMatch && (s === 'incomplete' || !s);
    if (statusFilter === 'cancelled') return textMatch && s === 'cancelled';
    return textMatch;
  });

  const totalSales = purchases.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const completeCount = purchases.filter(i => (i.purchase_status || '').toLowerCase() === 'complete').length;
  const pendingCount = purchases.filter(i => (i.purchase_status || '').toLowerCase() === 'pending').length;
  const incompleteCount = purchases.filter(i => (i.purchase_status || '').toLowerCase() === 'incomplete' || !i.purchase_status).length;

  return (
    <div className="p-4 sm:p-4 md:p-5 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
            <FiShoppingBag className="text-primary" /> Package Purchases & Orders
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Inspect package orders, verify customer purchases, and provision project deliverables
          </p>
        </div>

        <button
          onClick={fetchPurchases}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
          Refresh Orders
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <FiDollarSign size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Sales Volume</p>
            <h3 className="text-xl font-semibold text-slate-900 mt-0.5">{formatCurrency(totalSales)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
            <FiCheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Orders</p>
            <h3 className="text-xl font-semibold text-slate-900 mt-0.5">{completeCount} Orders</h3>
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
          <div className="p-3.5 rounded-xl bg-slate-100 text-slate-600">
            <FiBox size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Incomplete Drafts</p>
            <h3 className="text-xl font-semibold text-slate-900 mt-0.5">{incompleteCount} Items</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by client, order ID, package..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'complete', label: 'Completed' },
            { id: 'pending', label: `Pending Check (${pendingCount})` },
            { id: 'incomplete', label: 'Incomplete' },
            { id: 'cancelled', label: 'Cancelled' }
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
            <p className="text-xs font-medium">Loading purchase records...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="py-4 text-center space-y-2">
            <FiFileText size={32} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-700">No purchases found</h3>
            <p className="text-xs text-slate-500">There are no purchase orders matching your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Net Price</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((item) => (
                  <tr key={item.purchase_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/panel/purchases/${item.purchase_id || item.id}`} className="font-mono font-semibold text-slate-900 hover:text-primary block">
                        Purchase #{item.purchase_id || item.id}
                      </Link>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                          {(item.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/panel/users/${encodeURIComponent(item.user_email || '')}`} className="font-semibold text-slate-800 hover:text-primary block truncate">
                            {item.user_name || 'User'}
                          </Link>
                          <p className="text-[10px] text-slate-400 truncate">{item.user_email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.package_image && (
                          <img src={item.package_image} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-100 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-900 truncate">
                          {item.package_name || 'Package'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatCurrency(item.price)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-800 block text-[11px]">
                        {item.payment_method ? item.payment_method.replace('_', ' ') : 'Pending'}
                      </span>
                      {item.transaction_id && (
                        <span className="font-mono text-[10px] text-slate-500 block truncate max-w-[120px]">
                          {item.transaction_id}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={item.purchase_status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/panel/purchases/${item.purchase_id || item.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <FiEye size={12} /> Inspect Details
                        </Link>

                        <button
                          onClick={() => printReceipt(item)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Print Payment Slip"
                        >
                          <FiFileText size={13} />
                        </button>

                        <button
                          onClick={() => handleDeletePurchase(item.purchase_id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Order"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {inspectPurchase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Order Verification</h3>
                  <p className="text-xs text-slate-500">Purchase #{inspectPurchase.purchase_id || inspectPurchase.id}</p>
                </div>
              </div>
              <button
                onClick={() => !updating && setInspectPurchase(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdatePurchase} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Select Order Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'complete', label: 'Complete Order' },
                    { id: 'pending', label: 'Pending Review' },
                    { id: 'incomplete', label: 'Incomplete Draft' },
                    { id: 'cancelled', label: 'Cancel Order' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTargetStatus(s.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                        targetStatus === s.id
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="createProjectCb"
                  checked={createProject}
                  onChange={(e) => setCreateProject(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="createProjectCb" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Auto-create Project Discussion Workspace
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectPurchase(null)}
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-dark text-white shadow-md flex items-center gap-1.5"
                >
                  {updating ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                  Confirm Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
