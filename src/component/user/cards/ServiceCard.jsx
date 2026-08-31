'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiGlobe, FiSend } from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';

export default function UserServiceCard({ service, index = 0 }) {
  const formattedNumber = String(index + 1).padStart(2, '0');
  const totalPrice = Number(service?.price || 0);
  const totalDiscount = Number(service?.discount || 0);
  const netPrice = Math.max(0, totalPrice - totalDiscount);
  const targetHref = `/user/services/${service.slug || service.id}`;

  const getExcerpt = (htmlString) => {
    if (!htmlString) return '';
    return htmlString.replace(/<[^>]+>/g, '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <div className="group flex flex-col justify-between bg-white overflow-hidden box-border h-full border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 relative">
        <Link href={targetHref} className="p-3 flex flex-col gap-4 grow no-underline">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-gray-500 m-0">
              {formattedNumber}
            </p>

            {service?.tenant_name && (
              <span className="text-xs text-slate-400 group-hover:text-primary transition-colors flex items-center gap-1 font-medium">
                <FiGlobe size={12} /> {service.tenant_name}
              </span>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors m-0 font-poppins line-clamp-2">
            {service?.name}
          </h3>

          <p className="text-[16px] leading-normal text-gray-600 m-0 font-poppins line-clamp-3">
            {getExcerpt(service?.description)}
          </p>
        </Link>

        <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-slate-900">{formatCurrency(netPrice)}</span>
              {totalDiscount > 0 && (
                <span className="text-xs text-slate-400 line-through">{formatCurrency(totalPrice)}</span>
              )}
            </div>
          </div>

          <Link
            href={targetHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
          >
            <FiSend size={13} /> View Service
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
