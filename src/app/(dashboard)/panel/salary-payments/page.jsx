'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiCreditCard, FiPrinter, FiCheckCircle, FiX, FiArrowLeft, FiPlus, FiTrash2
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';
import { printSalarySlip } from '@/lib/printableSlip';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SalaryPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [payModalItem, setPayModalItem] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payTrxId, setPayTrxId] = useState('');
  const [payNote, setPayNote] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);
  const [generatingDues, setGeneratingDues] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth, selectedYear]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/staff/salary-payments?month=${selectedMonth}&year=${selectedYear}`);
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load salary payment ledgers');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDues = async () => {
    setGeneratingDues(true);
    try {
      const res = await axios.post('/api/staff/salary-payments', {
        month: selectedMonth,
        year: selectedYear
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchPayments();
      }
    } catch (err) {
      toast.error('Failed to generate monthly salary dues');
    } finally {
      setGeneratingDues(false);
    }
  };

  const handleOpenPay = (item) => {
    setPayModalItem(item);
    setPayAmount(item.due_amount);
    setPayMethod('bank_transfer');
    setPayTrxId('');
    setPayNote('');
  };

  const handleSubmitPay = async (e) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');

    setSubmittingPay(true);
    try {
      const res = await axios.patch('/api/staff/salary-payments', {
        payment_id: payModalItem.id,
        amount: amt,
        payment_method: payMethod,
        transaction_id: payTrxId,
        note: payNote
      });

      if (res.data.success) {
        toast.success(res.data.message);
        fetchPayments();
        setPayModalItem(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment disbursement failed');
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this salary payment record?')) return;
    try {
      const res = await axios.delete(`/api/staff/salary-payments?id=${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setPayments(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const totalAssigned = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
  const totalDue = payments.reduce((sum, p) => sum + Number(p.due_amount || 0), 0);

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-primary transition-colors bg-white font-mono';
  const labelCls = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/panel"
            className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
          >
            <FiArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Salary Payouts & Ledger</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Disburse monthly staff salaries, record payment details, track due balances, and print payslips.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>{idx + 1} - {m}</option>
              ))}
            </select>

            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-20 px-2 py-2 border border-slate-200 rounded-xl text-xs bg-white font-mono text-center font-semibold"
            />
          </div>

          <button
            onClick={handleGenerateDues}
            disabled={generatingDues}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <FiPlus size={14} />
            {generatingDues ? 'Generating...' : 'Trigger Month Dues'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Salary Dues</span>
          <div className="text-xl font-bold text-slate-900">{formatCurrency(totalAssigned)}</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Total Disbursed (Paid)</span>
          <div className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">Total Remaining Due</span>
          <div className="text-xl font-bold text-rose-600">{formatCurrency(totalDue)}</div>
        </div>
      </div>

      {payModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Disburse Salary Payment</h3>
                <p className="text-xs text-slate-500">{payModalItem.staff_name} ({monthNames[payModalItem.month - 1]} {payModalItem.year})</p>
              </div>
              <button onClick={() => setPayModalItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPay} className="space-y-3">
              <div>
                <label className={labelCls}>Payout Amount (Max: {formatCurrency(payModalItem.due_amount)}) *</label>
                <input
                  type="number"
                  min="1"
                  max={payModalItem.due_amount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bkash">bKash / Nagad</option>
                  <option value="paypal">PayPal / Wire</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Transaction Ref / ID (Optional)</label>
                <input
                  type="text"
                  value={payTrxId}
                  onChange={(e) => setPayTrxId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-mono"
                  placeholder="e.g. TRX99281726"
                />
              </div>

              <div>
                <label className={labelCls}>Note / Remarks (Optional)</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                  placeholder="e.g. Salary payout for current month"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalItem(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                >
                  <FiCheckCircle size={14} />
                  {submittingPay ? 'Processing...' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
          Loading salary payment ledger...
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 space-y-2">
          <FiCreditCard size={32} className="mx-auto text-slate-300" />
          <p className="font-bold text-sm text-slate-700">No Salary Dues for {monthNames[selectedMonth - 1]} {selectedYear}</p>
          <p className="text-xs text-slate-400">Click "Trigger Month Dues" to generate salary payment entries for active staff members.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiCreditCard className="text-emerald-600" /> Salary Payout Ledgers ({monthNames[selectedMonth - 1]} {selectedYear})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Assigned Grade</th>
                  <th className="p-3">Salary Amount</th>
                  <th className="p-3">Paid / Due</th>
                  <th className="p-3">Method / Trx ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{item.staff_name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{item.staff_role} · {item.staff_email}</div>
                    </td>

                    <td className="p-3">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                        {item.grade_name || 'Custom Scale'}
                      </span>
                    </td>

                    <td className="p-3 font-bold text-slate-900">{formatCurrency(item.amount)}</td>

                    <td className="p-3">
                      <span className="text-emerald-600 font-bold">{formatCurrency(item.paid_amount)}</span> /{' '}
                      <span className="text-rose-600 font-bold">{formatCurrency(item.due_amount)}</span>
                    </td>

                    <td className="p-3 text-slate-600">
                      {item.payment_method ? (
                        <div>
                          <div className="font-semibold uppercase text-[10px] text-slate-700">{item.payment_method.replace(/_/g, ' ')}</div>
                          {item.transaction_id && <div className="font-mono text-[10px] text-slate-400">{item.transaction_id}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending Payout</span>
                      )}
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : item.status === 'partially_paid'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => printSalarySlip(item, { name: item.staff_name, email: item.staff_email, role: item.staff_role })}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Print Payslip Voucher"
                        >
                          <FiPrinter size={13} />
                        </button>

                        {item.due_amount > 0 ? (
                          <button
                            onClick={() => handleOpenPay(item)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all cursor-pointer"
                          >
                            Pay Salary
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <FiCheckCircle size={14} /> Settled
                          </span>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Record"
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
        </div>
      )}
    </div>
  );
}
