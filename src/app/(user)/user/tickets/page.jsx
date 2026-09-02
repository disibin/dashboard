'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  FiLifeBuoy, FiPlus, FiMessageSquare,
  FiLoader, FiSearch, FiX, FiRefreshCw, FiTrash2
} from 'react-icons/fi';
import NewTicketModal from '@/component/forms/NewTicketModal';

export default function UserTicketsListPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/ticket');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId, ticketTitle, e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete support ticket #${ticketId} ("${ticketTitle}")?`)) return;

    try {
      const res = await axios.delete(`/api/user/ticket?id=${ticketId}`);
      if (res.data.success) {
        toast.success('Support ticket deleted');
        setTickets(prev => prev.filter(t => t.id !== ticketId));
      } else {
        toast.error(res.data.message || 'Failed to delete ticket');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(term) ||
      t.last_message?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Support Tickets</h1>
          <p className="text-xs text-slate-500">Track and manage your support inquiries</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors"
            title="Refresh Tickets"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={15} />
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
          >
            <FiPlus size={15} />
            New Ticket
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <FiX size={13} />
          </button>
        )}
      </div>

      {/* Tickets List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FiLoader className="animate-spin mx-auto text-primary" size={24} />
            <p className="text-xs">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-12 text-center space-y-2 px-4">
            <FiMessageSquare className="mx-auto text-slate-300" size={28} />
            <p className="font-semibold text-slate-700 text-sm">No tickets found</p>
            <p className="text-xs text-slate-500">
              {search ? 'No tickets match your search.' : 'You have not submitted any support tickets yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => router.push(`/user/tickets/${t.id}`)}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">#{t.id}</span>
                    <h3 className="text-sm font-semibold text-slate-800 hover:text-primary truncate">
                      {t.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {t.last_message || 'No messages yet'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-semibold text-primary hover:underline inline-block mt-0.5">
                      View Thread →
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteTicket(t.id, t.title, e)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Support Ticket"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewTicketModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={(newTicketData) => {
          fetchTickets();
          if (newTicketData?.ticket?.id) {
            router.push(`/user/tickets/${newTicketData.ticket.id}`);
          }
        }}
      />
    </div>
  );
}
