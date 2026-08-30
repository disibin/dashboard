'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FiBriefcase, FiSearch, FiGlobe, FiX, FiCheckCircle } from 'react-icons/fi';
import ServiceCard from '@/component/cards/ServiceCard';

export default function UserServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get('/api/user/services');
      if (res.data.success) {
        setServices(res.data.data);
      }
    } catch {
      toast.error('Failed to load my services');
    } finally {
      setLoading(false);
    }
  };

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.tenant_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
      <Toaster position="top-center" />

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <FiBriefcase size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Custom Services</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Review active client services, billing amounts, service status, and scope deliverables.
            </p>
          </div>
        </div>
      </div>

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

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">Loading your services...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiBriefcase size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No custom services assigned yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((srv, idx) => (
            <ServiceCard key={srv.id} service={srv} index={idx} isStaff={false} />
          ))}
        </div>
      )}
    </div>
  );
}
