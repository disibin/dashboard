'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheck, FiEdit2, FiTrash2, FiGlobe, FiBox } from 'react-icons/fi';
import { CURRENCY } from '@/lib/database/secret';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function StaffPackageCard({ pkg, index = 0, onEdit, onDelete }) {
  const finalPrice = Math.max(0, (pkg.price || 0) - (pkg.discount || 0));
  const imageSrc = pkg?.image;
  const formattedNumber = String(index + 1).padStart(2, '0');
  const targetHref = `/panel/packages/${pkg.slug || pkg.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <div className="group flex flex-col justify-between bg-white overflow-hidden box-border h-full border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 relative">
        <Link href={targetHref} className="flex flex-col justify-between grow no-underline">
          <div className="p-3 flex flex-col gap-4 grow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-gray-500 m-0">
                  {formattedNumber}
                </span>
                <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                  <FiGlobe size={11} /> {pkg.tenant_name || 'Global'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-semibold text-gray-900 font-poppins">{CURRENCY}{finalPrice}</span>
                {pkg.discount > 0 && (
                  <span className="text-xs text-slate-400 line-through ml-1.5 font-poppins">{CURRENCY}{pkg.price}</span>
                )}
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors m-0 font-poppins">
              {pkg?.name}
            </h3>

            {pkg?.description && (
              <div
                className="text-[15px] leading-normal text-gray-700 m-0 font-poppins line-clamp-3 prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: pkg.description }}
              />
            )}

            {Array.isArray(pkg.features) && pkg.features.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-auto">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Features ({pkg.features.length})
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {pkg.features.slice(0, 4).map((f) => (
                    <div key={f.feature_id || f.id} className="flex items-center gap-2 text-xs text-slate-700">
                      <FiCheck className="text-emerald-500 shrink-0" size={13} />
                      <span className="truncate">{f.feature_name || f.name}</span>
                    </div>
                  ))}
                  {pkg.features.length > 4 && (
                    <p className="text-[11px] text-slate-400 font-medium pl-5">
                      +{pkg.features.length - 4} more features
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative w-full overflow-hidden px-4 flex items-end bg-emerald-50 aspect-video mt-auto">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={pkg?.name || 'Package Image'}
                width={600}
                height={350}
                className="w-full aspect-video h-auto block will-change-[transform,border-color] transition-[transform,border-color] duration-500 ease-[cubic-bezier(0,0,0,0.98)] object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-48 bg-slate-50 flex items-center justify-center text-slate-400 text-sm font-poppins border border-[#360065]/13">
                <FiBox size={32} className="text-amber-500/60" />
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none" />
          </div>
        </Link>

        {(onEdit || onDelete) && (
          <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-poppins pl-2">{fmtDate(pkg.created_at)}</span>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(pkg);
                  }}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  title="Edit Package"
                >
                  <FiEdit2 size={14} /> Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(pkg.id, pkg.name, pkg.image_id);
                  }}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  title="Delete Package"
                >
                  <FiTrash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
