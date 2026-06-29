import React, { useState } from 'react';
import { Job } from './jobTypes';
import { CreditCard, Banknote, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';

interface JobFinancialsCardProps {
  readonly job: Job;
  readonly saving: boolean;
  readonly onCharge: (amount: number, method: string, notes: string) => Promise<void>;
}

const METHOD_ICONS: Record<string, React.ReactNode> = {
  cash:          <Banknote size={13} className="text-emerald-600" />,
  gcash:         <Smartphone size={13} className="text-blue-600" />,
  bank_transfer: <CreditCard size={13} className="text-violet-600" />,
};

const METHOD_LABELS: Record<string, string> = {
  cash:          'Cash',
  gcash:         'GCash',
  bank_transfer: 'Bank Transfer',
};

export default function JobFinancialsCard({
  job,
  saving,
  onCharge,
}: JobFinancialsCardProps) {
  const totalAmount       = Number.parseFloat(String(job.total_amount));
  const remainingBalance  = Number.parseFloat(String(job.balance));
  const amountPaid        = totalAmount - remainingBalance;
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes]   = useState('');
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [charging, setCharging] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) return;
    setCharging(true);
    try {
      const noteStr = [reference ? `Ref: ${reference}` : '', notes].filter(Boolean).join(' | ');
      await onCharge(amt, method, noteStr);
      setAmount('');
      setReference('');
      setNotes('');
    } catch {
      // handled by parent
    } finally {
      setCharging(false);
    }
  };

  const paymentStatus = job.payment_status;

  const statusConfig = {
    paid:    { label: 'Fully Paid',   cls: 'bg-[#7A8B76]/10 text-[#7A8B76] border border-[#7A8B76]/20' },
    partial: { label: 'Partial',      cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    unpaid:  { label: 'Unpaid',       cls: 'bg-red-50 text-red-600 border border-red-200' },
    pending: { label: 'Pending',      cls: 'bg-[#BCA89F]/10 text-[#BCA89F] border border-[#BCA89F]/20' },
  }[paymentStatus] ?? { label: paymentStatus, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-medium text-[#2D2A26]">Financials</h2>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${statusConfig.cls}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Financial breakdown */}
      <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-4 mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#A8A19A]">Total Amount</span>
          <span className="font-semibold text-[#2D2A26]">₱{totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#7A8B76]">Deposit Paid</span>
          <span className="font-semibold text-[#7A8B76]">−₱{amountPaid.toFixed(2)}</span>
        </div>
        <div className="border-t border-[#EBE6E0] pt-2 flex justify-between">
          <span className="text-sm font-medium text-[#524A44]">Balance Due</span>
          <span className={`text-lg font-bold ${remainingBalance > 0 ? 'text-[#B26959]' : 'text-[#7A8B76]'}`}>
            ₱{remainingBalance.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Log Payment Form */}
      {remainingBalance > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <p className="text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-2">Log a Payment</p>

          {/* Amount + Method row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] font-medium text-sm">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingBalance}
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-white border border-[#D1C7BD] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-32 px-3 py-2 bg-white border border-[#D1C7BD] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            >
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="bank_transfer">Bank</option>
            </select>
          </div>

          {/* GCash/Bank reference number (shown only for digital methods) */}
          {(method === 'gcash' || method === 'bank_transfer') && (
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder={method === 'gcash' ? 'GCash Reference # (e.g. 9876543210)' : 'Bank Transfer Reference #'}
              className="w-full px-3 py-2 bg-white border border-[#D1C7BD] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            />
          )}

          {/* Optional notes */}
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes (optional)..."
            className="w-full px-3 py-2 bg-white border border-[#D1C7BD] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
          />

          <button
            type="submit"
            disabled={saving || charging || !amount || Number.parseFloat(amount) <= 0}
            className="w-full bg-taupe hover:bg-taupe/90 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {(saving || charging) ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <CreditCard size={15} />
            )}
            Charge Payment
          </button>
        </form>
      ) : (
        <div className="text-center py-4 bg-[#7A8B76]/10 rounded-lg border border-[#7A8B76]/20 text-[#7A8B76] font-medium text-sm flex items-center justify-center gap-2">
          ✓ Fully Paid — No Balance Remaining
        </div>
      )}

      {/* Payment Ledger (collapsible) */}
      {job.payments && job.payments.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#EBE6E0]">
          <button
            type="button"
            onClick={() => setLedgerOpen(p => !p)}
            className="w-full flex items-center justify-between text-sm font-semibold text-[#524A44] hover:text-[#2D2A26] transition-colors"
          >
            <span>Payment History ({job.payments.length})</span>
            {ledgerOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {ledgerOpen && (
            <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
              {job.payments.map(payment => (
                <div key={payment.id} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {METHOD_ICONS[payment.payment_method] ?? <CreditCard size={13} className="text-[#827A73]" />}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#827A73]">
                        {METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#2D2A26]">
                      ₱{Number.parseFloat(String(payment.amount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#A8A19A] space-y-0.5">
                    <p>{new Date(payment.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    {payment.recorded_by && <p>By: {payment.recorded_by.name}</p>}
                    {payment.notes && <p className="text-[#827A73] italic">{payment.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
