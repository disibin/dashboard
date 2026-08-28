'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiSend, FiPaperclip,
  FiCreditCard, FiFileText, FiLoader, FiExternalLink, FiPlus, FiAlertCircle,
  FiPrinter, FiEdit3, FiCheckCircle
} from 'react-icons/fi';
import TiptapEditor from '@/component/helper/TiptapEditor';
import PrintableAgreement from '@/component/projects/PrintableAgreement';

export default function TeamProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id;

  const [projectData, setProjectData] = useState(null);
  const [products, setProducts] = useState([]);

  // Chat & file state
  const [message, setMessage] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Purchase / Payment Form
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purProductId, setPurProductId] = useState('');
  const [purPrice, setPurPrice] = useState('');
  const [purDiscount, setPurDiscount] = useState('0');
  const [creatingPurchase, setCreatingPurchase] = useState(false);

  // Preview Image
  const [previewImage, setPreviewImage] = useState(null);

  // Payment Status
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  // Agreement Form with Tiptap
  const [showAgreementForm, setShowAgreementForm] = useState(false);
  const [editingAgreementId, setEditingAgreementId] = useState(null);
  const [agrTitle, setAgrTitle] = useState('');
  const [agrStartDate, setAgrStartDate] = useState('');
  const [agrExpireDate, setAgrExpireDate] = useState('');
  const [agrStatus, setAgrStatus] = useState('pending');
  const [agrDescription, setAgrDescription] = useState('');
  const [creatingAgreement, setCreatingAgreement] = useState(false);

  // Printable Agreement Modal
  const [printableAgreement, setPrintableAgreement] = useState(null);

  const fileInputRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    fetchWorkspace(false);
    fetchProducts();

    // Live polling for continuous messaging without page refresh
    const interval = setInterval(() => {
      fetchWorkspace(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    const currentCount = projectData?.messages?.length || 0;
    if (currentCount > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = currentCount;
  }, [projectData?.messages]);

  const fetchWorkspace = async (isSilent = false) => {
    try {
      const res = await axios.get(`/api/team/projects/${projectId}`);
      if (res.data.success) {
        setProjectData(res.data.data);
      } else if (!isSilent) {
        toast.error(res.data.message || 'Project not found');
      }
    } catch {
      if (!isSilent) toast.error('Failed to load project workspace');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/public/product');
      if (res.data.success) setProducts(res.data.data);
    } catch {}
  };

  const handleProductSelect = (selectedId) => {
    setPurProductId(selectedId);
    if (!selectedId) return;
    const prod = products.find(p => String(p.id) === String(selectedId));
    if (prod) {
      const priceVal = prod.price || prod.product_price || (prod.prices && prod.prices[0]?.price) || '';
      if (priceVal) setPurPrice(String(priceVal));
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await axios.patch(`/api/team/projects/${projectId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Project status updated to ${newStatus}`);
        setProjectData(prev => ({
          ...prev,
          project: { ...prev.project, status: newStatus }
        }));
      } else {
        toast.error(res.data.message || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update project status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !attachmentFile) return;

    setSending(true);
    const formData = new FormData();
    if (message.trim()) formData.append('message', message.trim());
    if (attachmentFile) formData.append('file', attachmentFile);

    try {
      const res = await axios.post(`/api/team/projects/${projectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setMessage('');
        setAttachmentFile(null);
        fetchWorkspace(true);
      } else {
        toast.error(res.data.message || 'Failed to send message');
      }
    } catch {
      toast.error('Error sending staff message');
    } finally {
      setSending(false);
    }
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!purPrice) return toast.error('Purchase price is required');

    setCreatingPurchase(true);
    try {
      const res = await axios.post('/api/team/projects/purchase', {
        project_id: projectId,
        product_id: purProductId || projectData?.project?.product_id || null,
        price: purPrice,
        discount: purDiscount
      });

      if (res.data.success) {
        toast.success('Payment proposal created!');
        setShowPurchaseForm(false);
        setPurPrice('');
        fetchWorkspace(true);
      } else {
        toast.error(res.data.message || 'Failed to create purchase');
      }
    } catch {
      toast.error('Failed to create purchase');
    } finally {
      setCreatingPurchase(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, status, paidAmount) => {
    setUpdatingPaymentId(paymentId);
    try {
      const res = await axios.patch('/api/team/projects/payment', {
        payment_id: paymentId,
        status,
        paid: paidAmount
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Payment marked as completed');
        fetchWorkspace(true);
      } else {
        toast.error(res.data.message || 'Failed to update payment');
      }
    } catch {
      toast.error('Error updating payment');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const startEditAgreement = (agr) => {
    setEditingAgreementId(agr.id);
    setAgrTitle(agr.title || '');
    setAgrStartDate(agr.start_date ? new Date(agr.start_date).toISOString().split('T')[0] : '');
    setAgrExpireDate(agr.expire_date ? new Date(agr.expire_date).toISOString().split('T')[0] : '');
    setAgrStatus(agr.status || 'pending');
    setAgrDescription(agr.description || '');
    setShowAgreementForm(true);
  };

  const resetAgreementForm = () => {
    setEditingAgreementId(null);
    setAgrTitle('');
    setAgrStartDate('');
    setAgrExpireDate('');
    setAgrStatus('pending');
    setAgrDescription('');
    setShowAgreementForm(false);
  };

  const handleCreateOrUpdateAgreement = async (e) => {
    e.preventDefault();
    if (!agrTitle.trim()) return toast.error('Agreement title is required');

    setCreatingAgreement(true);
    try {
      if (editingAgreementId) {
        const res = await axios.patch('/api/team/agreements', {
          id: editingAgreementId,
          title: agrTitle.trim(),
          description: agrDescription,
          start_date: agrStartDate || new Date(),
          expire_date: agrExpireDate || null,
          status: agrStatus
        });
        if (res.data.success) {
          toast.success('Agreement updated!');
          resetAgreementForm();
          fetchWorkspace(true);
        } else {
          toast.error(res.data.message || 'Failed to update agreement');
        }
      } else {
        const res = await axios.post('/api/team/agreements', {
          title: agrTitle.trim(),
          project_id: projectId,
          user_id: projectData?.project?.user_id || null,
          description: agrDescription,
          start_date: agrStartDate || new Date(),
          expire_date: agrExpireDate || null,
          status: agrStatus
        });
        if (res.data.success) {
          toast.success('Agreement created successfully!');
          resetAgreementForm();
          fetchWorkspace(true);
        } else {
          toast.error(res.data.message || 'Failed to create agreement');
        }
      }
    } catch {
      toast.error('Error saving agreement');
    } finally {
      setCreatingAgreement(false);
    }
  };

  if (!projectData || !projectData.project) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-3">
        <Toaster position="top-center" />
        <FiAlertCircle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-base font-bold text-slate-800">Project Not Found</h2>
        <Link
          href="/team/projects"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
        >
          <FiArrowLeft size={14} /> Back to Projects
        </Link>
      </div>
    );
  }

  const { project, messages, attachments, purchases, agreements } = projectData;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <Toaster position="top-center" />

      {/* Printable Agreement Modal */}
      {printableAgreement && (
        <PrintableAgreement
          agreement={printableAgreement}
          project={project}
          onClose={() => setPrintableAgreement(null)}
        />
      )}

      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/team/projects"
            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
            title="Back to Projects"
          >
            <FiArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">{project.title}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Customer: <strong className="text-slate-800">{project.user_name || 'Customer'}</strong> ({project.user_email}){project.product_name ? ` · Base: ${project.product_name}` : ''}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live Auto Sync" />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Status:</span>
          <select
            value={project.status}
            disabled={updatingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
          >
            <option value="pending">Pending</option>
            <option value="working">Working</option>
            <option value="ready">Ready</option>
            <option value="ontest">Testing</option>
            <option value="fixing">Fixing</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Discussion Thread (7 cols) & Sidebar Controls (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Discussion Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[480px]">
            <div className="p-3 border-b border-slate-100 bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-between">
              <span>Live Discussion Workspace</span>
              <span className="text-[10px] text-slate-400 font-normal">Realtime Staff Chat</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No discussion messages recorded. Send your staff response below.
                </div>
              ) : (
                messages.map((m) => {
                  const isStaff = !!m.team_id;
                  const msgAtts = attachments?.filter(att => att.message_id === m.id) || [];
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isStaff ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[85%] sm:max-w-[75%]`}
                    >
                      <div className="text-[11px] font-semibold text-slate-500 mb-0.5 px-1">
                        {isStaff ? `${m.team_name || 'Staff'} (${m.team_role || 'Staff'})` : (m.user_name || 'Customer')}
                      </div>
                      <div className={`p-3 rounded-xl text-xs leading-relaxed max-w-md space-y-2 ${
                        isStaff ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {m.message && <p className="whitespace-pre-wrap">{m.message}</p>}
                        {msgAtts.length > 0 && (
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {msgAtts.map(att => (
                              <img
                                key={att.id}
                                src={att.file_url}
                                alt="Attachment"
                                onClick={() => setPreviewImage(att.file_url)}
                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-black/10"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Staff Reply Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => setAttachmentFile(e.target.files[0])}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 border border-slate-200 hover:bg-white text-slate-500 rounded-lg text-xs"
                title="Attach File"
              >
                <FiPaperclip size={15} />
              </button>

              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type staff response..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
              />

              <button
                type="submit"
                disabled={sending || (!message.trim() && !attachmentFile)}
                className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {sending ? <FiLoader className="animate-spin" size={13} /> : <FiSend size={13} />}
                Reply
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-3 text-xs">
          {/* Billing & Purchases */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <FiCreditCard size={14} className="text-slate-500" /> Billing & Purchases
              </h3>
              <button
                onClick={() => setShowPurchaseForm(!showPurchaseForm)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <FiPlus size={13} /> New Purchase
              </button>
            </div>

            {showPurchaseForm && (
              <form onSubmit={handleCreatePurchase} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Base</label>
                  <select
                    value={purProductId}
                    onChange={e => handleProductSelect(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="">Custom Service Proposal</option>
                    {products.map(p => {
                      const priceVal = p.price || p.product_price || (p.prices && p.prices[0]?.price) || '';
                      return (
                        <option key={p.id} value={p.id}>{p.name} {priceVal ? `($${priceVal})` : ''}</option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Price ($) *</label>
                    <input
                      type="number"
                      required
                      value={purPrice}
                      onChange={e => setPurPrice(e.target.value)}
                      placeholder="Price"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={purDiscount}
                      onChange={e => setPurDiscount(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPurchaseForm(false)}
                    className="px-2.5 py-1 text-slate-500 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingPurchase}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded"
                  >
                    {creatingPurchase ? 'Saving...' : 'Create Invoice'}
                  </button>
                </div>
              </form>
            )}

            {purchases.length === 0 ? (
              <p className="text-slate-400">No purchases generated yet.</p>
            ) : (
              purchases.map(pur => (
                <div key={pur.purchase_id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Proposal #{pur.purchase_id}</span>
                    <span className="font-bold text-slate-900">${pur.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Payment Status</span>
                    <span className={`font-semibold uppercase px-2 py-0.5 rounded text-[10px] ${
                      pur.payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pur.payment_status || 'unpaid'}
                    </span>
                  </div>
                  {pur.payment_status !== 'paid' && (
                    <div className="pt-1 text-right">
                      <button
                        onClick={() => handleUpdatePaymentStatus(pur.payment_id, 'paid', pur.payment_price || pur.price)}
                        disabled={updatingPaymentId === pur.payment_id}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] flex items-center gap-1 inline-flex"
                      >
                        <FiCheckCircle size={11} /> Mark Paid
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Agreements Section in Sidebar (Original Layout Location) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <FiFileText size={14} className="text-slate-500" /> Agreements
              </h3>
              <button
                onClick={() => {
                  if (showAgreementForm && !editingAgreementId) {
                    setShowAgreementForm(false);
                  } else {
                    resetAgreementForm();
                    setShowAgreementForm(true);
                  }
                }}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <FiPlus size={13} /> Add Document
              </button>
            </div>

            {/* Agreement Create / Edit Form with Tiptap Editor */}
            {showAgreementForm && (
              <form onSubmit={handleCreateOrUpdateAgreement} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    {editingAgreementId ? 'Edit Agreement' : 'New Agreement'}
                  </span>
                  <button type="button" onClick={resetAgreementForm} className="text-[11px] text-slate-400 hover:text-slate-700">
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">Title *</label>
                  <input
                    type="text"
                    required
                    value={agrTitle}
                    onChange={e => setAgrTitle(e.target.value)}
                    placeholder="E.g. Scope of Work & Terms"
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">Start Date</label>
                    <input
                      type="date"
                      value={agrStartDate}
                      onChange={e => setAgrStartDate(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">Expire Date</label>
                    <input
                      type="date"
                      value={agrExpireDate}
                      onChange={e => setAgrExpireDate(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">Status</label>
                  <select
                    value={agrStatus}
                    onChange={e => setAgrStatus(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="signed">Signed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">Terms (Tiptap Editor)</label>
                  <TiptapEditor
                    value={agrDescription}
                    onChange={setAgrDescription}
                    placeholder="Write terms..."
                    minHeight="140px"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetAgreementForm}
                    className="px-2.5 py-1 text-slate-500 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAgreement}
                    className="px-3 py-1 bg-primary text-white font-semibold rounded text-xs"
                  >
                    {creatingAgreement ? 'Saving...' : editingAgreementId ? 'Update' : 'Save Agreement'}
                  </button>
                </div>
              </form>
            )}

            {agreements.length === 0 ? (
              <p className="text-slate-400">No agreement document added.</p>
            ) : (
              agreements.map(agr => (
                <div key={agr.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 truncate">{agr.title}</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                      agr.status === 'signed' || agr.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : agr.status === 'active'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {agr.status || 'pending'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Start: {agr.start_date ? new Date(agr.start_date).toLocaleDateString() : 'N/A'}</span>
                    <span>Expire: {agr.expire_date ? new Date(agr.expire_date).toLocaleDateString() : 'None'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      onClick={() => setPrintableAgreement(agr)}
                      className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <FiExternalLink size={11} /> View Document
                    </button>

                    <button
                      onClick={() => startEditAgreement(agr)}
                      className="text-slate-500 hover:text-slate-900 font-semibold text-[11px] inline-flex items-center gap-0.5"
                    >
                      <FiEdit3 size={11} /> Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
