'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  FiFolder, FiPlus, FiMessageSquare,
  FiLoader, FiSearch, FiX, FiRefreshCw
} from 'react-icons/fi';

export default function UserProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      toast.error('Failed to load package projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (p.project_title || '').toLowerCase().includes(term) ||
      (p.last_message || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      {/* Clean Header matching /user/tickets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Package Projects</h1>
          <p className="text-xs text-slate-500">Track and manage your package project discussions</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors"
            title="Refresh Projects"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={15} />
          </button>
          <button
            onClick={() => router.push('/user/packages')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
          >
            <FiPlus size={15} />
            Start New Project
          </button>
        </div>
      </div>

      {/* Search Bar matching /user/tickets */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Search projects..."
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

      {/* Projects List matching /user/tickets */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FiLoader className="animate-spin mx-auto text-primary" size={24} />
            <p className="text-xs">Loading package projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-12 text-center space-y-2 px-4">
            <FiMessageSquare className="mx-auto text-slate-300" size={28} />
            <p className="font-semibold text-slate-700 text-sm">No package projects found</p>
            <p className="text-xs text-slate-500">
              {search ? 'No projects match your search.' : 'You have not started any package projects yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProjects.map((p) => (
              <div
                key={p.package_chat_id || p.id}
                onClick={() => router.push(`/user/projects/${p.package_chat_id || p.id}`)}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">#{p.package_chat_id || p.id}</span>
                    <h3 className="text-sm font-semibold text-slate-800 hover:text-primary truncate">
                      {p.project_title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {p.last_message || 'No messages yet'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-semibold text-primary hover:underline inline-block mt-0.5">
                    View Discussion →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
