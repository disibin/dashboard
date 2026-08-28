'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiFileText, FiPlus, FiSearch, FiEdit2, FiTrash2,
  FiX, FiUser, FiClock, FiCheck
} from 'react-icons/fi';
import TiptapEditor from '@/component/helper/TiptapEditor';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get('/api/staff/notes');
      if (res.data.success) {
        setNotes(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (note = null) => {
    if (note) {
      setEditingNote(note);
      setForm({ title: note.title, description: note.description || '' });
    } else {
      setEditingNote(null);
      setForm({ title: '', description: '' });
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingNote(null);
    setForm({ title: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Note title is required');

    setSubmitting(true);
    try {
      if (editingNote) {
        const res = await axios.put('/api/staff/notes', { id: editingNote.id, ...form });
        if (res.data.success) {
          toast.success(res.data.message);
          fetchNotes();
          handleCloseForm();
        }
      } else {
        const res = await axios.post('/api/staff/notes', form);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchNotes();
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
      const res = await axios.delete(`/api/staff/notes?id=${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.staff_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-6 w-full space-y-6">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiFileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Staff Notes</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Create and manage private work notes and docs with TipTap rich text editing.
            </p>
          </div>
        </div>

        <button
          onClick={() => (showForm ? handleCloseForm() : handleOpenForm())}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-md cursor-pointer"
        >
          {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showForm ? 'Close Editor' : 'New Staff Note'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-7 border border-indigo-100 shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingNote ? `Edit Note: "${editingNote.title}"` : 'Create New Staff Note'}
            </h3>
            <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Note Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Rich Content (TipTap Editor)</label>
              <TiptapEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
              />
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <FiCheck size={16} />
                {submitting ? 'Saving Note...' : editingNote ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Saved Notes</span>
          <span className="text-2xl font-semibold text-amber-600">{notes.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          Loading notes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiFileText size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No notes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">{note.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenForm(note)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                      title="Edit Note"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete note "${note.title}"?`)) {
                          handleDelete(note.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Delete Note"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                <div
                  className="text-xs text-slate-600 prose prose-slate max-w-none line-clamp-6 mb-4 leading-relaxed overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: note.description || '' }}
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-semibold">
                  <FiUser size={12} /> {note.staff_name || 'Staff'}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <FiClock size={12} /> {fmtDate(note.updated_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
