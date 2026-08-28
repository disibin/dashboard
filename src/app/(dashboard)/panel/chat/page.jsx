'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  FiMessageSquare, FiUsers, FiUser, FiPlus, FiX,
  FiSearch, FiLoader, FiCheckCircle, FiRefreshCw, FiCheck
} from 'react-icons/fi';

export default function TeamChatListPage() {
  const router = useRouter();
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [searchMember, setSearchMember] = useState('');

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/staff/chat');
      if (res.data.success) {
        setInbox(res.data.data);
      }
    } catch {
      toast.error('Failed to load staff conversations');
    } finally {
      setLoading(false);
    }
  };

  const openNewChatForm = async () => {
    setShowForm(!showForm);
    setSelectedMemberIds([]);
    setGroupTitle('');
    if (!showForm && teamMembers.length === 0) {
      try {
        const res = await axios.get('/api/staff/chat/members');
        if (res.data.success) {
          setTeamMembers(res.data.data);
        }
      } catch {
        toast.error('Failed to load staff members');
      }
    }
  };

  const toggleMemberSelection = (id) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const createNewChat = async () => {
    if (selectedMemberIds.length === 0) {
      return toast.error('Please select at least one staff member');
    }

    const isGroup = selectedMemberIds.length > 1;
    if (isGroup && !groupTitle.trim()) {
      return toast.error('Please enter a group title');
    }

    setCreatingChat(true);
    try {
      const res = await axios.post('/api/staff/chat', {
        isGroup,
        title: groupTitle.trim(),
        participantStaffIds: selectedMemberIds
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        if (res.data.data?.id) {
          router.push(`/panel/chat/${res.data.data.id}`);
        } else {
          fetchInbox();
        }
      } else {
        toast.error(res.data.message || 'Failed to start conversation');
      }
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setCreatingChat(false);
    }
  };

  const filteredInbox = inbox.filter(c => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const name = c.is_group ? c.title : c.other_participant_name;
    return name?.toLowerCase().includes(term) || c.last_message?.toLowerCase().includes(term);
  });

  const filteredMembers = teamMembers.filter(m =>
    m.name?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.role?.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="p-4 w-full space-y-6">
      <Toaster position="top-center" />

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FiMessageSquare size={20} />
            </span>
            Staff Messages
          </h1>
          <p className="text-slate-500 text-sm pl-11">
            Internal staff conversations and group discussions
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchInbox}
            disabled={loading}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold transition-all text-xs cursor-pointer"
            title="Refresh Inbox"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          </button>
          <button
            onClick={openNewChatForm}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer"
          >
            {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
            {showForm ? 'Close Form' : 'New Conversation'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-7 border border-indigo-100 shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FiUsers className="text-indigo-600" size={20} />
              Start New Staff Conversation
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select staff members below to start a 1-on-1 direct message or create a group chat.
            </p>

            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={searchMember}
                onChange={e => setSearchMember(e.target.value)}
                className="input-style text-xs py-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-slate-200 rounded-2xl bg-slate-50/50">
              {filteredMembers.map((member) => {
                const isSelected = selectedMemberIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg font-semibold flex items-center justify-center text-xs shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {member.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs truncate">{member.name}</p>
                        <p className={`text-[10px] capitalize truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {member.role}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <FiCheckCircle size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedMemberIds.length > 1 && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Group Title *
                </label>
                <input
                  type="text"
                  value={groupTitle}
                  onChange={e => setGroupTitle(e.target.value)}
                  className="input-style text-xs py-2"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createNewChat}
                disabled={selectedMemberIds.length === 0 || creatingChat}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <FiCheck size={16} />
                {creatingChat
                  ? 'Starting...'
                  : selectedMemberIds.length > 1
                  ? 'Create Group Chat'
                  : 'Start Direct Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-style pl-10 pr-9 text-sm py-2"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <FiLoader className="animate-spin mx-auto text-indigo-600" size={28} />
            <p className="text-sm font-medium">Loading conversations...</p>
          </div>
        ) : filteredInbox.length === 0 ? (
          <div className="py-16 text-center space-y-4 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FiMessageSquare size={32} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-semibold text-slate-800 text-base">No conversations found</h3>
              <p className="text-xs text-slate-500">
                {search ? 'No chats match your search query.' : 'Start a new direct message or group chat with staff members.'}
              </p>
            </div>
            <button
              onClick={openNewChatForm}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              + Start a Conversation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInbox.map((chat) => {
              const displayName = chat.is_group ? chat.title : (chat.other_participant_name || 'Staff Member');
              return (
                <div
                  key={chat.id}
                  onClick={() => router.push(`/panel/chat/${chat.id}`)}
                  className="p-5 hover:bg-slate-50/80 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-semibold text-lg ${
                      chat.is_group ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {chat.is_group ? <FiUsers size={22} /> : <FiUser size={22} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {displayName}
                        </h3>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                          chat.is_group ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {chat.is_group ? 'Group' : (chat.other_participant_role || 'Staff')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate font-medium">
                        {chat.last_message ? (
                          <>
                            <span className="font-semibold text-slate-700">{chat.last_sender_name}: </span>
                            {chat.last_message}
                          </>
                        ) : 'No messages yet'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {chat.last_message_time && (
                      <p className="text-xs font-medium text-slate-400">
                        {new Date(chat.last_message_time).toLocaleDateString()}
                      </p>
                    )}
                    <span className="inline-block mt-2 text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Chat →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
