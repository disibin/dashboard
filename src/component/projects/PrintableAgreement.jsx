'use client';

import React from 'react';
import { FiPrinter, FiX, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';

export default function PrintableAgreement({ agreement, project, onClose }) {
  if (!agreement) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Top Control Bar - Hidden when printing */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 font-bold text-sm">
            <FiFileText size={18} className="text-primary-light" />
            <span>Printable Project Agreement Document</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <FiPrinter size={15} /> Print Agreement / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Close Preview"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Contract Sheet Content (Print Target) */}
        <div className="p-8 sm:p-12 text-slate-800 space-y-8 bg-white print:p-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-6 gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Disibin</h1>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                Software Solutions & Tech Services
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-md">
                Official Contract
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Ref ID: AGREEMENT-{agreement.id}</p>
            </div>
          </div>

          {/* Title Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">{agreement.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                agreement.status === 'signed' || agreement.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : agreement.status === 'active'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                Status: {agreement.status || 'Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              This legally binding agreement outlines terms, scope, and parameters between Disibin and the Client.
            </p>
          </div>

          {/* Contract Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50/60 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="block font-semibold text-slate-400 uppercase text-[10px]">Project Name</span>
              <span className="font-bold text-slate-800">{project?.title || `Project #${agreement.project_id}`}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400 uppercase text-[10px]">Client / Account</span>
              <span className="font-bold text-slate-800">{project?.user_name || 'Customer'}</span>
              <span className="block text-[10px] text-slate-500 truncate">{project?.user_email}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400 uppercase text-[10px]">Start Date</span>
              <span className="font-bold text-slate-800">{formatDate(agreement.start_date)}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400 uppercase text-[10px]">Expiration Date</span>
              <span className="font-bold text-slate-800">{formatDate(agreement.expire_date)}</span>
            </div>
          </div>

          {/* Agreement Body / Description (Tiptap Rich Text HTML) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
              Agreement Terms & Scope
            </h3>
            {agreement.description ? (
              <div 
                className="prose prose-sm max-w-none text-slate-700 text-xs leading-relaxed space-y-2"
                dangerouslySetInnerHTML={{ __html: agreement.description }}
              />
            ) : (
              <p className="text-slate-400 text-xs italic">No detailed terms specified for this agreement.</p>
            )}
          </div>

          {/* Signatures Section */}
          <div className="pt-12 border-t border-slate-200 grid grid-cols-2 gap-12 text-xs">
            <div className="space-y-8">
              <div className="border-b border-slate-400 pb-1">
                <p className="font-bold text-slate-900">Disibin Authorized Representative</p>
                <p className="text-[10px] text-slate-500">Service Provider Signature & Stamp</p>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Signature: _______________________</span>
                <span>Date: ____________</span>
              </div>
            </div>

            <div className="space-y-8">
              <div className="border-b border-slate-400 pb-1">
                <p className="font-bold text-slate-900">{project?.user_name || 'Client Representative'}</p>
                <p className="text-[10px] text-slate-500">Client Signature & Acceptance</p>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Signature: _______________________</span>
                <span>Date: ____________</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-6 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-between">
            <span>Disibin Official Project Workspace Document</span>
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
