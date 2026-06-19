'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react';

const TEMPLATES: Record<string, string[]> = {
  'Suit (2-Piece)': ['Chest', 'Waist', 'Shoulder', 'Sleeve Length', 'Jacket Length', 'Trouser Waist', 'Inseam', 'Outseam'],
  'Trousers': ['Waist', 'Hip', 'Inseam', 'Outseam', 'Thigh', 'Knee', 'Hem'],
  'Dress Shirt': ['Neck', 'Chest', 'Waist', 'Shoulder', 'Sleeve', 'Bicep', 'Wrist', 'Shirt Length'],
  'Custom': []
};

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const { shop , user } = useAuthStore();
  const router = useRouter();
  
  const [customer, setCustomer] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form Builder State
  const [profileName, setProfileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Suit (2-Piece)');
  const [metrics, setMetrics] = useState<{key: string, value: string}[]>([]);

  useEffect(() => {
    // Initialize default template metrics
    if (TEMPLATES[selectedTemplate]) {
      setMetrics(TEMPLATES[selectedTemplate].map(k => ({ key: k, value: '' })));
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (shop && params.id) {
      api.get(`/shops/${shop.id}/measurements`)
        .then(res => {
          const allMeasurements = res.data.data;
          const custMeasurements = allMeasurements.filter((m: any) => m.customer.id.toString() === params.id);
          setMeasurements(custMeasurements);
          if (custMeasurements.length > 0) {
            setCustomer(custMeasurements[0].customer);
          } else {
             setCustomer({ id: params.id, name: `Customer #${params.id}` });
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [shop, params.id]);

  const handleSaveProfile = async () => {
    if (!shop || !customer) return;
    try {
      setSaving(true);
      
      // Convert metrics array to JSON object
      const parsedMetrics: Record<string, string> = {};
      metrics.forEach(m => {
        if (m.key.trim()) {
          parsedMetrics[m.key.trim()] = m.value.trim();
        }
      });

      await api.post(`/shops/${shop.id}/measurements`, {
        customer_id: customer.id,
        profile_name: profileName || selectedTemplate,
        metrics: parsedMetrics
      });

      // Refresh list
      const res = await api.get(`/shops/${shop.id}/measurements`);
      const allMeasurements = res.data.data;
      const custMeasurements = allMeasurements.filter((m: any) => m.customer.id.toString() === params.id);
      setMeasurements(custMeasurements);
      
      // Reset form
      setProfileName('');
      setMetrics(TEMPLATES[selectedTemplate].map(k => ({ key: k, value: '' })));
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setSaving(false);
    }
  };

  const updateMetric = (index: number, field: 'key' | 'value', val: string) => {
    const newMetrics = [...metrics];
    newMetrics[index][field] = val;
    setMetrics(newMetrics);
  };

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const addMetric = () => {
    setMetrics([...metrics, { key: '', value: '' }]);
  };

  if (loading) {
    return <div className="text-[#A8A19A] py-12 text-center">Loading customer profile...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#827A73] hover:text-[#2D2A26] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">{customer?.name || `Customer #${params.id}`}</h1>
          <p className="text-[#827A73] text-sm mt-1">{customer?.email || 'Customer Profile'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-[#2D2A26]">Measurement History</h2>
          {measurements.map(m => (
            <div key={m.id} className="bg-white shadow-sm border border-[#EBE6E0] rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-bold text-zinc-200">{m.profile_name}</h3>
                <span className="text-xs text-[#A8A19A]">{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {Object.entries(m.metrics || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-[#EBE6E0]/50 pb-1">
                    <span className="text-[#A8A19A] capitalize">{key}</span>
                    <span className="text-[#524A44] font-medium">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {measurements.length === 0 && (
            <div className="text-[#A8A19A] text-sm italic p-6 border border-dashed border-[#EBE6E0] rounded-xl text-center">
              No profiles found for this customer.
            </div>
          )}
        </div>

        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 sticky top-6 shadow-sm">
          <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Record New Measurements</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Select Garment Template</label>
              <select 
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                {Object.keys(TEMPLATES).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Profile Name (Optional)</label>
              <input
                type="text"
                value={profileName}
                placeholder={`e.g. Wedding ${selectedTemplate}`}
                onChange={e => setProfileName(e.target.value)}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-[#EBE6E0]">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-[#524A44]">Anatomy Measurements</label>
                <button onClick={addMetric} className="text-xs text-taupe flex items-center gap-1 hover:text-taupe-hover">
                  <Plus size={14} /> Add Field
                </button>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={m.key}
                      onChange={e => updateMetric(idx, 'key', e.target.value)}
                      placeholder="Part (e.g. Chest)"
                      className="w-1/2 px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#524A44] focus:outline-none focus:border-taupe"
                    />
                    <input
                      type="text"
                      value={m.value}
                      onChange={e => updateMetric(idx, 'value', e.target.value)}
                      placeholder="Value (e.g. 40in)"
                      className="w-1/2 px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                    />
                    <button 
                      onClick={() => removeMetric(idx)}
                      className="p-2 text-[#827A73] hover:text-[#B26959] hover:bg-[#B26959]/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {metrics.length === 0 && (
                  <div className="text-xs text-[#A8A19A] text-center py-4 italic">No fields. Click "Add Field" to start.</div>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving || metrics.length === 0}
              className="w-full bg-taupe hover:bg-taupe/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              Save Measurements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
