'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  ArrowLeft, Loader2, Save, Trash2, Edit2, X, Plus, Calendar, 
  Package, DollarSign, Mail, Phone, Clock, FileText, ChevronRight, Scissors
} from 'lucide-react';
import Link from 'next/link';

interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  profile_picture?: string;
  total_spend?: number;
  active_jobs?: number;
  completed_jobs?: number;
  created_at: string;
}

interface MeasurementProfile {
  id: number;
  profile_name: string;
  metrics: Record<string, number | string>;
  customer: { id: number; name: string };
}

interface JobOrder {
  id: number;
  order_number: string;
  order_type: 'walk_in' | 'online';
  status: string;
  payment_status: string;
  total_amount: string | number;
  balance: string | number;
  due_date: string | null;
  service?: { name: string };
  customer?: { id: number; name: string };
}

interface Appointment {
  id: number;
  status: string;
  scheduled_at: string;
  notes?: string;
  service?: { name: string };
  customer?: { id: number; name: string };
}

interface MetricRow {
  key: string;
  value: string;
}

const COMMON_METRICS = ['Chest', 'Waist', 'Hips', 'Inseam', 'Sleeve Length', 'Shoulders', 'Neck', 'Bust'];

export default function CustomerProfilePage({ params }: Readonly<{ params: { id: string } }>) {
  const { shop } = useAuthStore();
  const router = useRouter();
  
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementProfile[]>([]);
  const [jobs, setJobs] = useState<JobOrder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'orders' | 'appointments'>('overview');
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Measurement Profile state
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState('');
  const [metricRows, setMetricRows] = useState<MetricRow[]>([
    { key: 'Chest', value: '' },
    { key: 'Waist', value: '' },
    { key: 'Hips', value: '' }
  ]);
  const [savingMeasurement, setSavingMeasurement] = useState(false);
  const [isDeletingMeasurementId, setIsDeletingMeasurementId] = useState<number | null>(null);

  const loadData = async () => {
    if (!shop) return;
    try {
      const [resCustomers, resMeasurements, resJobs, resAppointments] = await Promise.all([
        api.get(`/shops/${shop.id}/customers`),
        api.get(`/shops/${shop.id}/measurements`),
        api.get(`/shops/${shop.id}/jobs`),
        api.get(`/shops/${shop.id}/appointments`)
      ]);

      const allCust: CustomerData[] = resCustomers.data.data || [];
      const found = allCust.find((c: CustomerData) => c.id.toString() === params.id);
      
      if (found) {
        setCustomer(found);
        setEditName(found.name || '');
        setEditEmail(found.email || '');
        setEditPhone(found.phone || '');
      } else {
        setCustomer({
          id: parseInt(params.id),
          name: `Client #${params.id}`,
          email: '',
          phone: '',
          created_at: new Date().toISOString()
        });
      }

      // Filter measurements
      const allMeas: MeasurementProfile[] = resMeasurements.data.data || [];
      setMeasurements(allMeas.filter((m: MeasurementProfile) => m.customer.id.toString() === params.id));

      // Filter job orders
      const allJobs: JobOrder[] = resJobs.data.data.data || resJobs.data.data || [];
      setJobs(allJobs.filter((j: JobOrder) => j.customer?.id.toString() === params.id));

      // Filter appointments
      const allAppt: Appointment[] = resAppointments.data.data || [];
      setAppointments(allAppt.filter((a: Appointment) => a.customer?.id.toString() === params.id));

      setLoading(false);
    } catch (err) {
      console.error('Failed to load profile data', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shop && params.id) {
      setTimeout(() => {
        void loadData();
      }, 0);
    }
  }, [shop, params.id]);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!shop || !customer) return;

    setSavingProfile(true);
    try {
      const res = await api.put(`/shops/${shop.id}/customers/${customer.id}`, {
        name: editName,
        email: editEmail,
        phone: editPhone
      });
      setCustomer(prev => prev ? { ...prev, ...res.data.data } : null);
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Failed to update customer details', err);
      alert('Failed to update profile info. Please ensure email is valid and unique.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleStartAddMeasurement = () => {
    setProfileName('');
    setMetricRows([
      { key: 'Chest', value: '' },
      { key: 'Waist', value: '' },
      { key: 'Hips', value: '' }
    ]);
    setEditingProfileId(null);
    setIsAddingProfile(true);
  };

  const handleStartEditMeasurement = (m: MeasurementProfile) => {
    setProfileName(m.profile_name);
    const rows = Object.entries(m.metrics || {}).map(([key, val]) => ({
      key,
      value: String(val)
    }));
    setMetricRows(rows.length > 0 ? rows : [{ key: '', value: '' }]);
    setEditingProfileId(m.id);
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
    if (!shop || !customer || !profileName.trim()) return;

    setSavingMeasurement(true);
    
    // Construct metrics object
    const metricsObj: Record<string, string | number> = {};
    metricRows.forEach(row => {
      if (row.key.trim()) {
        const num = parseFloat(row.value);
        metricsObj[row.key.trim()] = isNaN(num) ? row.value.trim() : num;
      }
    });

    try {
      if (editingProfileId) {
        // Update
        await api.put(`/shops/${shop.id}/measurements/${editingProfileId}`, {
          profile_name: profileName,
          measurements: metricsObj
        });
      } else {
        // Create
        await api.post(`/shops/${shop.id}/measurements`, {
          customer_id: customer.id,
          profile_name: profileName,
          metrics: metricsObj
        });
      }

      // Reload measurements
      const res = await api.get(`/shops/${shop.id}/measurements`);
      const allMeas: MeasurementProfile[] = res.data.data || [];
      setMeasurements(allMeas.filter((m: MeasurementProfile) => m.customer.id.toString() === params.id));
      
      setIsAddingProfile(false);
    } catch (err) {
      console.error('Failed to save measurements', err);
      alert('Failed to save measurements profile.');
    } finally {
      setSavingMeasurement(false);
    }
  };

  const handleDeleteMeasurement = async (id: number) => {
    if (!shop || !confirm('Are you sure you want to delete this measurement profile?')) return;

    setIsDeletingMeasurementId(id);
    try {
      await api.delete(`/shops/${shop.id}/measurements/${id}`);
      setMeasurements(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete measurements', err);
      alert('Failed to delete measurement profile.');
    } finally {
      setIsDeletingMeasurementId(null);
    }
  };

  const calculateTotalSpend = () => {
    return jobs.reduce((sum, job) => sum + parseFloat(job.total_amount as string || '0'), 0);
  };

  const getActiveJobsCount = () => {
    return jobs.filter(j => !['completed', 'cancelled'].includes(j.status)).length;
  };

  const getCompletedJobsCount = () => {
    return jobs.filter(j => j.status === 'completed').length;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#A8A19A]">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-taupe" />
        <span className="text-sm font-medium">Loading customer profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Panel */}
      <div className="flex items-start justify-between bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#827A73] hover:text-[#2D2A26] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">{customer?.name}</h1>
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="p-1.5 rounded-lg border border-[#EBE6E0] text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#2D2A26] transition-all"
                title="Edit Client Info"
              >
                <Edit2 size={13} />
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#827A73] mt-1.5 flex-wrap">
              {customer?.email && (
                <span className="flex items-center gap-1">
                  <Mail size={12} /> {customer.email}
                </span>
              )}
              {customer?.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {customer.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={12} /> Client since {new Date(customer?.created_at || '').toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Value', value: `₱${calculateTotalSpend().toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Active Projects', value: getActiveJobsCount(), icon: Scissors, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Completed Orders', value: getCompletedJobsCount(), icon: Package, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
          { label: 'Appointments', value: appointments.length, icon: Calendar, color: 'bg-amber-50 text-amber-700 border-amber-100' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-[#EBE6E0] rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-semibold text-[#827A73] uppercase tracking-wider block">{stat.label}</span>
                <span className="text-lg font-bold text-[#2D2A26] mt-0.5 block">{stat.value}</span>
              </div>
              <div className={`p-2.5 rounded-lg border ${stat.color} shrink-0`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile Edit Dialog */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-[#2D2A26]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE6E0] rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[#EBE6E0] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#2D2A26]">Edit Customer Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-[#A8A19A] hover:text-[#2D2A26]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#524A44] mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#524A44] mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#524A44] mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="e.g. +639..."
                  className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#EBE6E0]">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-[#EBE6E0] rounded-lg text-xs font-semibold text-[#827A73] hover:bg-[#FAF6F3]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingProfile}
                  className="px-4 py-2 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  {savingProfile && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex border-b border-[#EBE6E0] gap-4">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'measurements', label: 'Measurements & Specs' },
          { id: 'orders', label: `Job Orders (${jobs.length})` },
          { id: 'appointments', label: `Appointments (${appointments.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as 'overview' | 'measurements' | 'orders' | 'appointments');
              setIsAddingProfile(false);
            }}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
              activeTab === tab.id
                ? 'border-taupe text-[#2D2A26]'
                : 'border-transparent text-[#A8A19A] hover:text-[#524A44]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Profile Details */}
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#2D2A26]">Client Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Full Name</span>
                    <span className="text-[#2D2A26] font-medium">{customer?.name}</span>
                  </div>
                  <div>
                    <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Email Address</span>
                    <span className="text-[#2D2A26] font-medium">{customer?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Phone Number</span>
                    <span className="text-[#2D2A26] font-medium">{customer?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Profile Reference</span>
                    <span className="text-[#2D2A26] font-medium">Customer ID #{customer?.id}</span>
                  </div>
                </div>
              </div>

              {/* Active Jobs Quick Overview */}
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-[#2D2A26]">Ongoing Garments Production</h2>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-taupe font-semibold hover:underline flex items-center gap-0.5">
                    View All Orders <ChevronRight size={14} />
                  </button>
                </div>
                <div className="divide-y divide-[#EBE6E0] text-sm">
                  {jobs.filter(j => !['completed', 'cancelled'].includes(j.status)).map(job => (
                    <div key={job.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <Link href={`/dashboard/jobs/${job.id}`} className="font-semibold text-taupe hover:underline block">
                          {job.order_number}
                        </Link>
                        <span className="text-xs text-[#827A73]">{job.service?.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-[#2D2A26]">₱{parseFloat(job.total_amount as string).toLocaleString()}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          job.status === 'pending' ? 'bg-[#FAF6F3] text-[#827A73] border-[#EBE6E0]' : 'bg-[#BCA89F]/10 text-[#BCA89F] border-[#BCA89F]/20'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {jobs.filter(j => !['completed', 'cancelled'].includes(j.status)).length === 0 && (
                    <div className="text-center py-6 text-xs text-[#A8A19A] italic">No active production runs currently.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Measurements Version Box */}
            <div className="space-y-6">
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-[#2D2A26]">Quick Specs</h2>
                  <button onClick={() => setActiveTab('measurements')} className="text-xs text-taupe font-semibold hover:underline">
                    Manage
                  </button>
                </div>
                <div className="space-y-3">
                  {measurements.slice(0, 2).map(m => (
                    <div key={m.id} className="bg-[#FAF6F3]/50 border border-[#EBE6E0] p-3.5 rounded-xl text-xs">
                      <div className="font-bold text-[#2D2A26] border-b border-[#EBE6E0]/60 pb-1 mb-2 flex justify-between">
                        <span>{m.profile_name}</span>
                        <span className="font-normal text-[10px] text-[#827A73]">({Object.keys(m.metrics || {}).length} specs)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                        {Object.entries(m.metrics || {}).slice(0, 4).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-[#EBE6E0]/20 pb-0.5">
                            <span className="text-[#827A73] capitalize truncate">{k}</span>
                            <span className="font-semibold text-[#524A44]">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {measurements.length === 0 && (
                    <div className="text-center py-6 text-xs text-[#A8A19A] italic">No specifications entered.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'measurements' && (
          <div className="space-y-6">
            {!isAddingProfile ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-[#2D2A26]">Garment Fit Profile</h2>
                    <p className="text-xs text-[#827A73] mt-0.5">Store different versions of body dimensions for this client.</p>
                  </div>
                  <button 
                    onClick={handleStartAddMeasurement}
                    className="flex items-center gap-1.5 bg-taupe hover:bg-taupe/90 text-white px-3.5 py-2 rounded-lg font-medium text-xs transition-colors"
                  >
                    <Plus size={14} /> Add Specs Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {measurements.map(m => (
                    <div key={m.id} className="bg-white border border-[#EBE6E0] rounded-xl p-5 shadow-sm space-y-4 hover:border-taupe/40 transition-colors relative">
                      <div className="flex justify-between items-start border-b border-[#EBE6E0]/60 pb-2.5">
                        <div>
                          <h3 className="font-bold text-[#2D2A26]">{m.profile_name}</h3>
                          <span className="text-[10px] text-[#A8A19A]">Version Profile #{m.id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleStartEditMeasurement(m)}
                            className="p-1 rounded text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#2D2A26] border border-transparent hover:border-[#EBE6E0] transition-all"
                            title="Edit measurements"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteMeasurement(m.id)}
                            disabled={isDeletingMeasurementId === m.id}
                            className="p-1 rounded text-[#A8A19A] hover:bg-red-50 hover:text-[#B26959] border border-transparent hover:border-red-200 transition-all"
                            title="Delete profile"
                          >
                            {isDeletingMeasurementId === m.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        {Object.entries(m.metrics || {}).map(([key, val]) => (
                          <div key={key} className="flex justify-between border-b border-[#EBE6E0]/30 pb-1">
                            <span className="text-[#827A73] capitalize font-medium">{key}</span>
                            <span className="text-[#2D2A26] font-semibold">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {measurements.length === 0 && (
                    <div className="bg-[#FAF6F3]/50 border border-[#EBE6E0] border-dashed rounded-xl p-12 text-center text-sm text-[#A8A19A] md:col-span-2">
                      No measurements specified for {customer?.name}. Create a specs profile to track sleeve, waist, and chest sizing.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Interactive Key-Value Specs Editor (WOW Design)
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-6 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex justify-between items-center border-b border-[#EBE6E0] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#2D2A26]">
                      {editingProfileId ? `Edit ${profileName} Specifications` : 'Add Specifications Profile'}
                    </h3>
                    <p className="text-xs text-[#827A73] mt-0.5">Specify measurement keys and values (e.g. Waist, Chest).</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingProfile(false)}
                    className="p-1.5 rounded-lg border border-[#EBE6E0] text-[#827A73] hover:bg-[#FAF6F3]"
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
                      placeholder="e.g. Slim Suit, Standard Blazer, Gown V2"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe" 
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#524A44] mb-2">Metrics Sizing Checklist</span>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {metricRows.map((row, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
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
                            className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-[#A8A19A] hover:text-[#B26959]"
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
                      className="mt-3 inline-flex items-center gap-1 text-xs text-taupe font-semibold hover:underline"
                    >
                      <Plus size={13} /> Add Sizing Row
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#EBE6E0]">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingProfile(false)}
                    className="px-4 py-2 border border-[#EBE6E0] rounded-lg text-xs font-semibold text-[#827A73] hover:bg-[#FAF6F3]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveMeasurement}
                    disabled={savingMeasurement || !profileName.trim()}
                    className="px-4 py-2 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    {savingMeasurement && <Loader2 size={12} className="animate-spin" />}
                    Save Specs
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#EBE6E0] bg-[#FAF6F3]/30">
              <h2 className="text-sm font-bold text-[#2D2A26]">garment Job Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FAF6F3]/50 border-b border-[#EBE6E0] text-xs uppercase tracking-wider text-[#827A73]">
                    <th className="p-4 font-semibold">Order Number</th>
                    <th className="p-4 font-semibold">Garment / Service</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                    <th className="p-4 font-semibold text-center">Payment Status</th>
                    <th className="p-4 font-semibold text-right">Amount (₱)</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE6E0]">
                  {jobs.map(job => (
                    <tr key={job.id} className="hover:bg-[#FAF6F3]/20 transition-colors">
                      <td className="p-4 font-bold text-[#2D2A26]">
                        {job.order_number}
                        {job.order_type === 'online' ? (
                          <span className="ml-2 inline-flex items-center text-[9px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase">Online</span>
                        ) : (
                          <span className="ml-2 inline-flex items-center text-[9px] font-semibold bg-[#F0EAE3] text-[#827A73] px-1.5 py-0.5 rounded border border-[#EBE6E0] uppercase">Walk-in</span>
                        )}
                      </td>
                      <td className="p-4 text-[#524A44] font-medium">{job.service?.name}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                          job.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          job.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          job.payment_status === 'paid' ? 'bg-[#7A8B76]/15 text-[#7A8B76] border-[#7A8B76]/20' :
                          job.payment_status === 'partial' ? 'bg-[#BCA89F]/15 text-[#BCA89F] border-[#BCA89F]/20' :
                          'bg-[#B26959]/15 text-[#B26959] border-[#B26959]/20'
                        }`}>
                          {job.payment_status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-[#2D2A26]">
                        ₱{parseFloat(job.total_amount as string).toLocaleString()}
                        {parseFloat(job.balance as string) > 0 && (
                          <span className="text-[10px] text-[#B26959] block font-semibold">Bal: ₱{parseFloat(job.balance as string).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link 
                          href={`/dashboard/jobs/${job.id}`}
                          className="inline-flex items-center gap-1.5 text-xs text-taupe font-semibold hover:underline"
                        >
                          View details <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#A8A19A] italic">
                        No orders recorded for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#EBE6E0] bg-[#FAF6F3]/30">
              <h2 className="text-sm font-bold text-[#2D2A26]">Scheduled Customer Appointments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FAF6F3]/50 border-b border-[#EBE6E0] text-xs uppercase tracking-wider text-[#827A73]">
                    <th className="p-4 font-semibold">Date & Time</th>
                    <th className="p-4 font-semibold">Garment Service</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Meeting Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE6E0]">
                  {appointments.map(appt => (
                    <tr key={appt.id} className="hover:bg-[#FAF6F3]/20 transition-colors">
                      <td className="p-4 font-semibold text-[#2D2A26]">
                        {new Date(appt.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="block text-xs font-normal text-[#827A73]">{new Date(appt.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="p-4 text-[#524A44] font-medium">{appt.service?.name || 'Fitting Session / General'}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                          appt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                          appt.status === 'no_show' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                          'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        }`}>
                          {appt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[#827A73] max-w-sm truncate" title={appt.notes}>
                        {appt.notes || '—'}
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[#A8A19A] italic">
                        No appointments recorded for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
