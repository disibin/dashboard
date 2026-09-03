'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiBox, FiSearch, FiX, FiShoppingBag,
  FiLoader, FiShoppingCart
} from 'react-icons/fi';
import PackageCard from '@/component/user/cards/PackageCard';
import { formatCurrency } from '@/lib/database/secret';

export default function UserPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [cartPackageIds, setCartPackageIds] = useState([]);

  useEffect(() => {
    fetchPackagesAndCart();
  }, []);

  const fetchPackagesAndCart = async () => {
    setLoading(true);
    try {
      const [pkgRes, cartRes] = await Promise.all([
        axios.get('/api/public/package'),
        axios.get('/api/user/cart').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (pkgRes.data.success) {
        setPackages(pkgRes.data.data);
      }

      if (cartRes?.data?.success && Array.isArray(cartRes.data.data)) {
        setCartPackageIds(cartRes.data.data.map((item) => item.package_id));
      }
    } catch {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (pkg) => {
    const isAlreadyInCart = cartPackageIds.includes(pkg.id);

    try {
      if (isAlreadyInCart) {
        toast('Already in your cart!', { icon: '🛒' });
      } else {
        const res = await axios.post('/api/user/cart', { package_id: pkg.id });
        if (res.data.success) {
          setCartPackageIds((prev) => [...prev, pkg.id]);
          toast.success(`Added "${pkg.name}" to cart!`);
        }
      }
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async (pkg) => {
    try {
      if (!cartPackageIds.includes(pkg.id)) {
        await axios.post('/api/user/cart', { package_id: pkg.id });
        setCartPackageIds((prev) => [...prev, pkg.id]);
      }
      router.push('/user/cart');
    } catch {
      router.push('/user/cart');
    }
  };

  const filtered = packages.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.tenant_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const cartCount = cartPackageIds.length;
  const cartTotalAmount = packages
    .filter((p) => cartPackageIds.includes(p.id))
    .reduce((sum, p) => sum + Math.max(0, Number(p.price || 0) - Number(p.discount || 0)), 0);

  return (
    <div className="p-4 sm:p-4 md:p-5 w-full space-y-4 pb-24">
      <Toaster position="top-center" />

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiBox size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Software & Service Packages</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Choose single packages or add multiple packages to your cart to purchase together.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/user/cart"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs cursor-pointer shrink-0"
          >
            <FiShoppingCart size={15} />
            <span>My Cart</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {cartCount > 0 && (
            <Link
              href="/user/cart"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-dark transition-all shadow-sm cursor-pointer shrink-0"
            >
              <FiShoppingBag size={15} />
              Go to Cart ({cartCount}) • {formatCurrency(cartTotalAmount)}
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 max-w-md">
        <FiSearch className="text-slate-400 ml-2" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search packages by title or platform..."
          className="input-style text-xs flex-1 border-none shadow-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-slate-600">
            <FiX size={16} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center text-slate-400 flex flex-col items-center gap-2">
          <FiLoader className="animate-spin text-primary" size={26} />
          <p className="text-xs">Loading available packages...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiBox size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No packages match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pkg, idx) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={idx}
              isSelected={cartPackageIds.includes(pkg.id)}
              onToggleSelect={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          ))}
        </div>
      )}

      {cartCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {cartCount}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Packages in your cart</p>
                <p className="text-base font-bold text-white">
                  Total: {formatCurrency(cartTotalAmount)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/user/cart"
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <FiShoppingBag size={14} />
                View & Checkout Cart
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
