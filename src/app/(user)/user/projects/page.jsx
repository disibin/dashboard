'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiFolder, FiSearch, FiMessageSquare, FiX, FiCheckCircle, FiClock,
  FiBriefcase, FiBox, FiSend
} from 'react-icons/fi';

export default function UserProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [activeProject, setActiveProject] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/user/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch {
      toast.error('Failed to load my projects');
    } finally {
      setLoading(false);
    }
  };

  const openDiscussion = (project) => {
    setActiveProject(project);
    setChatMessages([
      { id: 1, sender: 'Staff Support', text: `Welcome to project discussion for "${project.project_title}". Let us know your feedback or requirements!`, time: new Date().toLocaleTimeString() }
    ]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'You', text: newMessage.trim(), time: new Date().toLocaleTimeString() }
    ]);
    setNewMessage('');
  };

  const filtered = projects.filter(
    (p) =>
      (p.project_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.tenant_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
      <Toaster position="top-center" />

      

      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 max-w-md">
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

      {/* Projects Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          Loading your active projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiFolder size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No active projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <div
              key={`${proj.project_type}-${proj.id}`}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                    proj.project_type === 'package' ? 'bg-amber-50 text-amber-700' : 'bg-cyan-50 text-cyan-700'
                  }`}>
                    {proj.project_type === 'package' ? <FiBox className="inline mr-1" /> : <FiBriefcase className="inline mr-1" />}
                    {proj.project_type}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {proj.project_status || 'active'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {proj.project_title || 'Client Project'}
                </h3>

                {proj.description && (
                  <div
                    className="text-xs text-slate-500 line-clamp-3 mt-2 prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: proj.description }}
                  />
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900">${proj.net_price || 0}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Payment: {proj.payment_status || 'due'}
                  </span>
                </div>

                <button
                  onClick={() => openDiscussion(proj)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
                >
                  <FiMessageSquare size={14} /> Project Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Chat Panel (NO POPUP) */}
      {activeProject && (
        <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-lg space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FiMessageSquare className="text-indigo-600" size={18} />
                Project Discussion: {activeProject.project_title}
              </h3>
              <p className="text-xs text-slate-500">Direct line with staff project coordinator</p>
            </div>
            <button onClick={() => setActiveProject(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl text-xs space-y-1 max-w-md ${
                  msg.sender === 'You' ? 'bg-indigo-600 text-white ml-auto' : 'bg-white text-slate-800 border border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 font-semibold opacity-80 text-[10px]">
                  <span>{msg.sender}</span>
                  <span>{msg.time}</span>
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="input-style text-xs flex-1"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <FiSend size={14} /> Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
