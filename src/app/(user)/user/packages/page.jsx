'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FiBox, FiSearch, FiX } from 'react-icons/fi';
import PackageCard from '@/component/cards/PackageCard';

export default function UserPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await axios.get('/api/public/package');
      if (res.data.success) {
        setPackages(res.data.data);
      }
    } catch {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const filtered = packages.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.tenant_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
      <Toaster position="top-center" />

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiBox size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Service Packages & Plans</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Choose from tailored service offerings, development packages, and feature plans.
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
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          Loading service packages...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiBox size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No packages available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} isStaff={false} />
          ))}
        </div>
      )}
    </div>
  );
}
