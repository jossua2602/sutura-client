'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Plus, ChevronRight, MessageSquare, Clock, CheckCircle2,
  AlertTriangle, Loader2, X, Send, Zap, Info, CreditCard,
  CircleDot, ArrowLeft, RefreshCw, Paperclip, ImageIcon, FileVideo, Trash2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TicketReply {
  id: number;
  user: { id: number; name: string; email: string };
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  attachments?: string[];
}

interface Ticket {
  id: number;
  subject: string;
  message: string;
  type: 'problem' | 'update_request' | 'general' | 'billing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  resolved_at: string | null;
  replies: TicketReply[];
  submitted_by: { name: string; email: string };
  attachments?: string[];
}

// ─── Config maps ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  problem:        { label: 'Problem / Bug',     icon: <AlertTriangle size={14} />, color: 'text-red-500 bg-red-50 border-red-200' },
  update_request: { label: 'Update Request',    icon: <RefreshCw size={14} />,     color: 'text-blue-500 bg-blue-50 border-blue-200' },
  general:        { label: 'General Inquiry',   icon: <Info size={14} />,          color: 'text-[#827A73] bg-[#F0EAE3] border-[#EBE6E0]' },
  billing:        { label: 'Billing Issue',     icon: <CreditCard size={14} />,    color: 'text-violet-500 bg-violet-50 border-violet-200' },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low:    { label: 'Low',    color: 'text-[#7A8B76] bg-[#7A8B76]/10 border-[#7A8B76]/20' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  high:   { label: 'High',   color: 'text-orange-500 bg-orange-50 border-orange-200' },
  urgent: { label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-200' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  open:        { label: 'Open',        icon: <CircleDot size={14} />,    color: 'text-blue-600 bg-blue-50 border-blue-200' },
  in_progress: { label: 'In Progress', icon: <Loader2 size={14} />,      color: 'text-amber-600 bg-amber-50 border-amber-200' },
  resolved:    { label: 'Resolved',    icon: <CheckCircle2 size={14} />, color: 'text-[#7A8B76] bg-[#7A8B76]/10 border-[#7A8B76]/20' },
  closed:      { label: 'Closed',      icon: <X size={14} />,            color: 'text-[#A8A19A] bg-[#F0EAE3] border-[#EBE6E0]' },
};

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

interface UploadItem {
  id: string;
  file: File;
  name: string;
  progress: number;
  status: 'uploading' | 'success' | 'failed';
  url: string;
}

const isImage = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
};

const isVideo = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'avi', 'webm'].includes(ext || '');
};

