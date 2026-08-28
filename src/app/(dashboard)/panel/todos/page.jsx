'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiCheckSquare, FiSquare, FiPlus, FiSearch, FiEdit2, FiTrash2,
  FiX, FiCalendar, FiClock, FiUser, FiCheckCircle
} from 'react-icons/fi';

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : null;

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axios.get('/api/staff/todos');
      if (res.data.success) {
        setTodos(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch to-dos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (todo) => {
    const nextStatus = !todo.is_completed;
    try {
      const res = await axios.patch('/api/staff/todos', {
        id: todo.id,
        is_completed: nextStatus,
      });
      if (res.data.success) {
        toast.success(nextStatus ? 'Task completed!' : 'Task marked active');
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? { ...t, is_completed: nextStatus } : t))
        );
      }
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleOpenModal = (todo = null) => {
    if (todo) {
      setEditingTodo(todo);
      setForm({
        title: todo.title || '',
        description: todo.description || '',
        start_time: todo.start_time ? new Date(todo.start_time).toISOString().slice(0, 16) : '',
        end_time: todo.end_time ? new Date(todo.end_time).toISOString().slice(0, 16) : '',
      });
    } else {
      setEditingTodo(null);
      setForm({ title: '', description: '', start_time: '', end_time: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('To-do title is required');

    setSubmitting(true);
    try {
      if (editingTodo) {
        const res = await axios.put('/api/staff/todos', { id: editingTodo.id, ...form });
        if (res.data.success) {
          toast.success(res.data.message);
          fetchTodos();
          setShowModal(false);
        }
      } else {
        const res = await axios.post('/api/staff/todos', form);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchTodos();
          setShowModal(false);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/staff/todos?id=${deleteId}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setTodos((prev) => prev.filter((t) => t.id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = todos.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.staff_name || '').toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pending'
        ? !t.is_completed
        : t.is_completed;

    return matchSearch && matchFilter;
  });

  const pendingCount = todos.filter((t) => !t.is_completed).length;
  const completedCount = todos.filter((t) => t.is_completed).length;

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FiCheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Staff To-Do Tasks</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Organize daily staff responsibilities, schedules, start times, and deadline tracking.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
        >
          <FiPlus size={16} /> Add New Task
        </button>
      </div>

      {/* Stats & Search Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
          <FiSearch className="text-slate-400 ml-2" size={18} />
          <input
            type="text"
            placeholder="Search tasks by title, description or assigned staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-style text-sm flex-1 border-none shadow-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-slate-600">
              <FiX size={16} />
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</span>
          <span className="text-2xl font-extrabold text-indigo-600">{pendingCount}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</span>
          <span className="text-2xl font-extrabold text-emerald-600">{completedCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'pending', 'completed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filterStatus === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {st} ({st === 'all' ? todos.length : st === 'pending' ? pendingCount : completedCount})
          </button>
        ))}
      </div>

      {/* To-Do List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FiCheckSquare size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-sm">No to-do tasks found</p>
          </div>
        ) : (
          filtered.map((todo) => {
            const startFmt = fmtDateTime(todo.start_time);
            const endFmt = fmtDateTime(todo.end_time);

            return (
              <div
                key={todo.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  todo.is_completed
                    ? 'bg-slate-50/50 border-slate-100 text-slate-400'
                    : 'bg-white border-slate-200/80 shadow-sm text-slate-900 hover:border-indigo-300'
                }`}
              >
                {/* Checkbox & Task Info */}
                <div className="flex items-start gap-3.5 flex-1">
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                  >
                    {todo.is_completed ? (
                      <FiCheckCircle2 size={22} className="text-emerald-500" />
                    ) : (
                      <FiSquare size={22} />
                    )}
                  </button>

                  <div className="space-y-1">
                    <h3
                      className={`text-base font-bold transition-all ${
                        todo.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {todo.title}
                    </h3>
                    {todo.description && (
                      <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                        {todo.description}
                      </p>
                    )}

                    {/* Schedule / Time Badges */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <FiUser size={12} /> {todo.staff_name || 'Staff'}
                      </span>
                      {startFmt && (
                        <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                          <FiClock size={12} /> Start: {startFmt}
                        </span>
                      )}
                      {endFmt && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">
                          <FiCalendar size={12} /> End: {endFmt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleOpenModal(todo)}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Edit Task"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(todo.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Delete Task"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal — Add / Edit To-Do */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 border border-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTodo ? 'Edit To-Do Task' : 'Create New To-Do Task'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Deploy Database Migration"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Task Description</label>
                <textarea
                  rows={3}
                  placeholder="Task instructions or checklists..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Time</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>End Time / Deadline</label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTodo ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-7 border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <FiTrash2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Task?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this to-do task?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
