'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiGlobe, FiEdit2, FiTrash2, FiDollarSign, FiSend } from 'react-icons/fi';

const ServiceCard = ({ service, index = 0, isStaff = false, onEdit, onDelete, onRecordPayment }) => {
  const formattedNumber = String(index + 1).padStart(2, '0');
  const totalPrice = Number(service?.price || 0);
  const totalDiscount = Number(service?.discount || 0);
  const netPrice = Math.max(0, totalPrice - totalDiscount);

  // Strip HTML tags for clean description excerpt
  const getExcerpt = (htmlString) => {
    if (!htmlString) return '';
    const cleanText = htmlString.replace(/<[^>]+>/g, '');
    return cleanText;
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
        <div className="p-6 flex flex-col gap-4 grow">
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
        </div>

        <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-slate-900">${netPrice}</span>
              {totalDiscount > 0 && (
                <span className="text-xs text-slate-400 line-through">${totalPrice}</span>
              )}
            </div>
            {service?.payment_status && (
              <span className={`text-[10px] uppercase font-semibold block ${
                service.payment_status === 'paid' ? 'text-emerald-600' : service.payment_status === 'due' ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {service.payment_status}
              </span>
            )}
          </div>

          {isStaff ? (
            <div className="flex items-center gap-1">
              {onRecordPayment && (
                <button
                  type="button"
                  onClick={() => onRecordPayment(service)}
                  className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Record Payment"
                >
                  <FiDollarSign size={15} />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(service)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Edit Service"
                >
                  <FiEdit2 size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(service.id, service.name)}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Delete Service"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/user/tickets"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
            >
              <FiSend size={13} /> Request Proposal
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
