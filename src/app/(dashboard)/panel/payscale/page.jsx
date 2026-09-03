'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiSliders, FiPlus, FiTrash2, FiEdit2, FiX, FiCheck, FiArrowLeft
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';

export default function PayscalePage() {
  const [payscales, setPayscales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [form, setForm] = useState({
    grade_name: '',
    grade_level: 1,
    basic_salary: '',
    house_rent: '',
    medical_allowance: '',
    other_allowance: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayscales();
  }, []);

  const fetchPayscales = async () => {
    try {
      const res = await axios.get('/api/staff/payscale');
      if (res.data.success) {
        setPayscales(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load payscale grades');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({
      grade_name: '',
      grade_level: 1,
      basic_salary: '',
      house_rent: '',
      medical_allowance: '',
      other_allowance: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({
      grade_name: item.grade_name,
      grade_level: item.grade_level,
      basic_salary: item.basic_salary,
      house_rent: item.house_rent,
      medical_allowance: item.medical_allowance,
      other_allowance: item.other_allowance,
      description: item.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.grade_name.trim()) return toast.error('Grade Name is required');

    setSubmitting(true);
    try {
      if (editItem) {
        const res = await axios.patch('/api/staff/payscale', { id: editItem.id, ...form });
        if (res.data.success) {
          toast.success(res.data.message);
          fetchPayscales();
          setShowModal(false);
        }
      } else {
        const res = await axios.post('/api/staff/payscale', form);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchPayscales();
          setShowModal(false);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payscale grade scale? Staff assigned to this grade will be set to unassigned.')) return;
    try {
      const res = await axios.delete(`/api/staff/payscale?id=${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setPayscales(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const computedTotal = (Number(form.basic_salary) || 0) + (Number(form.house_rent) || 0) + (Number(form.medical_allowance) || 0) + (Number(form.other_allowance) || 0);

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
            <h1 className="text-2xl font-bold text-slate-900">Payscale Grade Scales</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Define standalone salary grade structures, basic components, and allowance allocations.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
        >
          <FiPlus size={14} /> Add Grade Scale
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editItem ? 'Edit Grade Scale' : 'Create New Grade Scale'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Grade Name *</label>
                  <input
                    type="text"
                    value={form.grade_name}
                    onChange={(e) => setForm({ ...form, grade_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                    placeholder="e.g. Senior Software Engineer"
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Grade Level</label>
                  <input
                    type="number"
                    min="1"
                    value={form.grade_level}
                    onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Basic Salary</label>
                  <input
                    type="number"
                    min="0"
                    value={form.basic_salary}
                    onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelCls}>House Rent</label>
                  <input
                    type="number"
                    min="0"
                    value={form.house_rent}
                    onChange={(e) => setForm({ ...form, house_rent: e.target.value })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Medical Allowance</label>
                  <input
                    type="number"
                    min="0"
                    value={form.medical_allowance}
                    onChange={(e) => setForm({ ...form, medical_allowance: e.target.value })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelCls}>Other Allowance</label>
                  <input
                    type="number"
                    min="0"
                    value={form.other_allowance}
                    onChange={(e) => setForm({ ...form, other_allowance: e.target.value })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Calculated Total Salary:</span>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(computedTotal)}</span>
              </div>

              <div>
                <label className={labelCls}>Description (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                  rows="2"
                  placeholder="Notes about grade requirements or position tier..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {submitting ? 'Saving...' : (editItem ? 'Update Grade' : 'Create Grade')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
          Loading payscale grade scales...
        </div>
      ) : payscales.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 space-y-2">
          <FiSliders size={32} className="mx-auto text-slate-300" />
          <p className="font-bold text-sm text-slate-700">No Payscale Grades Configured</p>
          <p className="text-xs text-slate-400">Click "Add Grade Scale" above to define master salary structures.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payscales.map((ps) => (
            <div key={ps.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Level {ps.grade_level}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(ps)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                      title="Edit Grade"
                    >
                      <FiEdit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(ps.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                      title="Delete Grade"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{ps.grade_name}</h3>
                  {ps.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{ps.description}</p>}
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Basic Salary:</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(ps.basic_salary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>House Rent:</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(ps.house_rent)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Medical Allowance:</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(ps.medical_allowance)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Other Allowance:</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(ps.other_allowance)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Grade Total Salary:</span>
                <span className="text-base font-bold text-emerald-600">{formatCurrency(ps.total_salary)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
