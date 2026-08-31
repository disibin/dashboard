'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiPaperclip, FiSend,
  FiLoader, FiX, FiAlertCircle, FiMoreVertical,
  FiInfo, FiCheck, FiEdit2
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/database/secret';

export default function UserProjectChatPage() {
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

  // Popup & Title Rename state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [updatingTitle, setUpdatingTitle] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMsgCountRef = useRef(0);

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
  }, [thread?.chat?.title]);

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
      const res = await axios.get(`/api/user/projects/chat?chat_id=${chatId}`);
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

      const res = await axios.post('/api/user/projects/chat', payload);
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
      const res = await axios.patch('/api/user/projects/chat', {
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

  if (loading && !thread) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 max-w-xl mx-auto">
        <Toaster position="top-center" />
        <FiLoader className="animate-spin mx-auto text-primary" size={28} />
        <p className="text-xs font-medium">Loading project discussion...</p>
      </div>
    );
  }

  if (!thread || !thread.chat) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-3">
        <Toaster position="top-center" />
        <FiAlertCircle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-base font-semibold text-slate-800">Project Chat Not Found</h2>
        <p className="text-xs text-slate-500">The requested package project conversation could not be loaded.</p>
        <Link
          href="/user/projects"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
        >
          <FiArrowLeft size={14} /> Back to My Projects
        </Link>
      </div>
    );
  }

  const { chat, messages, images } = thread;

  return (
    <div className="p-4 w-full space-y-4 max-w-5xl mx-auto">
      <Toaster position="top-center" />

      {/* Header Bar matching /user/tickets/[id] */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/user/projects"
            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
            title="Back to Projects"
          >
            <FiArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span>{chat.title || chat.package_name || 'Package Project'}</span>
              <span className="text-xs font-mono font-normal text-slate-400">#{chat.id}</span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Started {new Date(chat.created_at).toLocaleString()}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live Auto Sync" />
            </p>
          </div>
        </div>

        {/* Info & Menu Button */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          title="Project Info & Settings"
        >
          <FiMoreVertical size={16} />
          <span>Info & Actions</span>
        </button>
      </div>

      {/* Chat Thread Container matching /user/tickets/[id] */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-14rem)] min-h-[400px] shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (!images || images.length === 0) ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No messages yet. Send a message or image below to start the discussion.
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isUserMsg = msg.sender_type === 'user';

                return (
                  <div
                    key={`msg-${msg.id}`}
                    className={`flex flex-col ${isUserMsg ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[85%] sm:max-w-[75%]`}
                  >
                    <div className="text-[11px] font-semibold text-slate-500 mb-0.5 px-1">
                      {isUserMsg ? 'You' : (msg.sender_name || 'Disibin Support')}
                    </div>

                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isUserMsg
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {/* Shared Chat Images Grid */}
              {images && images.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Shared Images & Assets</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {images.map((img) => (
                      <div
                        key={`img-${img.id}`}
                        onClick={() => setPreviewImage(img.file_url)}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer shadow-xs"
                      >
                        <img
                          src={img.file_url}
                          alt="Shared asset"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                          View Image
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar matching /user/tickets/[id] */}
        <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-2">
          {attachedImages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {attachedImages.map((img, idx) => (
                <div key={idx} className="relative shrink-0 w-12 h-12 rounded-md overflow-hidden border border-slate-200">
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
              className="p-2 border border-slate-200 hover:bg-white text-slate-500 rounded-lg text-xs transition-colors cursor-pointer"
              title="Attach Image"
            >
              {uploadingImage ? <FiLoader className="animate-spin text-primary" size={16} /> : <FiPaperclip size={16} />}
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your project message or feedback..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
            />

            <button
              type="submit"
              disabled={(!messageText.trim() && attachedImages.length === 0) || uploadingImage || sendingMsg}
              className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer shadow-sm"
            >
              {sendingMsg ? <FiLoader className="animate-spin" size={14} /> : <FiSend size={14} />}
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
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

      {/* Project Info & Title Rename Popup Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-100 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  <FiInfo size={16} />
                </span>
                <h3 className="text-base font-semibold text-slate-900">Project Overview & Settings</h3>
              </div>
              <button onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            {/* Package Details */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Package & Platform</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Package Name</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{chat.package_name || 'Service Package'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Platform / Tenant</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{chat.tenant_name || 'Disibin Platform'}</p>
                </div>
              </div>
            </div>

            {/* Financial & Status Summary */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Financial & Payment Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Status</span>
                  <span className="text-xs font-bold text-emerald-600 capitalize block mt-0.5">{chat.purchase_status || 'Active'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Net Price</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">
                    {formatCurrency(Math.max(0, (chat.purchase_price || chat.package_price || 0) - (chat.purchase_discount || 0)))}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Paid</span>
                  <span className="text-xs font-bold text-emerald-600 block mt-0.5">{formatCurrency(chat.paid || 0)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Due</span>
                  <span className="text-xs font-bold text-rose-600 block mt-0.5">{formatCurrency(chat.due || 0)}</span>
                </div>
              </div>
            </div>

            {/* Rename Title Form */}
            <form onSubmit={handleRenameTitle} className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rename Package Chat Title</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Enter new chat title..."
                  className="input-style text-xs flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={updatingTitle || !editingTitle.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-primary text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                >
                  {updatingTitle ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                  Save Title
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
