'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiCheck, FiX, FiZap, FiImage, FiSave, FiEye, FiYoutube, FiVideo } from 'react-icons/fi';
import TiptapEditor from '../helper/TiptapEditor';
import Image from 'next/image';

/* ── Create Feature Modal ─────────────────────────────── */
function CreateFeatureModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Feature name is required'); return; }
    setLoading(true);
    try {
      const res = await axios.post('/api/staff/product/features', {
        name: name.trim(),
        description: description.trim() || null,
      });
      if (res.data.success) {
        toast.success('Feature created!');
        onCreate(res.data.data);
        onClose();
      } else {
        toast.error(res.data.message || 'Failed to create feature');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 space-y-4 border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">
              <FiZap size={16} />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Add New Feature</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <FiX size={14} />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Feature Name *</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } if (e.key === 'Escape') onClose(); }}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. 24/7 Priority Support"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Brief summary of feature capability..."
            />
          </div>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 py-2 rounded-lg bg-primary text-white font-semibold text-xs hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
          >
            {loading ? 'Creating...' : 'Save Feature'}
          </button>
        </div>
      </div>
    </div>
  );
}

const ProductForm = ({ initialData, onSuccess, onCancel }) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    demo_url: '',
    price: initialData?.price ?? initialData?.prices?.price ?? 0,
    discount: initialData?.discount ?? initialData?.prices?.discount ?? 0,
    setup_fee: initialData?.setup_fee ?? initialData?.prices?.setup_fee ?? 0,
    service_charge: initialData?.service_charge ?? initialData?.prices?.service_charge ?? 0,
    is_featured: false,
    is_published: false,
    ...initialData,
  });

  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');

  const [selectedIds, setSelectedIds] = useState(
    new Set((initialData?.features || []).map(f => f.id))
  );

  const [videos, setVideos] = useState(
    (initialData?.videos || []).map(v => (typeof v === 'string' ? { url: v } : { id: v.id || null, url: v.url || '' }))
  );
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const [images, setImages] = useState(
    (initialData?.images || []).map(img => ({
      id: img.id || null,
      title: img.title || '',
      image: img.image || '',
      public_id: img.public_id || '',
      is_primary: img.is_primary || false,
    }))
  );

  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (nameInputRef.current && (formData.name === 'enter title' || !formData.name)) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, []);

  useEffect(() => {
    const fetchFeatures = async () => {
      setFeaturesLoading(true);
      try {
        const res = await axios.get('/api/staff/product/features');
        if (res.data.success) setAvailableFeatures(res.data.data || []);
      } catch {
        toast.error('Could not load features');
      } finally {
        setFeaturesLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  const toggleFeature = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFeatureCreated = (newFeature) => {
    setAvailableFeatures(prev => [...prev, newFeature].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedIds(prev => new Set([...prev, newFeature.id]));
  };

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    setVideos(prev => [...prev, { url: newVideoUrl.trim() }]);
    setNewVideoUrl('');
  };

  const handleRemoveVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImageObjs = files.map((file, i) => ({
      file,
      id: null,
      title: formData.name || '',
      image: URL.createObjectURL(file),
      public_id: null,
      is_primary: images.length === 0 && i === 0,
    }));

    setImages(prev => [...prev, ...newImageObjs]);
  };

  const handleSetPrimary = (index) => {
    setImages(images.map((img, i) => ({ ...img, is_primary: i === index })));
  };

  const handleRemoveImage = (index) => {
    const imgToRemove = images[index];
    if (!imgToRemove.file && !imgToRemove.id && imgToRemove.public_id) {
      try { axios.delete(`/api/image?public_id=${imgToRemove.public_id}`); } catch {}
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const submitForm = async (publishStatus = false) => {
    if (!formData.name || !formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    setLoading(true);

    const featuresPayload = availableFeatures
      .filter(f => selectedIds.has(f.id))
      .map(f => ({ id: f.id, name: f.name, slug: f.slug, value: true }));

    try {
      const processedImages = await Promise.all(
        images.map(async (img) => {
          if (img.file) {
            const formDataUpload = new FormData();
            formDataUpload.append('image', img.file);
            const res = await axios.post('/api/image', formDataUpload, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
              return {
                id: img.id || null,
                title: img.title || formData.name || '',
                image: res.data.data.url,
                public_id: res.data.data.public_id,
                is_primary: !!img.is_primary,
              };
            } else {
              throw new Error(res.data.message || 'Failed to upload product image');
            }
          }
          return {
            id: img.id || null,
            title: img.title || formData.name || '',
            image: img.image,
            public_id: img.public_id || null,
            is_primary: !!img.is_primary,
          };
        })
      );

      const isEditing = !!initialData?.slug;
      const url = isEditing ? `/api/staff/product/${initialData.slug}` : '/api/staff/product';
      const method = isEditing ? 'put' : 'post';

      const payload = {
        name: formData.name.trim(),
        description: formData.description || null,
        demo_url: formData.demo_url || null,
        price: Number(formData.price) || 0,
        discount: Number(formData.discount) || 0,
        setup_fee: Number(formData.setup_fee) || 0,
        service_charge: Number(formData.service_charge) || 0,
        is_featured: formData.is_featured,
        is_published: publishStatus,
        images: processedImages,
        features: featuresPayload,
        videos: videos.map(v => v.url).filter(Boolean),
      };

      const res = await axios[method](url, payload);

      if (res.data.success) {
        toast.success(res.data.message || (publishStatus ? 'Product published successfully!' : 'Draft saved successfully!'));
        setFormData(prev => ({ ...prev, is_published: publishStatus }));
        if (onSuccess) onSuccess(res.data.data);
        else router.push('/panel/products');
      } else {
        toast.error(res.data.message || 'Failed to save product');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showModal && (
        <CreateFeatureModal
          onClose={() => setShowModal(false)}
          onCreate={handleFeatureCreated}
        />
      )}

      <form onSubmit={(e) => { e.preventDefault(); submitForm(formData.is_published); }} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">General Information</h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Product Name *</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g. Next.js SaaS Starter Kit"
                />
              </div>

              {/* Pricing & Fees Grid */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Pricing & Fees (product_prices)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Regular Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="any"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Discount ($)</label>
                    <input
                      type="number"
                      name="discount"
                      min="0"
                      step="any"
                      value={formData.discount}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Setup Fee ($)</label>
                    <input
                      type="number"
                      name="setup_fee"
                      min="0"
                      step="any"
                      value={formData.setup_fee}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                    <span className="text-[10px] text-slate-400 font-normal block mt-1">Domain &amp; Hosting cost</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Service Charge ($)</label>
                    <input
                      type="number"
                      name="service_charge"
                      min="0"
                      step="any"
                      value={formData.service_charge}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                    <span className="text-[10px] text-slate-400 font-normal block mt-1">Maintenance fee (after every year)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Live Demo URL</label>
                <input
                  type="url"
                  name="demo_url"
                  value={formData.demo_url || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://demo.example.com"
                />
              </div>
            </div>

            {/* YouTube Videos Section (product_videos) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiYoutube className="w-5 h-5 text-red-600" />
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Product Videos (YouTube Links)</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 font-poppins">{videos.length} Added</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={e => setNewVideoUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddVideo(); } }}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <button
                  type="button"
                  onClick={handleAddVideo}
                  disabled={!newVideoUrl.trim()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  <FiPlus size={14} />
                  Add Video
                </button>
              </div>

              {videos.length > 0 && (
                <div className="space-y-2 pt-1">
                  {videos.map((vid, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                      <div className="flex items-center gap-2 overflow-hidden truncate">
                        <FiVideo className="text-red-500 shrink-0" size={14} />
                        <span className="font-medium text-slate-800 truncate">{vid.url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors shrink-0"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detailed Overview & Specifications</h3>
              <TiptapEditor
                value={formData.description || ''}
                onChange={(html) => setFormData({ ...formData, description: html })}
                placeholder="Write a clear, engaging product description..."
              />
            </div>
          </div>

          {/* Sidebar / Configuration */}
          <div className="lg:col-span-5 space-y-6">
            {/* Status & Options Card */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Options</h3>
              
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Featured Product</div>
                  <div className="text-[11px] text-slate-500">Show on homepage featured section</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={!!formData.is_featured}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {/* Product Gallery Card */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Gallery</h3>
                <span className="text-[11px] font-semibold text-slate-400 font-poppins">{images.length} Loaded</span>
              </div>

              <div className="relative border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50/50 group">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <FiImage className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors" />
                  <p className="text-xs font-semibold text-slate-700">Click or drag to select image files</p>
                  <p className="text-[11px] text-slate-400">Selected images will upload when saving</p>
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                        img.is_primary ? 'border-primary shadow-sm' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="aspect-video relative bg-slate-100">
                        <Image
                          src={img.image}
                          alt={img.title || 'Product image'}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-between items-start">
                          {img.is_primary ? (
                            <span className="bg-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              Primary
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs transition-colors"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors ml-auto"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feature Checklist Card */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Feature Tags</h3>
                  <p className="text-[11px] text-slate-500 font-poppins">Select all capabilities that apply</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="px-2.5 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <FiPlus size={13} />
                  New Tag
                </button>
              </div>

              <input
                type="text"
                value={featureSearch}
                onChange={e => setFeatureSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                placeholder="Search feature tags..."
              />

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {featuresLoading ? (
                  <p className="text-xs text-slate-400 p-2">Loading tags...</p>
                ) : (
                  availableFeatures
                    .filter(f => !featureSearch || f.name.toLowerCase().includes(featureSearch.toLowerCase()))
                    .map(f => {
                      const active = selectedIds.has(f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => toggleFeature(f.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                            active
                              ? 'bg-primary/5 border-primary/30 text-primary font-semibold'
                              : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/80 text-slate-700'
                          }`}
                        >
                          <span className="text-xs font-poppins truncate">{f.name}</span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            active ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {active && <FiCheck size={11} />}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Submit Action Controls */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => submitForm(false)}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiSave size={14} />
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => submitForm(true)}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiEye size={14} />
                Publish Product
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default ProductForm;
