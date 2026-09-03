'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiUsers, FiEdit2, FiX, FiCheck, FiArrowLeft, FiSliders
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';

export default function StaffSalaryPage() {
  const [staffSalaries, setStaffSalaries] = useState([]);
  const [payscales, setPayscales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    payscale_id: '',
    custom_bonus: 0,
    custom_deduction: 0,
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [ssRes, psRes] = await Promise.all([
        axios.get('/api/staff/staff-salary'),
        axios.get('/api/staff/payscale')
      ]);

      if (ssRes.data.success) {
        setStaffSalaries(ssRes.data.data);
      }
      if (psRes.data.success) {
        setPayscales(psRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load staff salary assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({
      payscale_id: item.payscale_id || '',
      custom_bonus: item.custom_bonus || 0,
      custom_deduction: item.custom_deduction || 0,
      status: item.salary_status || 'active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    setSubmitting(true);
    try {
      const res = await axios.post('/api/staff/staff-salary', {
        staff_id: editItem.staff_id,
        payscale_id: form.payscale_id ? Number(form.payscale_id) : null,
        custom_bonus: Number(form.custom_bonus || 0),
        custom_deduction: Number(form.custom_deduction || 0),
        status: form.status
      });

      if (res.data.success) {
        toast.success(res.data.message);
        fetchInitialData();
        setEditItem(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update staff salary');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPayscale = payscales.find(p => p.id === Number(form.payscale_id));
  const baseGradeTotal = selectedPayscale ? Number(selectedPayscale.total_salary) : 0;
  const computedNet = Math.max(0, baseGradeTotal + Number(form.custom_bonus || 0) - Number(form.custom_deduction || 0));

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
            <h1 className="text-2xl font-bold text-slate-900">Staff Salary Assignments</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Assign standalone payscale grades to staff members and configure individual bonuses and deductions.
            </p>
          </div>
        </div>

        <Link
          href="/panel/payscale"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer"
        >
          <FiSliders size={14} /> Manage Payscale Grades
        </Link>
      </div>

      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Staff Salary</h3>
                <p className="text-xs text-slate-500">{editItem.staff_name} ({editItem.staff_role})</p>
              </div>
              <button onClick={() => setEditItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={labelCls}>Payscale Grade Scale</label>
                <select
                  value={form.payscale_id}
                  onChange={(e) => setForm({ ...form, payscale_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                >
                  <option value="">-- Unassigned (Custom Only) --</option>
                  {payscales.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.grade_name} (Level {ps.grade_level}) - {formatCurrency(ps.total_salary)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Custom Bonus</label>
                  <input
                    type="number"
                    min="0"
                    value={form.custom_bonus}
                    onChange={(e) => setForm({ ...form, custom_bonus: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Custom Deduction</label>
                  <input
                    type="number"
                    min="0"
                    value={form.custom_deduction}
                    onChange={(e) => setForm({ ...form, custom_deduction: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Salary Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                >
                  <option value="active">Active (Include in Monthly Dues)</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Grade Base Total:</span>
                  <span>{formatCurrency(baseGradeTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Bonus / Deduction:</span>
                  <span>+{formatCurrency(form.custom_bonus)} / -{formatCurrency(form.custom_deduction)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
                  <span>Final Net Salary:</span>
                  <span className="text-emerald-600">{formatCurrency(computedNet)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <FiCheck size={14} />
                  {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
          Loading staff salary assignments...
        </div>
      ) : staffSalaries.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 space-y-2">
          <FiUsers size={32} className="mx-auto text-slate-300" />
          <p className="font-bold text-sm text-slate-700">No Staff Members Found</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiUsers className="text-sky-600" /> Active Staff Salary Roster ({staffSalaries.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Assigned Grade</th>
                  <th className="p-3">Grade Base</th>
                  <th className="p-3">Bonus / Deduction</th>
                  <th className="p-3">Computed Net Salary</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffSalaries.map((item) => (
                  <tr key={item.staff_id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{item.staff_name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{item.staff_role} · {item.staff_email}</div>
                    </td>

                    <td className="p-3">
                      {item.grade_name ? (
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                          {item.grade_name} (Level {item.grade_level})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="p-3 font-mono font-semibold text-slate-800">
                      {formatCurrency(item.payscale_total || 0)}
                    </td>

                    <td className="p-3 text-slate-600">
                      <span className="text-emerald-600 font-semibold">+{formatCurrency(item.custom_bonus || 0)}</span> /{' '}
                      <span className="text-rose-500 font-semibold">-{formatCurrency(item.custom_deduction || 0)}</span>
                    </td>

                    <td className="p-3 font-bold text-base text-emerald-600">
                      {formatCurrency(item.net_salary || 0)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          item.salary_status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.salary_status || 'unconfigured'}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-white font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FiEdit2 size={12} /> Configure
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
