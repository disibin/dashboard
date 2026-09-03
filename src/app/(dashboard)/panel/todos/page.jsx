'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiCheckSquare, FiSquare, FiPlus, FiSearch, FiEdit2, FiTrash2,
  FiX, FiCalendar, FiClock, FiUser, FiCheckCircle, FiCheck
} from 'react-icons/fi';
import TiptapEditor from '@/component/helper/TiptapEditor';

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

  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenForm = (todo = null) => {
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
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTodo(null);
    setForm({ title: '', description: '', start_time: '', end_time: '' });
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
          handleCloseForm();
        }
      } else {
        const res = await axios.post('/api/staff/todos', form);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchTodos();
          handleCloseForm();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/staff/todos?id=${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setTodos((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
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
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FiCheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Staff To-Do Tasks</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Organize daily staff tasks with TipTap rich instructions and deadline tracking.
            </p>
          </div>
        </div>

        <button
          onClick={() => (showForm ? handleCloseForm() : handleOpenForm())}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-md cursor-pointer"
        >
          {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showForm ? 'Close Form' : 'Add New Task'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-7 border border-indigo-100 shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingTodo ? `Edit Task: "${editingTodo.title}"` : 'Create New To-Do Task'}
            </h3>
            <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Task Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Task Description & Checklist (TipTap Editor)</label>
              <TiptapEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
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
                {submitting ? 'Saving...' : editingTodo ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
          <FiSearch className="text-slate-400 ml-2" size={18} />
          <input
            type="text"
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
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
          <span className="text-2xl font-semibold text-indigo-600">{pendingCount}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</span>
          <span className="text-2xl font-semibold text-emerald-600">{completedCount}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'completed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {st} ({st === 'all' ? todos.length : st === 'pending' ? pendingCount : completedCount})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 space-y-3">
        {loading ? (
          <div className="p-4 text-center text-slate-400">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
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
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  todo.is_completed
                    ? 'bg-slate-50/50 border-slate-100 text-slate-400'
                    : 'bg-white border-slate-200/80 shadow-sm text-slate-900 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                  >
                    {todo.is_completed ? (
                      <FiCheckCircle size={22} className="text-emerald-500" />
                    ) : (
                      <FiSquare size={22} />
                    )}
                  </button>

                  <div className="space-y-1">
                    <h3
                      className={`text-base font-semibold transition-all ${
                        todo.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {todo.title}
                    </h3>

                    {todo.description && (
                      <div
                        className="text-xs text-slate-500 leading-relaxed prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{ __html: todo.description }}
                      />
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <FiUser size={12} /> {todo.staff_name || 'Staff'}
                      </span>
                      {startFmt && (
                        <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                          <FiClock size={12} /> Start: {startFmt}
                        </span>
                      )}
                      {endFmt && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold">
                          <FiCalendar size={12} /> End: {endFmt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-start">
                  <button
                    onClick={() => handleOpenForm(todo)}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                    title="Edit Task"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete task "${todo.title}"?`)) {
                        handleDelete(todo.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
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
    </div>
  );
}
