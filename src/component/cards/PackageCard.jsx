'use client';
import React from 'react';
import Image from 'next/image';
import { FiCheck, FiEdit2, FiTrash2, FiGlobe, FiBox } from 'react-icons/fi';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PackageCard({ pkg, onEdit, onDelete, isStaff = false }) {
  const finalPrice = Math.max(0, pkg.price - (pkg.discount || 0));

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group space-y-4">
      <div>
        {pkg.image ? (
          <div className="w-full h-36 rounded-2xl mb-4 overflow-hidden border border-slate-100 bg-slate-50 relative">
            <Image
              width={600}
              height={300}
              src={pkg.image}
              alt={pkg.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-full h-24 rounded-2xl mb-4 border border-slate-100 bg-amber-50/50 flex items-center justify-center text-amber-500">
            <FiBox size={32} />
          </div>
        )}

        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 inline-flex items-center gap-1">
              <FiGlobe size={11} /> {pkg.tenant_name || 'Global'}
            </span>
            <h3 className="text-lg font-semibold text-slate-900 mt-2">{pkg.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-slate-900">${finalPrice}</div>
            {pkg.discount > 0 && (
              <div className="text-xs text-slate-400 line-through">${pkg.price}</div>
            )}
          </div>
        </div>

        {pkg.description && (
          <div
            className="text-xs text-slate-500 line-clamp-3 mb-4 prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: pkg.description }}
          />
        )}

        <div className="space-y-2 border-t border-slate-100 pt-4 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Included Features ({Array.isArray(pkg.features) ? pkg.features.length : 0})
          </span>
          {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
            pkg.features.map((f) => (
              <div key={f.feature_id || f.id} className="flex items-center gap-2 text-xs text-slate-700">
                <FiCheck className="text-emerald-500 shrink-0" size={14} />
                <span>{f.feature_name || f.name}</span>
              </div>
            ))
          ) : (
            <span className="text-xs italic text-slate-400">No feature details listed</span>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        {isStaff ? (
          <>
            <span className="text-[11px] text-slate-400">{fmtDate(pkg.created_at)}</span>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(pkg)}
                  className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                  title="Edit Package"
                >
                  <FiEdit2 size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(pkg.id, pkg.name, pkg.image_id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  title="Delete Package"
                >
                  <FiTrash2 size={15} />
                </button>
              )}
            </div>
          </>
        ) : (
          <a
            href="/user/tickets"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
          >
            Request Package Proposal
          </a>
        )}
      </div>
    </div>
  );
}