const renderAttachments = (urls?: string[], isMe?: boolean) => {
  if (!urls || urls.length === 0) return null;
  return (
    <div className={`mt-2 gap-2 ${urls.length === 1 ? 'max-w-sm block' : 'grid grid-cols-2 max-w-md'}`}>
      {urls.map((url, i) => {
        const img = isImage(url);
        const vid = isVideo(url);
        return (
          <div key={i} className={`relative rounded-lg overflow-hidden border ${isMe ? 'border-white/20 bg-black/10' : 'border-[#EBE6E0] bg-black/5'} aspect-video flex items-center justify-center`}>
            {img ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={url}
                alt="Attachment"
                className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform"
                onClick={() => window.open(url, '_blank')}
              />
            ) : vid ? (
              <video src={url} controls className="w-full h-full object-contain bg-black" />
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center p-4 text-xs font-medium transition-colors ${
                  isMe ? 'text-white/90 hover:text-white' : 'text-[#827A73] hover:text-[#2D2A26]'
                }`}
              >
                <Paperclip size={16} className="mr-1.5 shrink-0" />
                <span className="truncate max-w-[150px]">View Attachment</span>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SupportPage() {
  const { shop, user } = useAuthStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');

  // New ticket form
  const [form, setForm] = useState({ subject: '', message: '', type: 'general', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Reply
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [closing, setClosing] = useState(false);

  // Attachments state
  const [newTicketUploads, setNewTicketUploads] = useState<UploadItem[]>([]);
  const [replyUploads, setReplyUploads] = useState<UploadItem[]>([]);

  const newTicketFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    if (!shop) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/shops/${shop.id}/tickets`);
      const sorted = (res.data.data as Ticket[]).sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      );
      setTickets(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [shop]);

  useEffect(() => { 
    const t = setTimeout(() => fetchTickets(), 0);
    return () => clearTimeout(t);
  }, [fetchTickets, user]);

  // Scroll to bottom of chat when detail view opens or replies update
  useEffect(() => {
    if (view === 'detail') {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [view, selected?.replies?.length]);

  const openDetail = async (ticket: Ticket) => {
    if (!shop) return;
    try {
      const res = await api.get(`/shops/${shop.id}/tickets/${ticket.id}`);
      setSelected(res.data.data);
    } catch {
      setSelected(ticket);
    }
    setView('detail');
  };

  const handleUpload = async (files: File[], isReply: boolean) => {
    if (!shop) return;
    const setUploads = isReply ? setReplyUploads : setNewTicketUploads;
    const maxSize = 50 * 1024 * 1024; // 50MB

    // Validate size
    for (const file of files) {
      if (file.size > maxSize) {
        const errMsg = `File ${file.name} exceeds the 50MB limit.`;
        if (isReply) {
          alert(errMsg);
        } else {
          setFormError(errMsg);
        }
        return;
      }
    }

    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      progress: 0,
      status: 'uploading' as const,
      url: '',
    }));

    setUploads(prev => [...prev, ...newItems]);

    for (const item of newItems) {
      const formData = new FormData();
      formData.append('file', item.file);

      try {
        const res = await api.post(`/shops/${shop.id}/support/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress: percent } : u));
          }
        });

        if (res.data.success) {
          setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'success', url: res.data.data.url } : u));
        } else {
          setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'failed' } : u));
        }
      } catch (err) {
        console.error('Upload failed:', err);
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'failed' } : u));
      }
    }
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    if (!form.subject.trim() || !form.message.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    const attachmentUrls = newTicketUploads
      .filter(u => u.status === 'success')
      .map(u => u.url);

    setSubmitting(true);
    setFormError('');
    try {
      await api.post(`/shops/${shop.id}/tickets`, {
        ...form,
        attachments: attachmentUrls
      });
      setForm({ subject: '', message: '', type: 'general', priority: 'medium' });
      setNewTicketUploads([]);
      await fetchTickets();
      setView('list');
    } catch {
      setFormError('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    const successUploads = replyUploads.filter(u => u.status === 'success');
    if (!shop || !selected || (!replyText.trim() && successUploads.length === 0)) return;
    setSendingReply(true);
    const attachmentUrls = successUploads.map(u => u.url);
    try {
      const res = await api.post(`/shops/${shop.id}/tickets/${selected.id}/reply`, {
        message: replyText,
        attachments: attachmentUrls
      });
      setSelected(prev => prev ? { ...prev, replies: [...prev.replies, res.data.data], status: prev.status === 'resolved' || prev.status === 'closed' ? 'open' : prev.status } : prev);
      setReplyText('');
      setReplyUploads([]);
      // update list too
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: selected.status } : t));
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  const closeTicket = async () => {
    if (!shop || !selected) return;
    setClosing(true);
    try {
      await api.post(`/shops/${shop.id}/tickets/${selected.id}/close`);
      setSelected(prev => prev ? { ...prev, status: 'closed' } : prev);
      setTickets(prev => prev.map(t => t.id === selected?.id ? { ...t, status: 'closed' } : t));
    } catch (e) {
      console.error(e);
    } finally {
      setClosing(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  // ─── Render: New Ticket Form ────────────────────────────────────────────────
  if (view === 'new') {
    return (
      <div className="space-y-6 pb-12 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="p-2 rounded-lg hover:bg-[#F0EAE3] text-[#827A73] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">New Support Ticket</h1>
            <p className="text-[#827A73] text-sm mt-0.5">Describe your issue or request and our team will respond shortly.</p>
          </div>
        </div>

        <form onSubmit={submitTicket} className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm p-6 space-y-5">
          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Ticket Type <span className="text-red-500">*</span></label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full border border-[#EBE6E0] rounded-lg px-3 py-2.5 text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40"
              >
                <option value="problem">🔴 Problem / Bug</option>
                <option value="update_request">🔵 Update Request</option>
                <option value="general">⚪ General Inquiry</option>
                <option value="billing">🟣 Billing Issue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Priority <span className="text-red-500">*</span></label>
              <select
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full border border-[#EBE6E0] rounded-lg px-3 py-2.5 text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Subject <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Brief summary of your issue..."
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              className="w-full border border-[#EBE6E0] rounded-lg px-3 py-2.5 text-sm text-[#2D2A26] placeholder:text-[#A8A19A] bg-white focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Message <span className="text-red-500">*</span></label>
            <textarea
              rows={6}
              placeholder="Describe the problem, what you expected, and what actually happened..."
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="w-full border border-[#EBE6E0] rounded-lg px-3 py-2.5 text-sm text-[#2D2A26] placeholder:text-[#A8A19A] bg-white focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40 resize-none"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Attachments (Images/Videos up to 50MB)</label>
            <div 
              onClick={() => newTicketFileInputRef.current?.click()}
              className="border border-dashed border-[#EBE6E0] hover:border-taupe/40 bg-[#FAF6F3] rounded-xl p-4 text-center cursor-pointer hover:bg-[#FAF6F3]/50 transition-all"
            >
              <input
                type="file"
                ref={newTicketFileInputRef}
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files) {
                    handleUpload(Array.from(e.target.files), false);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-1.5">
                <Paperclip size={20} className="text-[#827A73]" />
                <span className="text-sm font-medium text-[#524A44]">Click to select images or video</span>
                <span className="text-xs text-[#A8A19A]">Maximum file size: 50MB</span>
              </div>
            </div>

            {newTicketUploads.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {newTicketUploads.map(upload => (
                  <div key={upload.id} className="flex items-center justify-between p-3 border border-[#EBE6E0] rounded-xl bg-white text-sm shadow-sm">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {upload.file.type.startsWith('image/') ? (
                        <ImageIcon size={18} className="text-taupe shrink-0" />
                      ) : (
                        <FileVideo size={18} className="text-taupe shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#2D2A26] truncate">{upload.name}</p>
                        {upload.status === 'uploading' && (
                          <div className="w-full bg-[#EBE6E0] h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-taupe h-full transition-all duration-300" style={{ width: `${upload.progress}%` }} />
                          </div>
                        )}
                        {upload.status === 'success' && <p className="text-xs text-[#7A8B76] mt-0.5 font-medium">Uploaded successfully</p>}
                        {upload.status === 'failed' && <p className="text-xs text-red-500 mt-0.5 font-medium">Upload failed</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewTicketUploads(prev => prev.filter(u => u.id !== upload.id));
                      }}
                      className="p-1.5 rounded-lg text-[#827A73] hover:text-red-500 hover:bg-red-50 transition-colors ml-2 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && (
            <p className="text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle size={14} /> {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EBE6E0]">
            <button type="button" onClick={() => setView('list')} className="px-4 py-2 text-sm text-[#827A73] hover:text-[#2D2A26] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── Render: Ticket Detail (Chat View) ──────────────────────────────────────
  if (view === 'detail' && selected) {
    const typeConfig = TYPE_LABELS[selected.type];
    const priorityConfig = PRIORITY_LABELS[selected.priority];
    const statusConfig = STATUS_CONFIG[selected.status];
    const isClosed = selected.status === 'closed' || selected.status === 'resolved';

    return (
      <div className="space-y-4 pb-12 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={() => { setView('list'); setSelected(null); }} className="p-2 rounded-lg hover:bg-[#F0EAE3] text-[#827A73] transition-colors mt-1">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-[#2D2A26] tracking-tight">{selected.subject}</h1>
                <p className="text-[#A8A19A] text-xs mt-0.5">Ticket #{selected.id} · Opened {formatDate(selected.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Status badge */}
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                  {statusConfig.icon} {statusConfig.label}
                </span>
                {/* Close button */}
                {!isClosed && (
                  <button
                    onClick={closeTicket}
                    disabled={closing}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border text-[#827A73] bg-white border-[#EBE6E0] hover:border-[#B26959] hover:text-[#B26959] transition-colors disabled:opacity-50"
                  >
                    {closing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    Close Ticket
                  </button>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mt-2">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${typeConfig.color}`}>
                {typeConfig.icon} {typeConfig.label}
              </span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${priorityConfig.color}`}>
                <Zap size={11} /> {priorityConfig.label} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
            {/* Original message bubble */}
            <div className="flex gap-3 justify-end">
              <div className="max-w-[80%] space-y-1">
                <p className="text-xs text-[#A8A19A] text-right">{selected.submitted_by?.name || user?.name} · {formatDate(selected.created_at)}</p>
                <div className="bg-taupe text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed flex flex-col">
                  <span>{selected.message}</span>
                  {renderAttachments(selected.attachments, true)}
                </div>
              </div>
            </div>

            {/* Replies */}
            {selected.replies.map(reply => {
              const isMe = !reply.is_admin_reply;
              return (
                <div key={reply.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-[#2D2A26] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      A
                    </div>
                  )}
                  <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <p className={`text-xs text-[#A8A19A] ${isMe ? 'text-right' : 'text-left'}`}>
                      {reply.is_admin_reply ? 'SUTURA Admin' : reply.user?.name} · {formatDate(reply.created_at)}
                    </p>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed flex flex-col ${
                      isMe
                        ? 'bg-taupe text-white rounded-tr-sm'
                        : 'bg-[#F0EAE3] text-[#2D2A26] rounded-tl-sm border border-[#EBE6E0]'
                    }`}>
                      <span>{reply.message}</span>
                      {renderAttachments(reply.attachments, isMe)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Resolved banner */}
            {selected.status === 'resolved' && (
              <div className="flex items-center gap-2 justify-center py-2 text-xs text-[#7A8B76] font-medium">
                <CheckCircle2 size={14} /> Ticket resolved {selected.resolved_at ? `on ${formatDate(selected.resolved_at)}` : ''}
              </div>
            )}
            {selected.status === 'closed' && (
              <div className="flex items-center gap-2 justify-center py-2 text-xs text-[#A8A19A] font-medium">
                <X size={14} /> Ticket closed
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Reply Box */}
          {!isClosed ? (
            <div className="border-t border-[#EBE6E0] p-4 space-y-3">
              {/* Show selected files for reply */}
              {replyUploads.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {replyUploads.map(upload => (
                    <div key={upload.id} className="relative flex items-center gap-2 px-3 py-1.5 border border-[#EBE6E0] rounded-lg bg-[#FAF6F3] text-xs max-w-[200px]">
                      {upload.file.type.startsWith('image/') ? (
                        <ImageIcon size={14} className="text-taupe shrink-0" />
                      ) : (
                        <FileVideo size={14} className="text-taupe shrink-0" />
                      )}
                      <span className="truncate flex-1 font-medium text-[#2D2A26]">{upload.name}</span>
                      
                      {upload.status === 'uploading' && (
                        <span className="text-[10px] text-taupe font-semibold">{upload.progress}%</span>
                      )}
                      {upload.status === 'failed' && (
                        <span className="text-[10px] text-red-500 font-semibold">!</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setReplyUploads(prev => prev.filter(u => u.id !== upload.id))}
                        className="p-0.5 rounded-full hover:bg-[#EBE6E0] text-[#827A73] transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 items-end">
                <input
                  type="file"
                  ref={replyFileInputRef}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files) {
                      handleUpload(Array.from(e.target.files), true);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => replyFileInputRef.current?.click()}
                  className="p-3 border border-[#EBE6E0] hover:bg-[#F0EAE3] text-[#827A73] hover:text-[#2D2A26] rounded-xl transition-colors shrink-0 bg-white"
                  title="Attach images/video"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Add a reply or update... (Enter to send, Shift+Enter for new line)"
                  className="flex-1 border border-[#EBE6E0] rounded-xl px-3 py-2.5 text-sm text-[#2D2A26] placeholder:text-[#A8A19A] bg-[#FAF6F3] focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40 resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sendingReply || (!replyText.trim() && replyUploads.filter(u => u.status === 'success').length === 0)}
                  className="p-3 bg-taupe hover:bg-taupe/90 text-white rounded-xl transition-colors disabled:opacity-40 shrink-0"
                >
                  {sendingReply ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-[#EBE6E0] p-4 text-center">
              <p className="text-sm text-[#A8A19A]">This ticket is {selected.status}. <button onClick={() => setView('new')} className="text-taupe hover:underline font-medium">Open a new ticket</button> if you need further help.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Ticket List ────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Support Tickets</h1>
          <p className="text-[#827A73] text-sm mt-1">
            Submit issues, update requests, or questions to the SUTURA admin team.
            {openCount > 0 && <span className="ml-2 text-amber-600 font-medium">{openCount} active ticket{openCount > 1 ? 's' : ''}</span>}
          </p>
        </div>
        <button
          onClick={() => setView('new')}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus size={18} /> New Ticket
        </button>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="py-16 text-center text-[#A8A19A] animate-pulse flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin" />
          Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm p-12 text-center">
          <MessageSquare className="w-12 h-12 text-[#827A73] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2D2A26] mb-2">No support tickets yet</h3>
          <p className="text-[#827A73] text-sm mb-6 max-w-sm mx-auto">
            Experiencing an issue or have a request? Submit a ticket and our team will get back to you.
          </p>
          <button
            onClick={() => setView('new')}
            className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus size={16} /> Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden">
          {tickets.map((ticket, idx) => {
            const typeConfig = TYPE_LABELS[ticket.type];
            const priorityConfig = PRIORITY_LABELS[ticket.priority];
            const statusConfig = STATUS_CONFIG[ticket.status];
            return (
              <div
                key={ticket.id}
                onClick={() => openDetail(ticket)}
                className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#FAF6F3] transition-colors group ${idx !== tickets.length - 1 ? 'border-b border-[#EBE6E0]' : ''}`}
              >
                {/* Priority dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  ticket.priority === 'urgent' ? 'bg-red-500' :
                  ticket.priority === 'high'   ? 'bg-orange-400' :
                  ticket.priority === 'medium' ? 'bg-amber-400' : 'bg-[#7A8B76]'
                }`} />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#2D2A26] text-sm truncate">{ticket.subject}</span>
                    {(ticket.replies?.length ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[#A8A19A] shrink-0">
                        <MessageSquare size={12} /> {ticket.replies.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${typeConfig.color}`}>
                      {typeConfig.icon} {typeConfig.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </span>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                    <p className="text-xs text-[#A8A19A] mt-1 flex items-center gap-1 justify-end">
                      <Clock size={10} /> {formatDate(ticket.created_at)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-[#A8A19A] group-hover:text-[#524A44] transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
