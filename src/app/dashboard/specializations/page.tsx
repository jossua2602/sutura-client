'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Search, Plus, Tag, Loader2, Pencil, Trash2,
  Scissors, Trophy, Palette,
  Layers, Swords, Crown, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import Modal from '@/components/Modal';

// ─── Category presets ────────────────────────────────────────────────────────
const CATEGORIES: {
  name: string;
  icon: React.ElementType;
  items: string[];
}[] = [
  {
    name: 'Formal & Cultural Wear',
    icon: Crown,
    items: [
      'Barong Tagalog',
      'Filipiniana / Formal Wear',
      'Wedding Gown',
      'Evening Gown / Ball Gown',
      'Debut Gown',
      'Entourage / Motif Dress',
    ],
  },
  {
    name: 'Cosplay & Costume',
    icon: Swords,
    items: [
      'Heroes / Superhero Costume',
      'Cartoon / Anime Cosplay',
      'Fantasy / RPG Costume',
      'Historical / Period Costume',
      'Halloween Costume',
    ],
  },
  {
    name: 'Jerseys & Uniforms',
    icon: Trophy,
    items: [
      'Basketball Jerseys',
      'Sports Team Jerseys',
      'Cycling Jerseys',
      'Esports / Gaming Jerseys',
      'School / Student Org Uniforms',
      'Company / Corporate Uniforms',
      'Campaign / Org Shirts',
    ],
  },
  {
    name: 'Printing & Sublimation',
    icon: Palette,
    items: [
      'Full Sublimation Printing',
      'Custom T-shirt Printing',
      'Long Sleeve Printing',
      'Polo Shirt Printing',
      'Hoodie & Jacket Printing',
    ],
  },
  {
    name: 'Custom Tailoring',
    icon: Scissors,
    items: [
      'Customized Dress / Blouse',
      'Customized Shorts / Pants',
      'Jogging Pants / Shorts',
      'Sportswear / Athletic Wear',
      'Barkada Shirts',
      'Graphic Design / Logo Layout',
    ],
  },
  {
    name: 'Alteration & Repair Services',
    icon: Layers,
    items: [
      'Clothing Alteration',
      'Garment Repair',
      'Resizing / Tailoring Adjustments',
      'Zipper Replacement',
      'Hem & Seam Repair',
      'Embroidery & Patch Work',
    ],
  },
  {
    name: 'Other / Custom',
    icon: Sparkles,
    items: [
      'Custom Specialization',
      'Mixed Garment Work',
      'Special Projects',
    ],
  },
];

// ─── Category icon map (for table display) ───────────────────────────────────
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  'Formal & Cultural Wear':        Crown,
  'Cosplay & Costume':             Swords,
  'Jerseys & Uniforms':            Trophy,
  'Printing & Sublimation':        Palette,
  'Custom Tailoring':              Scissors,
  'Alteration & Repair Services':  Layers,
  'Other / Custom':                Sparkles,
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface Specialization {
  id: number;
  category?: string;
  name: string;
  description: string;
  is_active: boolean;
  starting_price?: number;
  production_time_days?: number;
  min_order_qty?: number;
}

