'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiPaperclip, FiSend,
  FiLoader, FiX, FiAlertCircle, FiMoreVertical,
  FiCheck, FiEdit2, FiBox, FiCreditCard,
  FiDollarSign, FiActivity, FiClock, FiPlayCircle,
  FiCheckCircle, FiSlash, FiUser
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';

export default function StaffProjectChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id;

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('status'); 
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('waiting');
  const [updatingTitle, setUpdatingTitle] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    fetchChat(false);

    const interval = setInterval(() => {
      fetchChat(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    if (thread?.chat?.title) {
      setEditingTitle(thread.chat.title);
    }
    if (thread?.chat?.status) {
      setSelectedStatus(thread.chat.status);
    }
  }, [thread?.chat?.title, thread?.chat?.status]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    const currentCount = (thread?.messages?.length || 0) + (thread?.images?.length || 0);
    if (currentCount > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = currentCount;
  }, [thread?.messages, thread?.images]);

  const fetchChat = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get(`/api/staff/projects/chat?chat_id=${chatId}`);
      if (res.data.success) {
        setThread(res.data.data);
      } else if (!isSilent) {
        toast.error(res.data.message || 'Failed to load project chat');
      }
    } catch {
      if (!isSilent) toast.error('Failed to load conversation thread');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only images allowed');
        continue;
      }
      newItems.push({
        file,
        file_url: URL.createObjectURL(file),
        file_id: null,
      });
    }
    setAttachedImages(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedImage = (index) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && attachedImages.length === 0) return;

    setSendingMsg(true);
    try {
      let uploadedImages = [];
      if (attachedImages.length > 0) {
        setUploadingImage(true);
        uploadedImages = await Promise.all(
          attachedImages.map(async (img) => {
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
        setUploadingImage(false);
      }

      const payload = {
        chat_id: chatId,
        message: messageText.trim(),
        images: uploadedImages
      };

      const res = await axios.post('/api/staff/projects/chat', payload);
      if (res.data.success) {
        setMessageText('');
        setAttachedImages([]);
        fetchChat(true);
      } else {
        toast.error(res.data.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
      setUploadingImage(false);
    }
  };

  const handleRenameTitle = async (e) => {
    e.preventDefault();
    if (!editingTitle.trim()) return toast.error('Please enter a title');

    setUpdatingTitle(true);
    try {
      const res = await axios.patch('/api/staff/projects/chat', {
        chat_id: chatId,
        title: editingTitle.trim()
      });
      if (res.data.success) {
        toast.success('Project chat title updated!');
        setThread((prev) => ({
          ...prev,
          chat: { ...prev.chat, title: res.data.data.title }
        }));
      } else {
        toast.error(res.data.message || 'Failed to update title');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update title');
    } finally {
      setUpdatingTitle(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStatus) return;

    setUpdatingStatus(true);
    try {
      const res = await axios.patch('/api/staff/projects/chat', {
        chat_id: chatId,
        status: selectedStatus
      });
      if (res.data.success) {
        toast.success('Project status updated!');
        setThread((prev) => ({
          ...prev,
          chat: { ...prev.chat, status: res.data.data.status }
        }));
      } else {
        toast.error(res.data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl inline-flex items-center gap-1"><FiCheckCircle size={12} /> Completed</span>;
      case 'working':
        return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl inline-flex items-center gap-1"><FiActivity size={12} /> Working</span>;
      case 'progress':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl inline-flex items-center gap-1"><FiPlayCircle size={12} /> In Progress</span>;
      case 'spam':
        return <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl inline-flex items-center gap-1"><FiSlash size={12} /> Spam</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl inline-flex items-center gap-1"><FiClock size={12} /> Waiting</span>;
    }
  };

  if (loading && !thread) {
    return (
      <div className="p-4 text-center text-slate-400 space-y-2">
        <Toaster position="top-center" />
        <FiLoader className="animate-spin mx-auto text-primary" size={28} />
        <p className="text-xs font-medium">Loading project conversation...</p>
      </div>
    );
  }

  if (!thread || !thread.chat) {
    return (
      <div className="p-4 max-w-xl mx-auto text-center space-y-3">
        <Toaster position="top-center" />
        <FiAlertCircle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-base font-semibold text-slate-800">Project Chat Not Found</h2>
        <Link
          href="/panel/projects"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
        >
          <FiArrowLeft size={14} /> Back to Project Chats
        </Link>
      </div>
    );
  }

  const { chat, messages = [], images = [] } = thread;
  const netPrice = Number(chat.purchase_price || chat.package_price || 0);

  return (
    <div className="w-full space-y-4 p-4">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/panel/projects"
            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
            title="Back to Project Chats"
          >
            <FiArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span>{chat.title || chat.package_name || 'Package Project'}</span>
              <span className="text-xs font-mono font-normal text-slate-400">#{chat.id}</span>
              {getStatusBadge(chat.status)}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Customer: <strong className="text-slate-800">{chat.user_name || 'Client'}</strong> ({chat.user_email || 'N/A'}) · Created {new Date(chat.created_at).toLocaleDateString()}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live Auto Sync" />
            </p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className={`px-3 py-1.5 border rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              showMenu ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <FiMoreVertical size={16} />
            <span>Options Menu</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-80 sm:w-96 space-y-4 animate-in fade-in zoom-in duration-150">

              <div className="grid grid-cols-2 gap-1.5 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'status'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FiActivity size={13} /> 1. Status
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('rename')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'rename'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FiEdit2 size={13} /> 2. Title
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'details'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FiBox size={13} /> 3. Details
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('purchase')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'purchase'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FiUser size={13} /> 4. Client
                </button>
              </div>

              {activeTab === 'status' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Status</span>
                    {getStatusBadge(chat.status)}
                  </div>

                  <form onSubmit={handleUpdateStatus} className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-semibold text-slate-700 block">Set Project Status</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'waiting', label: 'Waiting', icon: FiClock },
                        { key: 'progress', label: 'In Progress', icon: FiPlayCircle },
                        { key: 'working', label: 'Working', icon: FiActivity },
                        { key: 'completed', label: 'Completed', icon: FiCheckCircle },
                        { key: 'spam', label: 'Spam', icon: FiSlash }
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const isSelected = selectedStatus === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setSelectedStatus(item.key)}
                            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <IconComponent size={13} /> {item.label}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      disabled={updatingStatus || selectedStatus === chat.status}
                      className="w-full mt-2 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {updatingStatus ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                      Update Status
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'rename' && (
                <form onSubmit={handleRenameTitle} className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Rename Title</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Enter chat title..."
                      className="input-style text-xs flex-1"
                      required
                    />
                    <button
                      type="submit"
                      disabled={updatingTitle || !editingTitle.trim()}
                      className="px-3 py-2 bg-slate-900 hover:bg-primary text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    >
                      {updatingTitle ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                      Save
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'details' && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{chat.title}</h3>
                      <p className="text-[10px] text-slate-400">Project #{chat.id}</p>
                    </div>
                    {getStatusBadge(chat.status)}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Description / Scope</span>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {chat.description || 'No project description provided yet.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>Created: </span>
                    <strong className="text-slate-700 font-medium">
                      {new Date(chat.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                  </div>
                </div>
              )}

              {activeTab === 'purchase' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Client Information</span>
                    <p className="text-xs font-medium text-slate-800 mt-1 flex items-center gap-1">
                      <FiUser size={13} className="text-slate-400" />
                      {chat.user_name || 'Client'} ({chat.user_email || 'No email'})
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Payment Status</span>
                    <div className="mt-1">
                      {chat.payment_status === 'paid' ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl inline-flex items-center gap-1">
                          <FiCheck size={13} /> Paid — {formatCurrency(chat.paid || netPrice)}
                        </span>
                      ) : chat.payment_status === 'unpaid' ? (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl inline-flex items-center gap-1">
                          <FiAlertCircle size={13} /> Payment Due — {formatCurrency(chat.due || netPrice)}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold rounded-xl">
                          No Payment Created Yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-14rem)] min-h-[400px] shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(() => {
            const combinedTimeline = [
              ...messages.map((m) => ({
                type: 'message',
                id: `msg-${m.id}`,
                sender_type: m.sender_type || (m.user_id ? 'user' : 'staff'),
                sender_name: m.sender_type === 'user' ? (chat.user_name || m.sender_name || 'Customer') : (m.sender_name || 'Disibin Support'),
                content: m.message,
                created_at: m.created_at,
              })),
              ...images.map((img) => ({
                type: 'image',
                id: `img-${img.id}`,
                sender_type: img.user_id ? 'user' : 'staff',
                sender_name: img.user_id ? (img.user_name || chat.user_name || 'Customer') : (img.staff_name || 'Disibin Support'),
                file_url: img.file_url,
                created_at: img.created_at,
              })),
            ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            if (combinedTimeline.length === 0) {
              return (
                <div className="py-5 text-center text-slate-400 text-xs">
                  No messages yet in this discussion. Send a response or image below.
                </div>
              );
            }

            return (
              <>
                {combinedTimeline.map((item) => {
                  const isStaffItem = item.sender_type === 'staff';

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col ${isStaffItem ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[85%] sm:max-w-[75%]`}
                    >
                      <div className="text-[11px] font-semibold text-slate-500 mb-0.5 px-1">
                        {isStaffItem ? `${item.sender_name} (Support)` : `${item.sender_name} (Customer)`}
                      </div>

                      {item.type === 'message' ? (
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed ${
                            isStaffItem
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{item.content}</p>
                        </div>
                      ) : (
                        <div
                          onClick={() => setPreviewImage(item.file_url)}
                          className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer shadow-xs max-w-xs sm:max-w-sm"
                        >
                          <img
                            src={item.file_url}
                            alt="Attachment"
                            className="w-full h-auto max-h-80 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                            Click to View Image
                          </div>
                        </div>
                      )}

                      <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </>
            );
          })()}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-2">
          {attachedImages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {attachedImages.map((img, idx) => (
                <div key={idx} className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                  <img src={img.file_url} alt="Attachment" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAttachedImage(idx)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                  >
                    <FiX size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || sendingMsg}
              className="p-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs transition-colors cursor-pointer"
              title="Attach Image"
            >
              {uploadingImage ? <FiLoader className="animate-spin text-primary" size={16} /> : <FiPaperclip size={16} />}
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write response to customer..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary"
            />

            <button
              type="submit"
              disabled={(!messageText.trim() && attachedImages.length === 0) || uploadingImage || sendingMsg}
              className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer shadow-sm"
            >
              {sendingMsg ? <FiLoader className="animate-spin" size={14} /> : <FiSend size={14} />}
              Send Reply
            </button>
          </form>
        </div>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Shared Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
