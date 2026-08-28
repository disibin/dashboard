'use client';
import React, { useState, useContext } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Context } from '@/component/helper/Context';
import toast, { Toaster } from 'react-hot-toast';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setStaffData } = useContext(Context);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');

    setLoading(true);
    try {
      const res = await axios.post('/api/staff/login', { email, password });
      const data = res.data;

      if (data.success) {
        toast.success('Login successful!');
        const meRes = await axios.get('/api/staff/me');
        if (meRes.data.success) {
          setStaffData(meRes.data.data);
        }
        window.location.replace('/panel');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1';

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm flex flex-col p-6 rounded-2xl items-center justify-center gap-3">

        <div className='w-full flex flex-col gap-2 mb-4 items-center justify-center'>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Staff Portal</h1>
          <p className="text-slate-500 text-sm text-center">Sign in to access the Disibin dashboard.</p>
        </div>

        <form className="flex w-full flex-col items-center justify-center gap-3" onSubmit={handleSubmit}>
          <div className="w-full flex flex-col gap-1.5">
            <label className={labelCls}>Email Address</label>
            <input
              id="staff-email"
              type="email"
              className={inputCls}
              placeholder="name@disibin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
              <label className={labelCls}>Password</label>
              <Link href="/staff-auth/recovery" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                className={`${inputCls} pr-12`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            id="staff-login-btn"
            disabled={loading}
            className="w-full py-3 rounded-xl cursor-pointer bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 mt-2 shadow-lg shadow-primary/20 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Trouble accessing your account?{' '}
          <Link href="/staff-auth/recovery" className="text-slate-900 font-semibold hover:underline">Reset Password</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
