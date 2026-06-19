'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Plus, ChevronRight, MessageSquare, Clock, CheckCircle2,
  AlertTriangle, Loader2, X, Send, Tag, Zap, Info, CreditCard,
  CircleDot, ArrowLeft, RefreshCw
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TicketReply {
  id: number;
  user: { id: number; name: string; email: string };
  message: string;
  is_admin_reply: boolean;
  created_at: string;
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

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    if (!shop) return;
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
  };

  useEffect(() => { 
    const t = setTimeout(() => fetchTickets(), 0);
    return () => clearTimeout(t);
  }, [shop]);

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

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    if (!form.subject.trim() || !form.message.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await api.post(`/shops/${shop.id}/tickets`, form);
      setForm({ subject: '', message: '', type: 'general', priority: 'medium' });
      await fetchTickets();
      setView('list');
    } catch (e: unknown) {
      setFormError('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!shop || !selected || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await api.post(`/shops/${shop.id}/tickets/${selected.id}/reply`, { message: replyText });
      setSelected(prev => prev ? { ...prev, replies: [...prev.replies, res.data.data], status: prev.status === 'resolved' || prev.status === 'closed' ? 'open' : prev.status } : prev);
      setReplyText('');
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
                <p className="text-xs text-[#A8A19A] text-right">{user?.name} · {formatDate(selected.created_at)}</p>
                <div className="bg-taupe text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
                  {selected.message}
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
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isMe
                        ? 'bg-taupe text-white rounded-tr-sm'
                        : 'bg-[#F0EAE3] text-[#2D2A26] rounded-tl-sm border border-[#EBE6E0]'
                    }`}>
                      {reply.message}
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
            <div className="border-t border-[#EBE6E0] p-4">
              <div className="flex gap-3 items-end">
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
                  disabled={sendingReply || !replyText.trim()}
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
