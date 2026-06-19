'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Save, Trash2, Edit2, X } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
}

interface MeasurementProfile {
  id: number;
  profile_name: string;
  metrics: Record<string, number>;
  customer: Customer;
}

export default function CustomerProfilePage({ params }: Readonly<{ params: { id: string } }>) {
  const { shop } = useAuthStore();
  const router = useRouter();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [saving, setSaving] = useState(false);
  
  // New Profile Form
  const [profileName, setProfileName] = useState('');
  const [metricsJson, setMetricsJson] = useState('{\n  "chest": 40,\n  "waist": 32,\n  "inseam": 30\n}');

  // Edit Mode States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editProfileName, setEditProfileName] = useState('');
  const [editMetricsJson, setEditMetricsJson] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (shop && params.id) {
      api.get(`/shops/${shop.id}/measurements`)
        .then(res => {
          const allMeasurements = res.data.data;
          const custMeasurements = allMeasurements.filter((m: MeasurementProfile) => m.customer.id.toString() === params.id);
          setMeasurements(custMeasurements);
          if (custMeasurements.length > 0) {
            setCustomer(custMeasurements[0].customer);
          } else {
             // In a real app we'd fetch the customer via GET /customers/{id}
             setCustomer({ id: parseInt(params.id), name: `Customer #${params.id}` });
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
      let parsedMetrics = {};
      try {
        parsedMetrics = JSON.parse(metricsJson);
      } catch (e) {
        alert('Invalid JSON format for measurements.');
        setSaving(false);
        return;
      }

      await api.post(`/shops/${shop.id}/measurements`, {
        customer_id: customer.id,
        profile_name: profileName,
        metrics: parsedMetrics
      });

      // Refresh list
      const res = await api.get(`/shops/${shop.id}/measurements`);
      const allMeasurements = res.data.data;
      const custMeasurements = allMeasurements.filter((m: MeasurementProfile) => m.customer.id.toString() === params.id);
      setMeasurements(custMeasurements);
      setProfileName('');
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!shop || !confirm('Are you sure you want to delete this profile?')) return;
    try {
      setIsDeleting(id);
      await api.delete(`/shops/${shop.id}/measurements/${id}`);
      setMeasurements(measurements.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete measurement profile.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStartEdit = (m: MeasurementProfile) => {
    setEditingId(m.id);
    setEditProfileName(m.profile_name);
    setEditMetricsJson(JSON.stringify(m.metrics || {}, null, 2));
  };

  const handleUpdate = async () => {
    if (!shop || !editingId) return;
    try {
      setSaving(true);
      let parsedMetrics = {};
      try {
        parsedMetrics = JSON.parse(editMetricsJson);
      } catch (e) {
        alert('Invalid JSON format for measurements.');
        setSaving(false);
        return;
      }

      await api.put(`/shops/${shop.id}/measurements/${editingId}`, {
        profile_name: editProfileName,
        measurements: parsedMetrics
      });

      const res = await api.get(`/shops/${shop.id}/measurements`);
      setMeasurements(res.data.data.filter((m: MeasurementProfile) => m.customer.id.toString() === params.id));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-[#A8A19A] py-12 text-center">Loading customer profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-[#2D2A26]">Measurement Profiles</h2>
          {measurements.map(m => (
            <div key={m.id} className="bg-white shadow-sm border border-[#EBE6E0] rounded-xl p-5 shadow-sm relative">
              {editingId === m.id ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium text-[#2D2A26]">Edit Profile</h3>
                    <button onClick={() => setEditingId(null)} className="text-[#A8A19A] hover:text-[#2D2A26]">
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={e => setEditProfileName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                  />
                  <textarea
                    value={editMetricsJson}
                    onChange={e => setEditMetricsJson(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded text-sm text-[#524A44] font-mono focus:outline-none focus:border-taupe"
                  />
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="w-full bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-md font-medium text-[#2D2A26]">{m.profile_name}</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStartEdit(m)} className="text-[#A8A19A] hover:text-[#9A8073] transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)} 
                        disabled={isDeleting === m.id}
                        className="text-[#A8A19A] hover:text-[#B26959] transition-colors disabled:opacity-50"
                      >
                        {isDeleting === m.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(m.metrics || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-[#EBE6E0]/50 pb-1">
                        <span className="text-[#A8A19A] capitalize">{key}</span>
                        <span className="text-[#524A44] font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
          {measurements.length === 0 && (
            <div className="text-[#A8A19A] text-sm italic">No profiles found for this customer.</div>
          )}
        </div>

        <div>
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 sticky top-6 shadow-sm">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Add New Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#524A44] mb-1">Profile Name (e.g. Suit, Dress)</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#524A44] mb-1">Metrics (JSON format)</label>
                <textarea
                  value={metricsJson}
                  onChange={e => setMetricsJson(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#524A44] font-mono text-xs focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe leading-relaxed"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !profileName}
                className="w-full bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
