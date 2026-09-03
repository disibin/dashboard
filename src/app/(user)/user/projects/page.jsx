'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  FiFolder, FiPlus, FiMessageSquare,
  FiLoader, FiSearch, FiX, FiRefreshCw,
  FiCheckCircle, FiClock, FiPlayCircle, FiActivity, FiSlash, FiTrash2
} from 'react-icons/fi';

export default function UserProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, projectTitle, e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${projectTitle}"? All discussions and messages will be permanently removed.`)) return;

    try {
      const res = await axios.delete(`/api/user/projects?id=${projectId}`);
      if (res.data.success) {
        toast.success('Project deleted successfully');
        setProjects(prev => prev.filter(p => (p.package_chat_id || p.id) !== projectId));
      } else {
        toast.error(res.data.message || 'Failed to delete project');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete project');
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
      const res = await axios.post('/api/user/projects', {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined
      });

      if (res.data.success) {
        toast.success('Project created successfully!');
        setIsModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        router.push(`/user/projects/${res.data.data.id}`);
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
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-xl inline-flex items-center gap-1"><FiCheckCircle size={10} /> Completed</span>;
      case 'working':
        return <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-xl inline-flex items-center gap-1"><FiActivity size={10} /> Working</span>;
      case 'progress':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-xl inline-flex items-center gap-1"><FiPlayCircle size={10} /> In Progress</span>;
      case 'spam':
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-xl inline-flex items-center gap-1"><FiSlash size={10} /> Spam</span>;
      default:
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-xl inline-flex items-center gap-1"><FiClock size={10} /> Waiting</span>;
    }
  };

  const filteredProjects = projects
    .filter((p) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        (p.project_title || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        (p.last_message || '').toLowerCase().includes(term)
      );
    })
    .sort((a, b) => new Date(b.last_message_at || b.created_at || 0) - new Date(a.last_message_at || a.created_at || 0) || Number(b.id || 0) - Number(a.id || 0));

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <FiFolder className="text-primary" />
            My Projects
          </h1>
          <p className="text-xs text-slate-500">Track, manage, and collaborate on your active project discussions</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            title="Refresh Projects"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={15} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <FiPlus size={15} />
            Create Project
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Search projects by title or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <FiX size={13} />
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-5 text-center text-slate-400 space-y-2">
            <FiLoader className="animate-spin mx-auto text-primary" size={24} />
            <p className="text-xs">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-5 text-center space-y-3 px-4">
            <FiMessageSquare className="mx-auto text-slate-300" size={28} />
            <p className="font-semibold text-slate-700 text-sm">No projects found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search ? 'No projects match your search.' : 'You have not created any projects yet. Start a new project to collaborate directly with our team!'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <FiPlus size={15} />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProjects.map((p) => (
              <div
                key={p.package_chat_id || p.id}
                onClick={() => router.push(`/user/projects/${p.package_chat_id || p.id}`)}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">#{p.package_chat_id || p.id}</span>
                    <h3 className="text-sm font-semibold text-slate-800 hover:text-primary truncate">
                      {p.project_title}
                    </h3>
                    {getStatusBadge(p.project_status)}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {p.last_message || p.description || 'No messages yet'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-semibold text-primary hover:underline inline-block mt-0.5">
                      Open Project Discussion →
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteProject(p.package_chat_id || p.id, p.project_title, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Project"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FiFolder size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Project</h3>
                  <p className="text-xs text-slate-500">Initiate a dedicated workspace discussion</p>
                </div>
              </div>
              <button
                onClick={() => !creating && setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
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
                  placeholder="e.g., E-Commerce Platform Redesign, Custom CRM Mobile App"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Project Scope & Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your goals, tech preferences, deliverables, deadlines, or any initial notes..."
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
