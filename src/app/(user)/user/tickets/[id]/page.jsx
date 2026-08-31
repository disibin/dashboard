'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiPaperclip, FiSend,
  FiLoader, FiX, FiAlertCircle, FiEdit2, FiCheck
} from 'react-icons/fi';

export default function UserTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params?.id;

  const [thread, setThread] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [updatingTitle, setUpdatingTitle] = useState(false);

  useEffect(() => {
    if (thread?.ticket?.title) {
      setEditingTitle(thread.ticket.title);
    }
  }, [thread?.ticket?.title]);

  const handleUpdateTitle = async (e) => {
    if (e) e.preventDefault();
    if (!editingTitle.trim()) return toast.error('Please enter a ticket title');

    setUpdatingTitle(true);
    try {
      const res = await axios.patch(`/api/user/ticket/${ticketId}`, { title: editingTitle.trim() });
      if (res.data.success) {
        toast.success('Ticket title updated!');
        setThread((prev) => ({
          ...prev,
          ticket: { ...prev.ticket, title: res.data.data.title }
        }));
        setIsEditingTitle(false);
      } else {
        toast.error(res.data.message || 'Failed to update title');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update title');
    } finally {
      setUpdatingTitle(false);
    }
  };

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
    if (!ticketId) return;

    fetchThread(false);

    const interval = setInterval(() => {
      fetchThread(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    const currentCount = (thread?.messages?.length || 0) + (thread?.images?.length || 0);
    if (currentCount > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = currentCount;
  }, [thread?.messages, thread?.images]);

  const fetchThread = async (isSilent = false) => {
    try {
      const res = await axios.get(`/api/user/ticket/${ticketId}`);
      if (res.data.success) {
        setThread(res.data.data);
      } else if (!isSilent) {
        toast.error(res.data.message || 'Failed to load ticket');
      }
    } catch {
      if (!isSilent) toast.error('Failed to load conversation thread');
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
        message: messageText.trim(),
        images: uploadedImages
      };

      const res = await axios.post(`/api/user/ticket/${ticketId}`, payload);
      if (res.data.success) {
        setMessageText('');
        setAttachedImages([]);
        fetchThread(true);
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

  if (!thread || !thread.ticket) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-3">
        <Toaster position="top-center" />
        <FiAlertCircle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-base font-semibold text-slate-800">Ticket Not Found</h2>
        <Link
          href="/user/tickets"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
        >
          <FiArrowLeft size={14} /> Back to My Tickets
        </Link>
      </div>
    );
  }

  const { ticket, messages = [], images = [], attachments = [] } = thread;
  const sharedImagesList = images && images.length > 0 ? images : attachments;

  return (
    <div className="w-full space-y-4 p-4">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/user/tickets"
            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
            title="Back to Tickets"
          >
            <FiArrowLeft size={16} />
          </Link>
          <div>
            {isEditingTitle ? (
              <form onSubmit={handleUpdateTitle} className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-semibold text-slate-900"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={updatingTitle || !editingTitle.trim()}
                  className="p-1.5 bg-slate-900 hover:bg-primary text-white rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Save Title"
                >
                  {updatingTitle ? <FiLoader className="animate-spin" size={13} /> : <FiCheck size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTitle(false);
                    setEditingTitle(ticket.title);
                  }}
                  className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-lg text-xs transition-colors cursor-pointer"
                  title="Cancel"
                >
                  <FiX size={13} />
                </button>
              </form>
            ) : (
              <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>{ticket.title}</span>
                <span className="text-xs font-mono font-normal text-slate-400">#{ticket.id}</span>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                  title="Edit Ticket Title"
                >
                  <FiEdit2 size={13} />
                </button>
              </h1>
            )}
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Created {new Date(ticket.created_at).toLocaleString()}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live Auto Sync" />
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-14rem)] min-h-[400px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && sharedImagesList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No messages yet. Send a message below.
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isUserMsg = Boolean(msg.user_id);
                const msgAttachments = attachments?.filter(att => att.message_id === msg.id) || [];

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUserMsg ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[85%] sm:max-w-[75%]`}
                  >
                    <div className="text-[11px] font-semibold text-slate-500 mb-0.5 px-1">
                      {isUserMsg ? 'You' : (msg.staff_name || 'Support Staff')}
                    </div>

                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed space-y-2 ${
                        isUserMsg
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>

                      {msgAttachments.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {msgAttachments.map((att) => (
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
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-2">
          {attachedImages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {attachedImages.map((img, idx) => (
                <div key={idx} className="relative shrink-0 w-12 h-12 rounded-md overflow-hidden border border-slate-200">
                  <img src={img.file_url} alt="Attachment" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAttachedImage(idx)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px]"
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
              className="p-2 border border-slate-200 hover:bg-white text-slate-500 rounded-lg text-xs transition-colors"
              title="Attach Image"
            >
              {uploadingImage ? <FiLoader className="animate-spin text-primary" size={16} /> : <FiPaperclip size={16} />}
            </button>

            <input
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
            />

            <button
              type="submit"
              disabled={(!messageText.trim() && attachedImages.length === 0) || uploadingImage || sendingMsg}
              className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {sendingMsg ? <FiLoader className="animate-spin" size={14} /> : <FiSend size={14} />}
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Lightbox Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
