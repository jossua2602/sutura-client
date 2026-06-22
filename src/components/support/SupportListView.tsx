import React from 'react';
import { MessageSquare, Plus, Loader2, ChevronRight, Clock } from 'lucide-react';
import { Ticket, TYPE_LABELS, PRIORITY_LABELS, STATUS_CONFIG, formatDate } from './supportHelpers';

interface SupportListViewProps {
  tickets: Ticket[];
  loading: boolean;
  openCount: number;
  onCreateTicket: () => void;
  onSelectTicket: (ticket: Ticket) => void;
}

export default function SupportListView({
  tickets,
  loading,
  openCount,
  onCreateTicket,
  onSelectTicket,
}: SupportListViewProps) {
  return (
    <div className="space-y-6 pb-12 text-[#2D2A26]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Support Tickets</h1>
          <p className="text-[#827A73] text-sm mt-1">
            Submit issues, update requests, or questions to the SUTURA admin team.
            {openCount > 0 && <span className="ml-2 text-amber-600 font-medium">{openCount} active ticket{openCount > 1 ? 's' : ''}</span>}
          </p>
        </div>
        <button
          onClick={onCreateTicket}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus size={18} /> New Ticket
        </button>
      </div>

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
            onClick={onCreateTicket}
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
                onClick={() => onSelectTicket(ticket)}
                className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#FAF6F3] transition-colors group ${idx !== tickets.length - 1 ? 'border-b border-[#EBE6E0]' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  ticket.priority === 'urgent' ? 'bg-red-500' :
                  ticket.priority === 'high'   ? 'bg-orange-400' :
                  ticket.priority === 'medium' ? 'bg-amber-400' : 'bg-[#7A8B76]'
                }`} />

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
