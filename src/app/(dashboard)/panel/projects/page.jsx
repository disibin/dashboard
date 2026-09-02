'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  FiFolder, FiMessageSquare, FiLoader, FiSearch, FiX,
  FiRefreshCw, FiUser, FiClock, FiActivity, FiCheckCircle,
  FiSlash, FiPlayCircle, FiPlus
} from 'react-icons/fi';

export default function StaffProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New Project Modal State for Staff
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/staff/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load projects');
      }
    } catch {
      toast.error('Failed to load project discussions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Project title is required');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        user_id: targetUserId ? Number(targetUserId) : undefined
      };

      const res = await axios.post('/api/staff/projects', payload);
      if (res.data.success) {
        toast.success('Project created successfully!');
        setIsModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        setTargetUserId('');
        fetchProjects();
        router.push(`/panel/projects/${res.data.data.id}`);
      } else {
        toast.error(res.data.message || 'Failed to create project');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md inline-flex items-center gap-1"><FiCheckCircle size={10} /> Completed</span>;
      case 'working':
        return <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-md inline-flex items-center gap-1"><FiActivity size={10} /> Working</span>;
      case 'progress':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md inline-flex items-center gap-1"><FiPlayCircle size={10} /> In Progress</span>;
      case 'spam':
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-md inline-flex items-center gap-1"><FiSlash size={10} /> Spam</span>;
      default:
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-md inline-flex items-center gap-1"><FiClock size={10} /> Waiting</span>;
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = !search.trim() || (
      (p.project_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.last_message || '').toLowerCase().includes(search.toLowerCase())
    );

    const matchesStatus = statusFilter === 'all' || p.project_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <FiFolder className="text-primary" />
            Client Projects
          </h1>
          <p className="text-xs text-slate-500">Manage, review, and collaborate on client project discussions</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Refresh List"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={15} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <FiPlus size={15} />
            New Project
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search by title, client name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <FiX size={13} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All' },
            { key: 'waiting', label: 'Waiting' },
            { key: 'progress', label: 'In Progress' },
            { key: 'working', label: 'Working' },
            { key: 'completed', label: 'Completed' },
            { key: 'spam', label: 'Spam' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FiLoader className="animate-spin mx-auto text-primary" size={24} />
            <p className="text-xs">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-12 text-center space-y-2 px-4">
            <FiMessageSquare className="mx-auto text-slate-300" size={28} />
            <p className="font-semibold text-slate-700 text-sm">No project discussions found</p>
            <p className="text-xs text-slate-500">
              {search || statusFilter !== 'all' ? 'No projects match your current filters.' : 'There are no active client projects yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProjects.map((p) => (
              <div
                key={p.package_chat_id || p.id}
                onClick={() => router.push(`/panel/projects/${p.package_chat_id || p.id}`)}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">#{p.package_chat_id || p.id}</span>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-primary transition-colors">
                      {p.project_title}
                    </h3>
                    {getStatusBadge(p.project_status)}
                  </div>

                  <p className="text-xs text-slate-600 truncate max-w-2xl">
                    {p.last_message ? (
                      <span><strong className="text-slate-800 font-semibold">Latest: </strong>{p.last_message}</span>
                    ) : p.description ? (
                      <span>{p.description}</span>
                    ) : (
                      <span className="italic text-slate-400">No messages sent yet</span>
                    )}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <FiUser size={12} className="text-slate-400" /> {p.user_name || 'Client User'} ({p.user_email || 'No email'})
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 space-y-1">
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-xs font-semibold text-primary hover:underline inline-block">
                    Open Project Workspace →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiFolder size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Client Project</h3>
                  <p className="text-xs text-slate-500">Open a project discussion for client collaboration</p>
                </div>
              </div>
              <button
                onClick={() => !creating && setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Enterprise Portal Architecture, Mobile App Sprint"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Client User ID <span className="text-slate-400 font-normal">(Optional numeric ID from Users panel)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Project Scope & Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Initial requirements, milestone notes, or instructions..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={creating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-dark text-white transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {creating ? <FiLoader className="animate-spin" size={14} /> : <FiPlus size={14} />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
