'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiDollarSign, FiPrinter, FiArrowLeft
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';
import { printSalarySlip } from '@/lib/printableSlip';

export default function MySalaryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySalary();
  }, []);

  const fetchMySalary = async () => {
    try {
      const res = await axios.get('/api/staff/my-salary');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load salary history');
    } finally {
      setLoading(false);
    }
  };

  const staff = data?.staff;
  const summary = data?.summary;
  const payments = data?.payments || [];

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
            <h1 className="text-2xl font-bold text-slate-900">My Salary & Payout History</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              View your assigned grade scale, net monthly salary, paid amounts, remaining balance, and print payslips.
            </p>
          </div>
        </div>
      </div>

      {!loading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assigned Payscale</span>
            <div className="text-xl font-bold text-slate-900">{summary.grade_name}</div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Monthly Net Salary</span>
            <div className="text-xl font-bold text-slate-900">{formatCurrency(summary.net_salary)}</div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Total Disbursed (Paid)</span>
            <div className="text-xl font-bold text-emerald-600">{formatCurrency(summary.total_paid)}</div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">Total Remaining Due</span>
            <div className="text-xl font-bold text-rose-600">{formatCurrency(summary.total_due)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
          Loading your salary history...
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 space-y-2">
          <FiDollarSign size={32} className="mx-auto text-slate-300" />
          <p className="font-semibold text-sm text-slate-700">No salary payment records found</p>
          <p className="text-xs text-slate-400">Monthly salary payment entries generated for your account will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiDollarSign className="text-emerald-600" /> Monthly Salary Ledgers ({payments.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Salary Cycle</th>
                  <th className="p-3">Assigned Amount</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Remaining Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((sal) => (
                  <tr key={sal.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">
                      <div>Cycle {sal.month}/{sal.year}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SAL-{sal.id}</div>
                    </td>

                    <td className="p-3 font-bold text-slate-900">{formatCurrency(sal.amount)}</td>

                    <td className="p-3 font-bold text-emerald-600">{formatCurrency(sal.paid_amount)}</td>

                    <td className="p-3 font-bold text-rose-600">{formatCurrency(sal.due_amount)}</td>

                    <td className="p-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                          sal.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : sal.status === 'partially_paid'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sal.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => printSalarySlip(sal, staff)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FiPrinter size={12} /> Print Payslip
                      </button>
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
