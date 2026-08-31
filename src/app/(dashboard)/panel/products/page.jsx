'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage,
  FiExternalLink, FiX, FiGlobe, FiUser, FiCheck, FiUpload, FiLoader
} from 'react-icons/fi';
import Image from 'next/image';
import ProductCard from '@/component/staff/cards/ProductCard';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    title: '',
    image: '',
    image_id: '',
    link: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/staff/product');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setForm({
        name: prod.name || '',
        title: prod.title || '',
        image: prod.image || '',
        image_id: prod.image_id || '',
        link: prod.link || '',
      });
      setImagePreview(prod.image || '');
      setImageFile(null);
    } else {
      setEditingProduct(null);
      setForm({ name: '', title: '', image: '', image_id: '', link: '' });
      setImagePreview('');
      setImageFile(null);
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setForm({ name: '', title: '', image: '', image_id: '', link: '' });
    setImagePreview('');
    setImageFile(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm((prev) => ({ ...prev, image: '', image_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Product name is required');

    setSubmitting(true);
    try {
      let finalImageUrl = form.image;
      let finalImageId = form.image_id;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await axios.post('/api/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data.success) {
          finalImageUrl = uploadRes.data.data.url;
          finalImageId = uploadRes.data.data.public_id;
        } else {
          throw new Error(uploadRes.data.message || 'Image upload failed');
        }
      }

      const payload = {
        ...form,
        image: finalImageUrl,
        image_id: finalImageId,
      };

      if (editingProduct) {
        const res = await axios.put('/api/staff/product', { id: editingProduct.id, ...payload });
        if (res.data.success) {
          toast.success(res.data.message);
          fetchProducts();
          handleCloseForm();
        }
      } else {
        const res = await axios.post('/api/staff/product', payload);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchProducts();
          handleCloseForm();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name, public_id) => {
    if (!window.confirm(`Permanently delete product "${name}"?`)) return;
    try {
      if (public_id) {
        await axios.delete(`/api/image?public_id=${encodeURIComponent(public_id)}`).catch(() => {});
      }
      const res = await axios.delete(`/api/staff/product?id=${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputCls = 'input-style';
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block';

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
      <Toaster position="top-center" />

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FiPackage size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Products Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage platform software products, landing pages, and external demo links.
            </p>
          </div>
        </div>

        <button
          onClick={() => (showForm ? handleCloseForm() : handleOpenForm())}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-md cursor-pointer"
        >
          {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showForm ? 'Close Form' : 'Add New Product'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-7 border border-indigo-100 shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingProduct ? `Edit Product: "${editingProduct.name}"` : 'Create New Product'}
            </h3>
            <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Display Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>External Demo Link</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Product Image</label>
                {imagePreview ? (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                    <Image
                      width={50}
                      height={50}
                      src={imagePreview}
                      alt="Selected product image"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {imageFile ? imageFile.name : 'Current Image'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB (Uploads on save)` : form.image_id || 'Cloudinary'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Remove Image"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="flex items-center justify-center gap-2 p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:border-indigo-300 transition-all cursor-pointer"
                    >
                      <FiUpload size={16} className="text-slate-400" />
                      <span>Select Image File</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <FiLoader size={16} className="animate-spin" />
                    <span>Uploading &amp; Saving...</span>
                  </>
                ) : (
                  <>
                    <FiCheck size={16} />
                    <span>{editingProduct ? 'Update Product' : 'Save Product'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 w-full sm:w-80 shadow-xs">
            <FiSearch className="text-slate-400 shrink-0" size={16} />
            <input
              type="text"
              className="w-full text-xs bg-transparent focus:outline-none text-slate-800 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">Total: {filteredProducts.length}</span>
        </div>

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
          <FiPackage size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">
            {searchTerm ? 'No products match your filter.' : 'No products found. Add your first product!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod, idx) => (
            <ProductCard
              key={prod.id}
              product={prod}
              index={idx}
              onEdit={handleOpenForm}
              onDelete={handleDelete}
              isStaff={true}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default ProductsManagement;
