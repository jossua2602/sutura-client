'use client';

import { Loader2, Save, Store, Clock, FileText, Image, Scissors, Plus, Search } from 'lucide-react';
import SettingsBusinessType from '@/components/settings/SettingsBusinessType';
import SettingsBasicInfo from '@/components/settings/SettingsBasicInfo';
import SettingsOperatingHours from '@/components/settings/SettingsOperatingHours';
import SettingsRentalPolicies from '@/components/settings/SettingsRentalPolicies';
import SettingsGalleryAndCouriers from '@/components/settings/SettingsGalleryAndCouriers';
import { SettingsSkeleton } from '@/components/ui/Skeleton';
import SpecializationFormModal from '@/components/specializations/SpecializationFormModal';
import SpecializationDeleteModal from '@/components/specializations/SpecializationDeleteModal';
import SpecializationListView from '@/components/specializations/SpecializationListView';
import { useSettings, SettingsTab } from '@/components/settings/useSettings';
import { BLANK_FORM } from '@/components/specializations/specializationHelpers';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'identity',        label: 'Store Identity',   icon: Store },
  { id: 'hours',           label: 'Hours & Location', icon: Clock },
  { id: 'policies',        label: 'Policies',         icon: FileText },
  { id: 'gallery',         label: 'Gallery & Social', icon: Image },
  { id: 'specializations', label: 'Specializations',  icon: Scissors },
];

export default function SettingsPage() {
  const {
    loading,
    saving,
    isDirty,
    activeTab,
    setActiveTab,
    specializations,
    specSearch,
    setSpecSearch,
    specModalOpen,
    setSpecModalOpen,
    specDeleteModalOpen,
    setSpecDeleteModalOpen,
    editingSpecId,
    setEditingSpecId,
    setDeletingSpecId,
    specSubmitting,
    specError,
    specFormData,
    setSpecFormData,
    formData,
    setFormDataWithDirty,
    handleChange,
    handleBusinessTypeChange,
    handleSocialChange,
    handleHoursChange,
    handleImageUpload,
    handleRemoveImage,
    handleSave,
    handleDiscard,
    closeSpecModal,
    confirmSpecDelete,
    handleSpecSubmit,
  } = useSettings();

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Shop Settings</h1>
        <p className="text-[#827A73] text-sm mt-1">
          Manage your shop&apos;s identity, business type, and public profile.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 flex-wrap bg-[#F0EAE3] p-1 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isHidden = tab.id === 'policies' &&
            formData.business_type !== 'fashion_designer' &&
            formData.business_type !== 'hybrid';
          if (isHidden) return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-[#2D2A26] shadow-sm'
                  : 'text-[#827A73] hover:text-[#524A44]'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Store Identity */}
      {activeTab === 'identity' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <SettingsBusinessType businessType={formData.business_type} onChange={handleBusinessTypeChange} />
          <SettingsBasicInfo formData={formData} onChange={handleChange} />
        </div>
      )}

      {/* Tab: Hours & Location */}
      {activeTab === 'hours' && (
        <div className="animate-in fade-in duration-200">
          <SettingsOperatingHours operatingHours={formData.operating_hours} onHoursChange={handleHoursChange} />
        </div>
      )}

      {/* Tab: Policies (fashion_designer / hybrid only) */}
      {activeTab === 'policies' && (
        <div className="animate-in fade-in duration-200">
          <SettingsRentalPolicies formData={formData} setFormData={setFormDataWithDirty} />
        </div>
      )}

      {/* Tab: Gallery & Social */}
      {activeTab === 'gallery' && (
        <div className="animate-in fade-in duration-200">
          <SettingsGalleryAndCouriers
            formData={formData}
            setFormData={setFormDataWithDirty}
            handleSocialChange={handleSocialChange}
            handleImageUpload={handleImageUpload}
            handleRemoveImage={handleRemoveImage}
            handleSave={handleSave}
            saving={saving}
            successMsg=""
          />
        </div>
      )}

      {/* Tab: Specializations */}
      {activeTab === 'specializations' && (
        <div className="animate-in fade-in duration-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#2D2A26]">Apparel Specializations</h2>
              <p className="text-sm text-[#827A73] mt-0.5">Declare what garment types your shop specializes in — customers filter shops by these.</p>
            </div>
            <button
              onClick={() => { setEditingSpecId(null); setSpecFormData({ ...BLANK_FORM }); setSpecModalOpen(true); }}
              className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <Plus size={16} /> Add Specialization
            </button>
          </div>

          <div className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#EBE6E0]">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={16} />
                <input
                  type="text"
                  placeholder="Search specializations..."
                  value={specSearch}
                  onChange={e => setSpecSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe w-full"
                />
              </div>
            </div>
            <SpecializationListView
              specializations={specializations.filter(
                s => s.name.toLowerCase().includes(specSearch.toLowerCase()) ||
                     (s.category || '').toLowerCase().includes(specSearch.toLowerCase())
              )}
              loading={false}
              onEdit={spec => {
                setEditingSpecId(spec.id);
                setSpecFormData({
                  category: spec.category || '',
                  name: spec.name,
                  description: spec.description || '',
                  is_active: spec.is_active,
                  starting_price: spec.starting_price || 0,
                  production_time_days: spec.production_time_days || 0,
                  min_order_qty: spec.min_order_qty || 1,
                });
                setSpecModalOpen(true);
              }}
              onDelete={id => { setDeletingSpecId(id); setSpecDeleteModalOpen(true); }}
            />
          </div>

          <SpecializationFormModal
            isOpen={specModalOpen}
            onClose={closeSpecModal}
            onSubmit={handleSpecSubmit}
            editingId={editingSpecId}
            isSubmitting={specSubmitting}
            error={specError}
            formData={specFormData}
            setFormData={setSpecFormData}
          />
          <SpecializationDeleteModal
            isOpen={specDeleteModalOpen}
            onClose={() => setSpecDeleteModalOpen(false)}
            onConfirm={confirmSpecDelete}
            isSubmitting={specSubmitting}
          />
        </div>
      )}

      {/* Sticky Save Bar — appears when form is dirty */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="max-w-4xl mx-auto px-6 pb-6 pointer-events-none">
            <div className="pointer-events-auto bg-[#2D2A26] text-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4)] px-6 py-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-sm font-medium">You have unsaved changes</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDiscard}
                  disabled={saving}
                  className="text-sm text-white/60 hover:text-white transition-colors font-medium disabled:opacity-40"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-white text-[#2D2A26] hover:bg-[#FAF6F3] px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
