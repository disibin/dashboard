'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiX, FiPaperclip, FiLoader, FiPlusCircle } from 'react-icons/fi';

export default function NewTicketModal({ isOpen, onClose, onSuccess }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        continue;
      }
      newItems.push({
        file,
        file_url: URL.createObjectURL(file),
        file_id: null,
      });
    }
    setImages(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      return toast.error('Subject and initial message are required');
    }

    setSubmitting(true);
    try {
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          if (img.file) {
            const formData = new FormData();
            formData.append('image', img.file);
            const res = await axios.post('/api/image', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
              return { file_url: res.data.data.url, file_id: res.data.data.public_id };
            } else {
              throw new Error(res.data.message || 'Image upload failed');
            }
          }
          return { file_url: img.file_url, file_id: img.file_id };
        })
      );

      const res = await axios.post('/api/user/ticket', {
        subject: subject.trim(),
        message: message.trim(),
        images: uploadedImages
      });

      if (res.data.success) {
        toast.success('Ticket created successfully!');
        setSubject('');
        setMessage('');
        setImages([]);
        onClose();
        onSuccess?.(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to create ticket');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FiPlusCircle className="text-primary" size={18} />
            Create Support Ticket
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          >
            <FiX size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ticket Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="E.g. Issue with billing / project inquiry"
              required
              className="input-style text-xs py-1.5"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Message *
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue or inquiry in detail..."
              rows={4}
              required
              className="input-style resize-none text-xs py-1.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Image Attachments (Optional)
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || submitting}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                {uploading ? <FiLoader className="animate-spin" size={12} /> : <FiPaperclip size={12} />}
                Add Screenshot
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            {images.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                {images.map((img, idx) => (
                  <div key={idx} className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                    <img src={img.file_url} alt="Attachment" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/60 text-white flex items-center justify-center text-[9px] hover:bg-rose-600"
                    >
                      <FiX size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-4 py-2 bg-slate-900 hover:bg-primary text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-xs flex items-center gap-1.5"
            >
              {submitting ? <FiLoader className="animate-spin" size={13} /> : null}
              {submitting ? 'Creating Ticket...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
