'use client';

import React, { useState } from 'react';
import api from '@/lib/axios';
import { Plus, X, Copy, Edit2, Trash2, Loader2 } from 'lucide-react';
import { MeasurementProfile, MetricRow } from './customerTypes';
import { COMMON_METRICS } from './customerHelpers';
import MeasurementFormModal from '@/components/measurements/MeasurementFormModal';
import { emptyForm } from '@/components/measurements/measurementHelpers';

interface CustomerMeasurementsTabProps {
  readonly customerId: number;
  readonly customerName: string;
  readonly shopId: number;
  readonly measurements: MeasurementProfile[];
  readonly onReload: () => Promise<void>;
}

export default function CustomerMeasurementsTab({
  customerId,
  customerName,
  shopId,
  measurements,
  onReload,
}: CustomerMeasurementsTabProps) {
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState('');
  const [metricRows, setMetricRows] = useState<MetricRow[]>([
    { key: '', value: '' },
  ]);

  // Body Measurements Modal States
  const [isBodyModalOpen, setIsBodyModalOpen] = useState(false);
  const [editingBodyProfileId, setEditingBodyProfileId] = useState<number | null>(null);
  const [bodyForm, setBodyForm] = useState(emptyForm());
  const [bodyError, setBodyError] = useState('');
  const [isBodySubmitting, setIsBodySubmitting] = useState(false);

  const isBodyMeasurementProfile = (metrics: Record<string, any>) => {
    const standardKeys = ['bust', 'chest', 'shoulder_width', 'neck', 'sleeve_length', 'back_length', 'waist', 'hips', 'inseam', 'thigh'];
    const keys = Object.keys(metrics || {});
    if (keys.length === 0) return false;
    return keys.every(k => standardKeys.includes(k.toLowerCase().replace(/\s+/g, '_')));
  };
  const [savingMeasurement, setSavingMeasurement] = useState(false);
  const [isDeletingMeasurementId, setIsDeletingMeasurementId] = useState<number | null>(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState<Record<string, number>>({});

  const handleStartAddMeasurement = () => {
    setProfileName('');
    setMetricRows([
      { key: '', value: '' },
    ]);
    setEditingProfileId(null);
    setIsAddingProfile(true);
  };

  const handleBodySubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsBodySubmitting(true);
    setBodyError('');

    // Strip empty metrics
    const cleanMetrics: Record<string, string> = {};
    for (const [k, v] of Object.entries(bodyForm.metrics)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        cleanMetrics[k] = String(v).trim();
      }
    }

    const payload = {
      customer_id: customerId,
      profile_name: bodyForm.profile_name,
      metrics: cleanMetrics,
      notes: bodyForm.notes || null,
    };

    try {
      if (editingBodyProfileId) {
        await api.put(`/shops/${shopId}/measurements/${editingBodyProfileId}`, payload);
      } else {
        await api.post(`/shops/${shopId}/measurements`, payload);
      }
      setIsBodyModalOpen(false);
      await onReload();
    } catch (err: any) {
      setBodyError(err.response?.data?.message || 'Failed to save body measurements.');
    } finally {
      setIsBodySubmitting(false);
    }
  };

  const handleStartEditMeasurement = (m: MeasurementProfile) => {
    setProfileName(m.profile_name);
    const rows = Object.entries(m.metrics || {}).map(([key, val]) => ({
      key,
      value: String(val),
    }));
    setMetricRows(rows.length > 0 ? rows : [{ key: '', value: '' }]);
    setEditingProfileId(m.id);
    setIsAddingProfile(true);
  };

  const handleCloneMeasurement = (m: MeasurementProfile) => {
    setProfileName(m.profile_name);
    const rows = Object.entries(m.metrics || {}).map(([key, val]) => ({
      key,
      value: String(val),
    }));
    setMetricRows(rows.length > 0 ? rows : [{ key: '', value: '' }]);
    setEditingProfileId(null);
    setIsAddingProfile(true);
  };

  const handleAddMetricRow = () => {
    setMetricRows([...metricRows, { key: '', value: '' }]);
  };

  const handleRemoveMetricRow = (index: number) => {
    setMetricRows(metricRows.filter((_, i) => i !== index));
  };

  const handleMetricChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...metricRows];
    updated[index][field] = val;
    setMetricRows(updated);
  };

  const handleSaveMeasurement = async () => {
    if (!profileName.trim()) return;

    setSavingMeasurement(true);
    
    // Construct metrics object
    const metricsObj: Record<string, string | number> = {};
    metricRows.forEach(row => {
      if (row.key.trim()) {
        const num = Number.parseFloat(row.value);
        metricsObj[row.key.trim()] = Number.isNaN(num) ? row.value.trim() : num;
      }
    });

    try {
      if (editingProfileId) {
        await api.put(`/shops/${shopId}/measurements/${editingProfileId}`, {
          profile_name: profileName,
          metrics: metricsObj,
        });
      } else {
        await api.post(`/shops/${shopId}/measurements`, {
          customer_id: customerId,
          profile_name: profileName,
          metrics: metricsObj,
        });
      }
      await onReload();
      setIsAddingProfile(false);
    } catch (err) {
      console.error('Failed to save measurements', err);
      alert('Failed to save measurements profile.');
    } finally {
      setSavingMeasurement(false);
    }
  };

  const handleDeleteMeasurement = async (id: number) => {
    if (!confirm('Are you sure you want to delete this measurement profile?')) return;

    setIsDeletingMeasurementId(id);
    try {
      await api.delete(`/shops/${shopId}/measurements/${id}`);
      await onReload();
    } catch (err) {
      console.error('Failed to delete measurements', err);
      alert('Failed to delete measurement profile.');
    } finally {
      setIsDeletingMeasurementId(null);
    }
  };

  // Group by profile_name
  const grouped = Object.entries(
    measurements.reduce((acc, m) => {
      const key = m.profile_name.trim();
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {} as Record<string, MeasurementProfile[]>)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {isAddingProfile ? (
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-[#EBE6E0] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#2D2A26]">
                {editingProfileId ? `Edit ${profileName} Specifications` : 'Add Specifications Profile'}
              </h3>
              <p className="text-xs text-[#827A73] mt-0.5">Specify measurement keys and values (e.g. Waist, Chest).</p>
            </div>
            <button 
              onClick={() => setIsAddingProfile(false)}
              className="p-1.5 rounded-lg border border-[#EBE6E0] text-[#827A73] hover:bg-[#FAF6F3] cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="max-w-md">
              <label htmlFor="profile_name" className="block text-xs font-semibold text-[#524A44] mb-1">
                Specs Profile Name <span className="text-red-500">*</span>
              </label>
              <input 
                id="profile_name"
                type="text" 
                placeholder="e.g. Slim Suit, Standard Blazer, Gown"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe" 
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#524A44] mb-2">Metrics Sizing Checklist</span>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {metricRows.map((row, idx) => (
                  <div key={`metric-${idx}-${row.key}`} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Measurement key (e.g. Chest)"
                        value={row.key}
                        onChange={e => handleMetricChange(idx, 'key', e.target.value)}
                        list="common-metrics"
                        className="w-full px-3 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-taupe"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Value (e.g. 40 in, 102 cm)"
                        value={row.value}
                        onChange={e => handleMetricChange(idx, 'value', e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-taupe"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveMetricRow(idx)}
                      className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-[#A8A19A] hover:text-[#B26959] cursor-pointer"
                      title="Remove row"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <datalist id="common-metrics">
                {COMMON_METRICS.map(m => <option key={m} value={m} />)}
              </datalist>

              <button
                type="button"
                onClick={handleAddMetricRow}
                className="mt-3 inline-flex items-center gap-1 text-xs text-taupe font-semibold hover:underline cursor-pointer"
              >
                <Plus size={13} /> Add Sizing Row
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#EBE6E0]">
            <button 
              type="button" 
              onClick={() => setIsAddingProfile(false)}
              className="px-4 py-2 border border-[#EBE6E0] rounded-lg text-xs font-semibold text-[#827A73] hover:bg-[#FAF6F3] cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSaveMeasurement}
              disabled={savingMeasurement || !profileName.trim()}
              className="px-4 py-2 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {savingMeasurement && <Loader2 size={12} className="animate-spin" />}
              Save Specs
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-[#2D2A26]">Garment Fit Profile</h2>
              <p className="text-xs text-[#827A73] mt-0.5">Store different versions of body dimensions for this client.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEditingBodyProfileId(null);
                  setBodyForm({
                    customer_id: customerId.toString(),
                    source: 'shop_owner',
                    profile_name: 'Body Dimensions',
                    notes: '',
                    metrics: {
                      bust: '', chest: '', shoulder_width: '', neck: '',
                      sleeve_length: '', back_length: '', waist: '', hips: '',
                      inseam: '', thigh: ''
                    }
                  });
                  setBodyError('');
                  setIsBodyModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-[#2D2A26] hover:bg-black text-white px-3 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                <Plus size={13} /> 🧍 Add Body Measurements
              </button>
              <button 
                onClick={() => {
                  setProfileName('');
                  setMetricRows([{ key: '', value: '' }]);
                  setEditingProfileId(null);
                  setIsAddingProfile(true);
                }}
                className="flex items-center gap-1.5 bg-taupe hover:bg-taupe/90 text-white px-3.5 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer"
              >
                <Plus size={14} /> 🛠️ Add Custom Specs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {grouped.map(([profileName, versions]) => {
              // Sort versions by ID ascending
              versions.sort((a, b) => a.id - b.id);
              
              const rKey = `c_${customerId}_p_${profileName}`;
              const selectedId = selectedVersionIds[rKey];
              const activeMeas = versions.find(v => v.id === selectedId) || versions.at(-1)!;
              const activeIndex = versions.indexOf(activeMeas);
              const isBody = isBodyMeasurementProfile(activeMeas.metrics || {});
              
              return (
                <div key={profileName} className="bg-white border border-[#EBE6E0] rounded-xl p-5 shadow-sm space-y-4 hover:border-taupe/40 transition-colors relative">
                  <div className="flex justify-between items-start border-b border-[#EBE6E0]/60 pb-2.5 flex-wrap gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#2D2A26] truncate">{profileName}</h3>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isBody
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-taupe/10 text-taupe'
                        }`}>
                          {isBody ? '🧍 Body Dimensions' : '🛠️ Custom Specs'}
                        </span>
                        <span className="text-[10px] text-[#A8A19A] whitespace-nowrap">
                          Version {activeIndex + 1} of {versions.length}
                        </span>
                        {versions.length > 1 && (
                          <select
                            value={activeMeas.id}
                            onChange={(e) => {
                              const newVerId = Number(e.target.value);
                              setSelectedVersionIds(prev => ({ ...prev, [rKey]: newVerId }));
                            }}
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
                      <span className="text-[10px] text-[#A8A19A] mt-0.5 block">Version Profile #{activeMeas.id}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handleCloneMeasurement(activeMeas)}
                        className="p-1 rounded text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#2D2A26] border border-transparent hover:border-[#EBE6E0] transition-all cursor-pointer"
                        title="Create new version from this profile"
                      >
                        <Copy size={13} />
                      </button>
                      <button 
                        onClick={() => {
                          if (isBody) {
                            const stringMetrics: Record<string, string> = {};
                            if (activeMeas.metrics) {
                              for (const [k, v] of Object.entries(activeMeas.metrics)) {
                                stringMetrics[k] = v !== undefined && v !== null ? String(v) : '';
                              }
                            }
                            setEditingBodyProfileId(activeMeas.id);
                            setBodyError('');
                            setBodyForm({
                              customer_id: customerId.toString(),
                              source: 'shop_owner',
                              profile_name: activeMeas.profile_name,
                              notes: activeMeas.notes || '',
                              metrics: stringMetrics as any
                            });
                            setIsBodyModalOpen(true);
                          } else {
                            handleStartEditMeasurement(activeMeas);
                          }
                        }}
                        className="p-1 rounded text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#2D2A26] border border-transparent hover:border-[#EBE6E0] transition-all cursor-pointer"
                        title="Edit measurements"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteMeasurement(activeMeas.id)}
                        disabled={isDeletingMeasurementId === activeMeas.id}
                        className="p-1 rounded text-[#A8A19A] hover:bg-red-50 hover:text-[#B26959] border border-transparent hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                        title="Delete profile"
                      >
                        {isDeletingMeasurementId === activeMeas.id ? (
                           <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    {Object.entries(activeMeas.metrics || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-[#EBE6E0]/30 pb-1">
                        <span className="text-[#827A73] capitalize font-medium">{key}</span>
                        <span className="text-[#2D2A26] font-semibold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {measurements.length === 0 && (
              <div className="bg-[#FAF6F3]/50 border border-[#EBE6E0] border-dashed rounded-xl p-12 text-center text-sm text-[#A8A19A] md:col-span-2">
                No measurements specified for this client. Create a body measurement profile or specs checklist to track sizing.
              </div>
            )}
          </div>

          <MeasurementFormModal
            isOpen={isBodyModalOpen}
            onClose={() => setIsBodyModalOpen(false)}
            editingId={editingBodyProfileId}
            form={bodyForm}
            setForm={setForm => {
              // React.Dispatch support
              if (typeof setForm === 'function') {
                setBodyForm(prev => setForm(prev));
              } else {
                setBodyForm(setForm);
              }
            }}
            customers={[{ id: customerId, name: customerName }]}
            error={bodyError}
            isSubmitting={isBodySubmitting}
            onSubmit={handleBodySubmit}
          />
        </div>
      )}
    </div>
  );
}
