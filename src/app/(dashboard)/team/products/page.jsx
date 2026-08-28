'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage,
  FiEye, FiEyeOff, FiStar, FiTag, FiExternalLink, FiLoader
} from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

const ProductsManagement = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/team/product');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    setCreating(true);
    try {
      const res = await axios.post('/api/team/product', {
        name: 'enter title',
        price: 0,
        discount: 0,
        is_published: false,
        is_featured: false,
      });

      if (res.data.success && res.data.data?.slug) {
        toast.success('Draft product initialized');
        router.push(`/team/products/${res.data.data.slug}`);
      } else {
        toast.error(res.data.message || 'Failed to create product');
        setCreating(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product');
      setCreating(false);
    }
  };

  const handleDelete = async (slug, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeleting(slug);
    try {
      const res = await axios.delete(`/api/team/product/${slug}`);
      if (res.data.success) {
        toast.success('Product deleted');
        setProducts(products.filter(p => p.slug !== slug));
      } else {
        toast.error(res.data.message || 'Failed to delete product');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'published') return p.is_published;
    if (statusFilter === 'draft') return !p.is_published;
    if (statusFilter === 'featured') return p.is_featured;
    return true;
  });

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    return images.find(i => i.is_primary)?.image || images[0]?.image || null;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Toaster position="top-center" />

      {/* Simple Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FiPackage size={18} />
            </span>
            Products Management
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm pl-10">Manage platform products, pricing, and feature specs</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/team/products/features"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
          >
            <FiTag size={14} className="text-primary" /> Features List
          </Link>
          <button
            onClick={handleCreateProduct}
            disabled={creating}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 shadow-sm"
          >
            {creating ? <FiLoader className="animate-spin" size={14} /> : <FiPlus size={14} />}
            {creating ? 'Creating...' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 w-full sm:w-72">
            <FiSearch className="text-slate-400 shrink-0" size={14} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'published', label: 'Published' },
              { id: 'draft', label: 'Drafts' },
              { id: 'featured', label: 'Featured' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Price ($)</th>
                <th className="px-6 py-3.5">Features</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    {searchTerm || statusFilter !== 'all' ? 'No products match your filter.' : 'No products found. Add your first product!'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const primaryImage = getPrimaryImage(product.images);
                  const price = Number(product.price) || 0;
                  const discount = Number(product.discount) || 0;
                  const finalPrice = Math.max(0, price - discount);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {primaryImage ? (
                            <Image
                              src={primaryImage}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                              <FiPackage size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="truncate max-w-xs">{product.name}</span>
                              {product.demo_url && (
                                <a
                                  href={product.demo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-primary transition-colors"
                                  title="View Demo Link"
                                >
                                  <FiExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">{product.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900">
                          ${finalPrice}
                          {discount > 0 && (
                            <span className="ml-1.5 text-[11px] text-slate-400 line-through">
                              ${price}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          <FiTag size={10} />
                          {product.features?.length || 0}
                        </span>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            product.is_published ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {product.is_published ? <FiEye size={11} /> : <FiEyeOff size={11} />}
                            {product.is_published ? 'Published' : 'Draft'}
                          </span>
                          {product.is_featured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                              <FiStar size={11} /> Featured
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-right space-x-1">
                        <Link
                          href={`/team/products/${product.slug}`}
                          className="inline-block p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <FiEdit2 size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.slug, product.name)}
                          disabled={deleting === product.slug}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete product"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsManagement;
