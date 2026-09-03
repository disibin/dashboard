'use client';
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Context } from '@/component/helper/Context';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiShield, FiClock,
  FiEdit3, FiLock, FiCheckCircle, FiXCircle, FiCalendar
} from 'react-icons/fi';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : '—';

export default function UserProfilePage() {
  const { userData, setUserData } = useContext(Context);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/user');
      if (res.data.success) {
        setProfile(res.data.data);
        setUserData(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (error) {
      toast.error('Failed to load profile details');
    }
  };

  const user = profile || userData;

  return (
    <div className="p-4 w-full space-y-4">
      <Toaster position="top-center" />

      <div className="relative overflow-hidden bg-primary rounded-3xl p-5 text-white shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{user?.name || 'User Profile'}</h1>
                {user?.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary-light border border-primary/30">
                    <FiShield size={12} /> Verified
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-sm mt-1">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                  <FiUser size={12} className="text-primary-light" /> Regular Member
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                  <FiCalendar size={12} className="text-emerald-400" /> Joined {fmtDate(user?.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/user/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-tertiary-light hover:text-primary transition-all"
            >
              <FiEdit3 size={15} /> Edit Profile
            </Link>
            <Link
              href="/user/security"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all border border-white/10"
            >
              <FiLock size={15} /> Security
            </Link>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


        <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FiUser size={16} />
            </span>
            Personal & Contact Details
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{user?.name || '—'}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-semibold text-slate-800">{user?.email || '—'}</p>
                {user?.is_verified ? (
                  <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                    <FiCheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-semibold inline-flex items-center gap-1">
                    <FiXCircle size={12} /> Unverified
                  </span>
                )}
              </div>
              {user?.pending_email && (
                <p className="text-xs text-primary mt-1 font-medium bg-primary/10 p-2 rounded-xl border border-primary/20">
                  Pending email change to: <strong>{user.pending_email}</strong> (Verification required on security page)
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{user?.phone || '— Not provided'}</p>
            </div>
          </div>
        </div>


        <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FiMapPin size={16} />
            </span>
            Address Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Street Address</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{user?.address_line1 || '— Not provided'}</p>
            </div>

            {user?.address_line2 && (
              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Address Line 2</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{user.address_line2}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">City</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{user?.city || '—'}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">State / Region</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{user?.state || '—'}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Country</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{user?.country || '—'}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Postal Code</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{user?.postal_code || '—'}</p>
            </div>
          </div>
        </div>


        <div className="md:col-span-2 bg-white rounded-3xl p-7 border border-slate-100 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FiShield size={16} />
            </span>
            Account Status & System Meta
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account ID</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">#USR-{user?.id}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Status</p>
              <p className="text-sm font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <FiCheckCircle size={14} /> Active
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered On</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{fmtDate(user?.created_at)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Login</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{fmtDate(user?.last_login)}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
