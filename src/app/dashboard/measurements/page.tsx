'use client';

import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import Modal from '@/components/Modal';
import {
  Ruler, Plus, Search, Pencil, Trash2, Loader2,
  ChevronDown, ChevronUp, User, StickyNote, RefreshCw, Copy
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Metrics {
  bust?: string;
  waist?: string;
  hips?: string;
  shoulder?: string;
  sleeve_length?: string;
  back_length?: string;
  inseam?: string;
  thigh?: string;
  neck?: string;
  chest?: string;
  [key: string]: string | undefined;
}

interface MeasurementRecord {
  id: number;
  customer_id: number;
  profile_name: string;
  metrics: Metrics;
  notes: string | null;
  updated_at: string;
  customer: { id: number; name: string; email: string } | null;
}

interface CustomerData { id: number; name: string; }

// ─── Metric fields config ──────────────────────────────────────────────────
const METRIC_FIELDS: { key: string; label: string; group: string }[] = [
  { key: 'bust',          label: 'Bust',           group: 'Upper Body' },
  { key: 'chest',         label: 'Chest',          group: 'Upper Body' },
  { key: 'shoulder',      label: 'Shoulder Width',  group: 'Upper Body' },
  { key: 'neck',          label: 'Neck',            group: 'Upper Body' },
  { key: 'sleeve_length', label: 'Sleeve Length',   group: 'Upper Body' },
  { key: 'back_length',   label: 'Back Length',     group: 'Upper Body' },
  { key: 'waist',         label: 'Waist',           group: 'Lower Body' },
  { key: 'hips',          label: 'Hips',            group: 'Lower Body' },
  { key: 'inseam',        label: 'Inseam',          group: 'Lower Body' },
  { key: 'thigh',         label: 'Thigh',           group: 'Lower Body' },
];

const UPPER = METRIC_FIELDS.filter(f => f.group === 'Upper Body');
const LOWER = METRIC_FIELDS.filter(f => f.group === 'Lower Body');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const emptyMetrics = (): Metrics =>
  Object.fromEntries(METRIC_FIELDS.map(f => [f.key, '']));

const emptyForm = () => ({
  customer_id: '',
  profile_name: '',
  metrics: emptyMetrics(),
  notes: '',
});

function MetricPill({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-[#F0EAE3] text-[#524A44] text-xs px-2.5 py-1 rounded-full font-medium border border-[#EBE6E0]">
      <span className="text-[#A8A19A]">{label}</span>
      <span className="font-semibold text-[#2D2A26]">{value}&Prime;</span>
    </span>
  );
}

function CustomerInitial({ name }: { name: string }) {
  const colors = [
    'bg-[#9A8073] text-white', 'bg-[#7A8B76] text-white',
    'bg-[#6B7FA8] text-white', 'bg-[#A88B6B] text-white',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colors[idx]}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Main Content Component ───────────────────────────────────────────────────
function MeasurementsContent() {
  const { shop, user } = useAuthStore();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [filterCustomer, setFilterCustomer] = useState('');
  const [selectedVersionIds, setSelectedVersionIds] = useState<Record<string, number>>({});

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm());

  // Check query params to auto-open modal for a specific customer
  useEffect(() => {
    const custId = searchParams.get('customer_id');
    if (custId && customers.length > 0) {
      const timer = setTimeout(() => {
        setForm(f => ({ ...f, customer_id: custId }));
        setEditingId(null);
        setError('');
        setIsModalOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, customers]);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!shop) {
      if (!user) return;
      setTimeout(() => setLoading(false), 0);
      return;
    }
    Promise.all([
      api.get(`/shops/${shop.id}/measurements`),
      api.get(`/shops/${shop.id}/customers`),
    ])
      .then(([mRes, cRes]) => {
        setRecords(mRes.data.data);
        setCustomers(cRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [shop, user]);

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setIsSubmitting(true);
    setError('');
    // Strip empty metric keys
    const cleanMetrics: Metrics = {};
    for (const [k, v] of Object.entries(form.metrics)) {
      if (v && v.trim() !== '') cleanMetrics[k] = v.trim();
    }
    const payload = {
      customer_id: form.customer_id,
      profile_name: form.profile_name,
      metrics: cleanMetrics,
      notes: form.notes || null,
    };
    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/measurements/${editingId}`, payload);
        setRecords(prev =>
          prev.map(r => r.id === editingId ? { ...r, ...res.data.data } : r)
        );
      } else {
        const res = await api.post(`/shops/${shop.id}/measurements`, payload);
        setRecords(prev => [res.data.data, ...prev]);
      }
      closeModal();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save measurement profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/measurements/${deletingId}`);
      setRecords(prev => prev.filter(r => r.id !== deletingId));
      setIsDeleteOpen(false);
      setDeletingId(null);
    } catch {
      alert('Failed to delete measurement profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── UI Helpers ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (rec: MeasurementRecord) => {
    setEditingId(rec.id);
    setForm({
      customer_id: rec.customer_id.toString(),
      profile_name: rec.profile_name,
      metrics: { ...emptyMetrics(), ...rec.metrics },
      notes: rec.notes || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openClone = (rec: MeasurementRecord) => {
    setEditingId(null);
    setForm({
      customer_id: rec.customer_id.toString(),
      profile_name: rec.profile_name,
      metrics: { ...emptyMetrics(), ...rec.metrics },
      notes: rec.notes || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setError('');
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setMetric = (key: string, val: string) =>
    setForm(f => ({ ...f, metrics: { ...f.metrics, [key]: val } }));

  // ─── Filtering ──────────────────────────────────────────────────────────────
  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.profile_name.toLowerCase().includes(q) ||
      r.customer?.name.toLowerCase().includes(q);
    const matchCustomer =
      !filterCustomer || r.customer_id.toString() === filterCustomer;
    return matchSearch && matchCustomer;
  });

  // Group by customer
  const grouped = filtered.reduce((acc, r) => {
    const key = r.customer?.name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, MeasurementRecord[]>);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight flex items-center gap-2">
            <Ruler size={22} className="text-[#9A8073]" />
            Measurements
          </h1>
          <p className="text-[#827A73] text-sm mt-1">
            Store and manage reusable customer body measurement profiles linked to job orders.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          New Profile
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={16} />
          <input
            type="text"
            placeholder="Search profiles or customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 w-64 shadow-sm"
          />
        </div>
        <select
          value={filterCustomer}
          onChange={e => setFilterCustomer(e.target.value)}
          className="px-3 py-2 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#524A44] focus:outline-none focus:border-[#9A8073] shadow-sm"
        >
          <option value="">All Customers</option>
          {customers.map(c => (
            <option key={c.id} value={c.id.toString()}>{c.name}</option>
          ))}
        </select>
        <div className="ml-auto text-sm text-[#A8A19A] font-medium">
          {filtered.length} profile{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-[#9A8073] animate-spin" />
          <p className="text-[#A8A19A] text-sm">Loading measurement profiles...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-[#F0EAE3] rounded-full flex items-center justify-center mx-auto mb-4">
            <Ruler size={26} className="text-[#9A8073]" />
          </div>
          <h3 className="text-[#2D2A26] font-semibold mb-1">No measurement profiles yet</h3>
          <p className="text-[#A8A19A] text-sm mb-5">
            Create reusable measurement profiles for your customers to speed up job order creation.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-[#9A8073] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#9A8073]/90 transition-colors"
          >
            <Plus size={16} /> Create First Profile
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([customerName, recs]) => {
            const firstRec = recs[0];
            return (
              <div key={customerName} className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden">
                {/* Customer Header */}
                <div className="bg-[#FAF6F3]/50 px-5 py-4 border-b border-[#EBE6E0] flex items-center gap-3">
                  <CustomerInitial name={customerName} />
                  <div>
                    <h3 className="font-bold text-[#2D2A26] text-sm">{customerName}</h3>
                    {firstRec.customer?.email && (
                      <p className="text-xs text-[#827A73]">{firstRec.customer.email}</p>
                    )}
                  </div>
                </div>

                {/* Profiles */}
                <div className="divide-y divide-[#EBE6E0]">
                  {Object.entries(
                    recs.reduce((acc, r) => {
                      const key = r.profile_name.trim();
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(r);
                      return acc;
                    }, {} as Record<string, MeasurementRecord[]>)
                  ).map(([profileName, versions]) => {
                    // Sort versions by ID ascending
                    versions.sort((a, b) => a.id - b.id);
                    
                    const rKey = `c_${firstRec.customer_id}_p_${profileName}`;
                    const selectedId = selectedVersionIds[rKey];
                    const activeRec = versions.find(v => v.id === selectedId) || versions[versions.length - 1];
                    const activeIndex = versions.indexOf(activeRec);
                    
                    const isExpanded = expandedIds.has(activeRec.id);
                    const filledCount = Object.values(activeRec.metrics || {}).filter(Boolean).length;
                    
                    return (
                      <div key={profileName}>
                        {/* Profile Row */}
                        <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAF6F3]/70 transition-colors">
                          <button
                            onClick={() => toggleExpand(activeRec.id)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-[#2D2A26] text-sm">{profileName}</p>
                                <span className="text-[10px] bg-[#9A8073]/10 text-[#9A8073] border border-[#9A8073]/20 px-2 py-0.5 rounded-full font-medium">
                                  {filledCount} field{filledCount !== 1 ? 's' : ''}
                                </span>
                                <span className="text-[10px] text-[#A8A19A]">
                                  Version {activeIndex + 1} of {versions.length}
                                </span>
                                {versions.length > 1 && (
                                  <select
                                    value={activeRec.id}
                                    onChange={(e) => {
                                      const newVerId = Number(e.target.value);
                                      setSelectedVersionIds(prev => ({ ...prev, [rKey]: newVerId }));
                                      if (expandedIds.has(activeRec.id)) {
                                        setExpandedIds(prev => {
                                          const next = new Set(prev);
                                          next.delete(activeRec.id);
                                          next.add(newVerId);
                                          return next;
                                        });
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] bg-[#FAF6F3] border border-[#EBE6E0] rounded px-1.5 py-0.5 text-[#524A44] font-semibold focus:outline-none cursor-pointer"
                                  >
                                    {versions.map((v, idx) => (
                                      <option key={v.id} value={v.id}>
                                        Ver {idx + 1}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                              <p className="text-xs text-[#A8A19A] mt-0.5 flex items-center gap-1">
                                <RefreshCw size={10} />
                                Updated {new Date(activeRec.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {activeRec.notes && (
                                  <span className="flex items-center gap-1 ml-2">
                                    <StickyNote size={10} /> Notes
                                  </span>
                                )}
                              </p>
                            </div>
                            {isExpanded ? <ChevronUp size={16} className="text-[#A8A19A] shrink-0" /> : <ChevronDown size={16} className="text-[#A8A19A] shrink-0" />}
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openClone(activeRec)}
                              className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#F0EAE3] rounded-lg transition-colors"
                              title="Create new version"
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              onClick={() => openEdit(activeRec)}
                              className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#F0EAE3] rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => { setDeletingId(activeRec.id); setIsDeleteOpen(true); }}
                              className="p-1.5 text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Metrics */}
                        {isExpanded && (
                          <div className="px-5 pb-4 pt-1 bg-[#FAF6F3]/40 border-t border-[#EBE6E0]/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              {/* Upper Body */}
                              <div>
                                <p className="text-[10px] font-semibold text-[#A8A19A] uppercase tracking-wider mb-2">Upper Body</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {UPPER.map(f => (
                                    <MetricPill key={f.key} label={f.label} value={activeRec.metrics?.[f.key]} />
                                  ))}
                                  {!UPPER.some(f => activeRec.metrics?.[f.key]) && (
                                    <p className="text-xs text-[#A8A19A] italic">No upper body measurements recorded.</p>
                                  )}
                                </div>
                              </div>
                              {/* Lower Body */}
                              <div>
                                <p className="text-[10px] font-semibold text-[#A8A19A] uppercase tracking-wider mb-2">Lower Body</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {LOWER.map(f => (
                                    <MetricPill key={f.key} label={f.label} value={activeRec.metrics?.[f.key]} />
                                  ))}
                                  {!LOWER.some(f => activeRec.metrics?.[f.key]) && (
                                    <p className="text-xs text-[#A8A19A] italic">No lower body measurements recorded.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            {activeRec.notes && (
                              <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                <p className="text-xs text-amber-700 flex items-start gap-2">
                                  <StickyNote size={12} className="shrink-0 mt-0.5" />
                                  {activeRec.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add/Edit Modal ───────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Measurement Profile' : 'New Measurement Profile'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-[#B26959]/10 border border-[#B26959]/30 text-[#B26959] px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1.5">
              Customer <span className="text-[#B26959]">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" />
              <select
                required
                value={form.customer_id}
                onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                className="w-full pl-9 pr-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 appearance-none"
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Profile Name */}
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1.5">
              Profile Name <span className="text-[#B26959]">*</span>
              <span className="text-[#A8A19A] font-normal ml-1">(e.g. &quot;Formal Suit&quot;, &quot;School Uniform&quot;)</span>
            </label>
            <input
              required
              type="text"
              value={form.profile_name}
              onChange={e => setForm(f => ({ ...f, profile_name: e.target.value }))}
              placeholder="e.g. Wedding Barong"
              className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30"
            />
          </div>

          {/* Measurement Fields */}
          <div>
            <p className="text-sm font-medium text-[#524A44] mb-3 flex items-center gap-2">
              <Ruler size={14} className="text-[#9A8073]" />
              Body Measurements
              <span className="text-[#A8A19A] font-normal text-xs">— all in inches (″), leave blank if not applicable</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upper Body */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider">Upper Body</p>
                {UPPER.map(f => (
                  <div key={f.key} className="flex items-center gap-2">
                    <label className="text-xs text-[#524A44] w-28 shrink-0">{f.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.metrics[f.key] || ''}
                      onChange={e => setMetric(f.key, e.target.value)}
                      placeholder="—"
                      className="flex-1 px-3 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 text-right font-mono"
                    />
                    <span className="text-xs text-[#A8A19A] w-4">″</span>
                  </div>
                ))}
              </div>

              {/* Lower Body */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider">Lower Body</p>
                {LOWER.map(f => (
                  <div key={f.key} className="flex items-center gap-2">
                    <label className="text-xs text-[#524A44] w-28 shrink-0">{f.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.metrics[f.key] || ''}
                      onChange={e => setMetric(f.key, e.target.value)}
                      placeholder="—"
                      className="flex-1 px-3 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 text-right font-mono"
                    />
                    <span className="text-xs text-[#A8A19A] w-4">″</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1.5">
              Notes <span className="text-[#A8A19A] font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Client prefers loose fit, allergic to polyester..."
              className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-1 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors hover:bg-[#F0EAE3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Measurement Profile">
        <div className="space-y-4">
          <p className="text-sm text-[#524A44]">
            Are you sure you want to delete this measurement profile? This action cannot be undone.
            Existing job orders that reference this profile will not be affected.
          </p>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function MeasurementsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading measurements...</div>}>
      <MeasurementsContent />
    </Suspense>
  );
}
