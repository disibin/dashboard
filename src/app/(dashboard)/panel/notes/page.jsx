'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiFileText, FiPlus, FiSearch, FiEdit2, FiTrash2,
  FiX, FiCalendar, FiUser, FiClock
} from 'react-icons/fi';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleOpenModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setForm({ title: note.title, description: note.description || '' });
    } else {
      setEditingNote(null);
      setForm({ title: '', description: '' });
    }
    setShowModal(true);
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
          setShowModal(false);
        }
      } else {
        const res = await axios.post('/api/staff/notes', form);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchNotes();
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
      const res = await axios.delete(`/api/staff/notes?id=${deleteId}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setNotes((prev) => prev.filter((n) => n.id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.staff_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiFileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Staff Notes</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Create and manage private work notes, operational docs, and quick references.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
        >
          <FiPlus size={16} /> New Staff Note
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
          <FiSearch className="text-slate-400 ml-2" size={18} />
          <input
            type="text"
            placeholder="Search notes by title, description or author..."
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
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Saved Notes</span>
          <span className="text-2xl font-extrabold text-amber-600">{notes.length}</span>
        </div>
      </div>

      {/* Notes Grid */}
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
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{note.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenModal(note)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                      title="Edit Note"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(note.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Delete Note"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-6 mb-4 leading-relaxed">
                  {note.description || 'No additional content provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <FiUser size={12} /> {note.staff_name || 'Staff'}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock size={12} /> {fmtDate(note.updated_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal — Add / Edit Note */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 border border-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingNote ? 'Edit Staff Note' : 'Create New Staff Note'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Note Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Project Architecture Plan"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Note Description / Content</label>
                <textarea
                  rows={6}
                  placeholder="Write detailed notes..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
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
                  {submitting ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-7 border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <FiTrash2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Note?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this staff note?
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
