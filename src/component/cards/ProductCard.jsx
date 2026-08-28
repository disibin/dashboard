'use client';
import React from 'react';
import Image from 'next/image';
import { FiPackage, FiGlobe, FiExternalLink, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';

export default function ProductCard({ product, onEdit, onDelete, isStaff = false }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden space-y-4">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {product.image ? (
            <Image
              width={500}
              height={500}
              src={product.image}
              alt={product.name}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FiPackage size={22} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors">
              {product.name}
            </h3>
          </div>
        </div>

        {product.title && (
          <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {product.title}
          </p>
        )}

        {isStaff && product.created_by_name && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <FiUser size={13} /> Created by: {product.created_by_name}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        {product.link ? (
          <a
            href={product.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm"
          >
            <FiGlobe size={13} /> Live Demo <FiExternalLink size={11} />
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic">No public demo link</span>
        )}

        {isStaff && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(product)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                title="Edit Product"
              >
                <FiEdit2 size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(product.id, product.name, product.image_id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                title="Delete Product"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