const BLANK_FORM = {
  category: '',
  name: '',
  description: '',
  is_active: true,
  starting_price: 0,
  production_time_days: 0,
  min_order_qty: 1,
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SpecializationsPage() {
  const { shop, user } = useAuthStore();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  // Modal
  const [isModalOpen,       setIsModalOpen]       = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);
  const [isSubmitting,setIsSubmitting]= useState(false);
  const [error,       setError]       = useState('');

  // Form state
  const [formData, setFormData] = useState({ ...BLANK_FORM });

  // Category accordion state inside the modal
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSpecializations = useCallback(() => {
    if (!shop) {
      if (user) setTimeout(() => setLoading(false), 0);
      return;
    }
    api.get(`/shops/${shop.id}/specializations`)
      .then(res => { setSpecializations(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop, user]);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop) return;
    setIsSubmitting(true);
    setError('');
    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/specializations/${editingId}`, formData);
        setSpecializations(prev => prev.map(s => s.id === editingId ? res.data.data : s));
      } else {
        const res = await api.post(`/shops/${shop.id}/specializations`, formData);
        setSpecializations(prev => [res.data.data, ...prev]);
      }
      closeModal();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit / Delete ──────────────────────────────────────────────────────────
  const handleEditClick = (spec: Specialization) => {
    setEditingId(spec.id);
    setFormData({
      category:             spec.category || '',
      name:                 spec.name,
      description:          spec.description || '',
      is_active:            spec.is_active,
      starting_price:       spec.starting_price || 0,
      production_time_days: spec.production_time_days || 0,
      min_order_qty:        spec.min_order_qty || 1,
    });
    setOpenCategory(spec.category || null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => { setDeletingId(id); setIsDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/specializations/${deletingId}`);
      setSpecializations(prev => prev.filter(s => s.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to delete specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ ...BLANK_FORM });
    setOpenCategory(null);
    setError('');
  };

  const filtered = specializations.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handlePresetSelect = (item: string) => {
    setFormData(f => ({ ...f, name: item }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Apparel Specializations</h1>
          <p className="text-[#827A73] text-sm mt-1">
            Declare what garment types your shop specializes in — customers filter shops by these.
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData({ ...BLANK_FORM }); setOpenCategory(null); setError(''); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Specialization
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#EBE6E0]">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
            <input
              type="text"
              placeholder="Search specializations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#524A44]">
            <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
              <tr>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Specialization</th>
                <th className="px-6 py-4 font-medium">Starting Price</th>
                <th className="px-6 py-4 font-medium">Sewing Time</th>
                <th className="px-6 py-4 font-medium">Min Qty</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6E0]">
              {loading && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#A8A19A]">Loading specializations...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#A8A19A]">No specializations declared yet.</td></tr>
              )}
              {!loading && filtered.map(spec => {
                const CatIcon = CATEGORY_ICON_MAP[spec.category || ''] || Tag;
                return (
                  <tr key={spec.id} className="hover:bg-[#F0EAE3]/20 transition-colors">
                    <td className="px-6 py-4">
                      {spec.category ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#524A44] bg-[#F0EAE3] px-2.5 py-1 rounded-full">
                          <CatIcon size={12} className="shrink-0 text-[#9A8073]" />
                          {spec.category}
                        </span>
                      ) : (
                        <span className="text-[#C5BDBA] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F0EAE3] flex items-center justify-center text-[#827A73] shrink-0">
                          <CatIcon size={15} />
                        </div>
                        <span className="font-medium text-[#2D2A26]">{spec.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#2D2A26]">
                      {spec.starting_price && spec.starting_price > 0
                        ? `₱${Number(spec.starting_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-[#827A73]">
                      {spec.production_time_days && spec.production_time_days > 0
                        ? `${spec.production_time_days} days` : '—'}
                    </td>
                    <td className="px-6 py-4 text-[#827A73]">
                      {spec.min_order_qty ? `${spec.min_order_qty} pcs` : '1 pc'}
                    </td>
                    <td className="px-6 py-4">
                      {spec.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/10 text-[#827A73] border-zinc-500/20">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditClick(spec)} className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(spec.id)} className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Specialization' : 'Add Specialization'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* ── STEP 1: Category accordion ─────────────────────────────── */}
          <div>
            <span className="block text-sm font-semibold text-[#524A44] mb-2">
              Category
              <span className="ml-1 font-normal text-[#A8A19A] text-xs">(choose one to see presets)</span>
            </span>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isOpen = openCategory === cat.name;
                const isSelected = formData.category === cat.name;

                return (
                  <div key={cat.name} className={`rounded-xl border transition-all ${isSelected ? 'border-[#9A8073] bg-[#9A8073]/5' : 'border-[#EBE6E0] bg-[#FAF6F3]'}`}>
                    {/* Accordion header */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenCategory(isOpen ? null : cat.name);
                        setFormData(f => ({ ...f, category: cat.name, name: '' }));
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#2D2A26]"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#9A8073] text-white' : 'bg-white border border-[#EBE6E0] text-[#9A8073]'}`}>
                          <Icon size={14} />
                        </div>
                        <span>{cat.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#9A8073] bg-[#9A8073]/10 px-2 py-0.5 rounded-full">Selected</span>
                        )}
                      </div>
                      {isOpen ? <ChevronUp size={15} className="text-[#A8A19A] shrink-0" /> : <ChevronDown size={15} className="text-[#A8A19A] shrink-0" />}
                    </button>

                    {/* Preset items (shown when accordion is open) */}
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#EBE6E0] flex flex-wrap gap-1.5">
                        {cat.items.map(item => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handlePresetSelect(item)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              formData.name === item
                                ? 'bg-[#9A8073] text-white border-[#9A8073]'
                                : 'bg-white text-[#524A44] border-[#EBE6E0] hover:border-[#9A8073]/50 hover:text-[#9A8073]'
                            }`}
                          >
                            <Icon size={10} className="shrink-0" />
                            {item}
                          </button>
                        ))}
                        <p className="w-full text-[10px] text-[#A8A19A] mt-1.5">Or type a custom name below.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── STEP 2: Specialization Name ────────────────────────────── */}
          <div>
            <label htmlFor="spec_name" className="block text-sm font-semibold text-[#524A44] mb-1">
              Specialization Name <span className="text-[#B26959]">*</span>
            </label>
            <input
              id="spec_name"
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Basketball Jerseys, Custom T-shirt Printing"
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
            />
          </div>

          {/* ── Description ────────────────────────────────────────────── */}
          <div>
            <label htmlFor="spec_description" className="block text-sm font-semibold text-[#524A44] mb-1">Description</label>
            <textarea
              id="spec_description"
              value={formData.description}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe your expertise and experience with this apparel type..."
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe h-20 resize-none text-sm"
            />
          </div>

          {/* ── Starting Price + Sewing Time ───────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="starting_price" className="block text-sm font-semibold text-[#524A44] mb-1">Starting Price (₱)</label>
              <input
                id="starting_price"
                type="number"
                min="0"
                value={formData.starting_price}
                onChange={e => setFormData(f => ({ ...f, starting_price: Number.parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 1500"
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
              />
            </div>
            <div>
              <label htmlFor="production_time_days" className="block text-sm font-semibold text-[#524A44] mb-1">Sewing Time (Days)</label>
              <input
                id="production_time_days"
                type="number"
                min="0"
                value={formData.production_time_days}
                onChange={e => setFormData(f => ({ ...f, production_time_days: Number.parseInt(e.target.value, 10) || 0 }))}
                placeholder="e.g. 7"
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
              />
            </div>
          </div>

          {/* ── MOQ ────────────────────────────────────────────────────── */}
          <div>
            <label htmlFor="min_order_qty" className="block text-sm font-semibold text-[#524A44] mb-1">Min Order Qty (MOQ)</label>
            <input
              id="min_order_qty"
              type="number"
              min="1"
              value={formData.min_order_qty}
              onChange={e => setFormData(f => ({ ...f, min_order_qty: Number.parseInt(e.target.value, 10) || 1 }))}
              placeholder="e.g. 1"
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
            />
          </div>

          {/* ── Active toggle ───────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => setFormData(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 text-taupe border-[#EBE6E0] rounded focus:ring-taupe"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-[#524A44]">Active (visible to customers)</label>
          </div>

          {/* ── Actions ────────────────────────────────────────────────── */}
          <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {editingId ? 'Save Changes' : 'Save Specialization'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to remove this specialization? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors">
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
