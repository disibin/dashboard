'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheck, FiGlobe, FiBox, FiShoppingBag, FiShoppingCart, FiCheckSquare } from 'react-icons/fi';
import { CURRENCY } from '@/lib/database/secret';

export default function UserPackageCard({
  pkg,
  index = 0,
  isSelected = false,
  onToggleSelect,
  onBuyNow
}) {
  const finalPrice = Math.max(0, (pkg.price || 0) - (pkg.discount || 0));
  const imageSrc = pkg?.image;
  const formattedNumber = String(index + 1).padStart(2, '0');
  const targetHref = `/user/packages/${pkg.slug || pkg.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <div className={`group flex flex-col justify-between bg-white overflow-hidden box-border h-full rounded-2xl border transition-all duration-300 relative ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}>

        <div className="absolute top-3 left-3 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleSelect?.(pkg);
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isSelected
                ? 'bg-primary text-white shadow-primary/30'
                : 'bg-white/90 backdrop-blur-xs text-slate-600 border border-slate-200 hover:bg-white hover:border-primary hover:text-primary'
            }`}
          >
            {isSelected ? <FiCheckSquare size={13} /> : <FiShoppingCart size={13} />}
            <span>{isSelected ? 'In Cart' : '+ Cart'}</span>
          </button>
        </div>

        <Link href={targetHref} className="flex flex-col justify-between grow no-underline pt-8">
          <div className="p-4 flex flex-col gap-3.5 grow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-mono font-semibold text-slate-400 m-0">
                  #{formattedNumber}
                </span>
                <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                  <FiGlobe size={11} /> {pkg.tenant_name || 'Global'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-slate-900">{CURRENCY}{finalPrice}</span>
                {pkg.discount > 0 && (
                  <span className="text-xs text-slate-400 line-through ml-1.5">{CURRENCY}{pkg.price}</span>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors m-0">
              {pkg?.name}
            </h3>

            {pkg?.description && (
              <div
                className="text-xs leading-relaxed text-slate-600 m-0 line-clamp-3 prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: pkg.description }}
              />
            )}

            {Array.isArray(pkg.features) && pkg.features.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-auto">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Included Deliverables ({pkg.features.length})
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {pkg.features.slice(0, 3).map((f) => (
                    <div key={f.feature_id || f.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <FiCheck className="text-emerald-500 shrink-0" size={12} />
                      <span className="truncate">{f.feature_name || f.name}</span>
                    </div>
                  ))}
                  {pkg.features.length > 3 && (
                    <p className="text-[11px] text-slate-400 font-medium pl-4">
                      +{pkg.features.length - 3} more deliverables
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative w-full overflow-hidden px-4 flex items-end bg-slate-50 aspect-video mt-auto">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={pkg?.name || 'Package Image'}
                width={600}
                height={350}
                className="w-full aspect-video h-auto block transition-transform duration-500 group-hover:scale-102 object-cover rounded-t-xl"
                unoptimized
              />
            ) : (
              <div className="w-full h-36 bg-slate-100/70 flex items-center justify-center text-slate-400 rounded-t-xl">
                <FiBox size={28} className="text-amber-500/60" />
              </div>
            )}
          </div>
        </Link>

        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(pkg);
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
              isSelected
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FiShoppingCart size={13} />
            {isSelected ? '✓ In Cart' : '+ Add to Cart'}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow?.(pkg);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-primary text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FiShoppingBag size={13} />
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
