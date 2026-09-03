'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiCreditCard, FiPlus, FiTrash2,
  FiX, FiCheckCircle,
  FiChevronDown, FiChevronUp, FiCheck
} from 'react-icons/fi';
import { CURRENCY, formatCurrency } from '@/lib/database/secret';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const [showGenForm, setShowGenForm] = useState(false);
  const [genForm, setGenForm] = useState({
    title: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    salaries: {},
  });
  const [submitting, setSubmitting] = useState(false);

  const [paySalaryId, setPaySalaryId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [payRes, staffRes] = await Promise.all([
        axios.get('/api/staff/payroll'),
        axios.get('/api/staff').catch(() => ({ data: { data: [] } })),
      ]);

      if (payRes.data.success) {
        setPayrolls(payRes.data.data);
        if (payRes.data.data.length > 0) {
          setExpandedId(payRes.data.data[0].id);
        }
      }
      if (staffRes.data.data) {
        setStaffList(staffRes.data.data);
        const initSal = {};
        staffRes.data.data.forEach((s) => {
          initSal[s.id] = 0;
        });
        setGenForm((prev) => ({ ...prev, salaries: initSal }));
      }
    } catch (err) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();

    const staffSalariesArray = Object.entries(genForm.salaries).map(([sId, amt]) => ({
      staff_id: Number(sId),
      amount: Number(amt) || 0,
    }));

    setSubmitting(true);
    try {
      const res = await axios.post('/api/staff/payroll', {
        title: genForm.title,
        month: genForm.month,
        year: genForm.year,
        staff_salaries: staffSalariesArray,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        fetchInitialData();
        setShowGenForm(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payroll generation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySalary = async (e, sal) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');

    setPaying(true);
    try {
      const res = await axios.patch('/api/staff/payroll', {
        salary_id: sal.id,
        amount: amt,
        payment_method: payMethod,
        note: payNote,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        fetchInitialData();
        setPaySalaryId(null);
        setPayAmount('');
        setPayNote('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this monthly payroll record and salary logs?')) return;
    try {
      const res = await axios.delete(`/api/staff/payroll?id=${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setPayrolls((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FiCreditCard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Payroll & Staff Salary</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage monthly staff payroll cycles, salary distributions, and payout statuses.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowGenForm(!showGenForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-md cursor-pointer"
        >
          {showGenForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showGenForm ? 'Close Generator' : 'Generate Monthly Payroll'}
        </button>
      </div>

      {showGenForm && (
        <div className="bg-white rounded-3xl p-7 border border-emerald-100 shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Generate Monthly Staff Payroll</h3>
            <button onClick={() => setShowGenForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleGeneratePayroll} className="space-y-4">
            <div>
              <label className={labelCls}>Payroll Title</label>
              <input
                type="text"
                value={genForm.title}
                onChange={(e) => setGenForm({ ...genForm, title: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Month (1-12)</label>
                <select
                  value={genForm.month}
                  onChange={(e) => setGenForm({ ...genForm, month: Number(e.target.value) })}
                  className={inputCls}
                >
                  {monthNames.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {idx + 1} - {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Year</label>
                <input
                  type="number"
                  value={genForm.year}
                  onChange={(e) => setGenForm({ ...genForm, year: Number(e.target.value) })}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Staff Salary Amounts ({CURRENCY})</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-3 border border-slate-200 rounded-2xl bg-slate-50/50">
                {staffList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <div>
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{s.role}</div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={genForm.salaries[s.id] || ''}
                      onChange={(e) =>
                        setGenForm((prev) => ({
                          ...prev,
                          salaries: { ...prev.salaries, [s.id]: e.target.value },
                        }))
                      }
                      className="input-style w-32 text-xs py-1 px-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGenForm(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <FiCheck size={16} />
                {submitting ? 'Generating...' : 'Generate Payroll Cycle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center text-slate-400">
          Loading payroll records...
        </div>
      ) : payrolls.length === 0 ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiCreditCard size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No payroll cycles created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payrolls.map((p) => {
            const isExpanded = expandedId === p.id;
            const salaries = Array.isArray(p.salaries) ? p.salaries : [];
            const totalPaid = salaries.reduce((acc, s) => acc + (s.paid_amount || 0), 0);
            const totalDue = salaries.reduce((acc, s) => acc + (s.due_amount || 0), 0);

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                      {p.month}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        {p.title}
                        <span
                          className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                            p.status === 'processed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Cycle: {monthNames[p.month - 1]} {p.year} · Generated by {p.creator_name || 'System'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-slate-900">{formatCurrency(p.total_amount)}</div>
                      <div className="text-xs text-slate-400">
                        Paid: {formatCurrency(totalPaid)} · Due: {formatCurrency(totalDue)}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    >
                      <FiTrash2 size={16} />
                    </button>

                    <div className="text-slate-400">
                      {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/30">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                      Staff Salary Breakdown ({salaries.length} Staff Members)
                    </h4>

                    {salaries.length === 0 ? (
                      <p className="text-xs italic text-slate-400">No staff salary records assigned</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                              <th className="py-3 px-4">Staff Member</th>
                              <th className="py-3 px-4">Role</th>
                              <th className="py-3 px-4">Salary Amount</th>
                              <th className="py-3 px-4">Paid / Due</th>
                              <th className="py-3 px-4">Payout Status</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {salaries.map((sal) => {
                              const isPayingThisSal = paySalaryId === sal.id;
                              return (
                                <React.Fragment key={sal.id}>
                                  <tr className="hover:bg-white transition-colors">
                                    <td className="py-3 px-4">
                                      <div className="font-semibold text-slate-900">{sal.staff_name}</div>
                                      <div className="text-xs text-slate-400">{sal.staff_email}</div>
                                    </td>

                                    <td className="py-3 px-4 text-xs font-semibold capitalize text-slate-600">
                                      {sal.staff_role}
                                    </td>

                                    <td className="py-3 px-4 font-semibold text-slate-900">{formatCurrency(sal.amount)}</td>

                                    <td className="py-3 px-4 text-xs">
                                      <span className="text-emerald-600 font-semibold">{formatCurrency(sal.paid_amount)}</span> /{' '}
                                      <span className="text-rose-500 font-semibold">{formatCurrency(sal.due_amount)}</span>
                                    </td>

                                    <td className="py-3 px-4">
                                      <span
                                        className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                                          sal.status === 'paid'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : sal.status === 'partially_paid'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-rose-100 text-rose-700'
                                        }`}
                                      >
                                        {sal.status}
                                      </span>
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                      {sal.due_amount > 0 ? (
                                        <button
                                          onClick={() => {
                                            setPaySalaryId(isPayingThisSal ? null : sal.id);
                                            setPayAmount(sal.due_amount);
                                          }}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all cursor-pointer"
                                        >
                                          {isPayingThisSal ? 'Cancel' : 'Pay Salary'}
                                        </button>
                                      ) : (
                                        <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                                          <FiCheckCircle size={14} /> Settled
                                        </span>
                                      )}
                                    </td>
                                  </tr>

                                  {isPayingThisSal && (
                                    <tr className="bg-emerald-50/50">
                                      <td colSpan="6" className="p-4 border-b border-emerald-100">
                                        <form
                                          onSubmit={(e) => handlePaySalary(e, sal)}
                                          className="flex flex-wrap items-center justify-end gap-3 text-xs"
                                        >
                                          <span className="font-semibold text-slate-700">
                                            Payout for {sal.staff_name} (Due: ${sal.due_amount}):
                                          </span>
                                          <input
                                            type="number"
                                            min="1"
                                            max={sal.due_amount}
                                            value={payAmount}
                                            onChange={(e) => setPayAmount(e.target.value)}
                                            className="input-style w-28 text-xs py-1.5"
                                            required
                                          />
                                          <select
                                            value={payMethod}
                                            onChange={(e) => setPayMethod(e.target.value)}
                                            className="input-style w-36 text-xs py-1.5"
                                          >
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="cash">Cash</option>
                                            <option value="check">Check</option>
                                            <option value="paypal">PayPal / Wire</option>
                                          </select>
                                          <input
                                            type="text"
                                            value={payNote}
                                            onChange={(e) => setPayNote(e.target.value)}
                                            className="input-style w-36 text-xs py-1.5"
                                          />
                                          <button
                                            type="submit"
                                            disabled={paying}
                                            className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
                                          >
                                            {paying ? 'Recording...' : 'Confirm Payout'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setPaySalaryId(null)}
                                            className="p-1.5 text-slate-400 hover:text-slate-600"
                                          >
                                            <FiX size={16} />
                                          </button>
                                        </form>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
