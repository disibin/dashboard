'use client';
import React, { useState } from 'react';
import { FiUploadCloud, FiX, FiCheckCircle } from 'react-icons/fi';
import Image from 'next/image';

const ImageUpload = ({ onSelectFile, label = "Upload Image", value = null }) => {
  const [preview, setPreview] = useState(value);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    if (onSelectFile) {
      onSelectFile(file, previewUrl);
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    setPreview(null);
    if (onSelectFile) {
      onSelectFile(null, null);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative group">
        <div className={`
          relative w-full h-40 rounded-2xl border-2 border-dashed transition-all
          flex flex-col items-center justify-center cursor-pointer overflow-hidden
          ${preview ? 'border-primary' : 'border-slate-200 hover:border-primary-light bg-slate-50/50'}
        `}>
          {preview ? (
            <Image width={500} height={500} src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <FiUploadCloud className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors mb-2" />
              <p className="text-xs text-slate-500 font-medium">Click or drag to select image file</p>
            </>
          )}
          
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
          />

          {preview && (
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <p className="text-white text-xs font-semibold px-3 py-1 bg-slate-900/60 rounded-full backdrop-blur-md">Change Image</p>
            </div>
          )}
        </div>
        
        {preview && (
           <div className="absolute top-2 right-2 flex gap-1 z-20">
              <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                <FiCheckCircle size={14} />
              </div>
              <button 
                onClick={handleClear}
                className="bg-rose-500 text-white p-1 rounded-full shadow-lg hover:bg-rose-600 transition-colors cursor-pointer"
              >
                <FiX size={14} />
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
