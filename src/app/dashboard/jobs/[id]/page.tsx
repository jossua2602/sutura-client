'use client';

import React from 'react';
import { ArrowLeft, Loader2, Save, Trash2, ShoppingBag, Store, Printer, Truck } from 'lucide-react';
import Modal from '@/components/Modal';
import Link from 'next/link';
import JobProductionTimeline from '@/components/jobs/JobProductionTimeline';
import JobFulfillmentCard from '@/components/jobs/JobFulfillmentCard';
import JobStaffAssignmentCard from '@/components/jobs/JobStaffAssignmentCard';
import JobFinancialsCard from '@/components/jobs/JobFinancialsCard';
import { useJobDetail } from '@/components/jobs/useJobDetail';
import { RosterItem } from '@/components/jobs/jobTypes';

export default function JobDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const {
    shop,
    router,
    job,
    loading,
    saving,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    status,
    setStatus,
    notes,
    setNotes,
    courierTracking,
    setCourierTracking,
    shippingAddress,
    setShippingAddress,
    isOutsourced,
    setIsOutsourced,
    partnerShopName,
    setPartnerShopName,
    fulfillmentType,
    setFulfillmentType,
    fulfillmentProvider,
    setFulfillmentProvider,
    supportedCouriers,
    allStaff,
    staffAssignments,
    setStaffAssignments,
    staffCompletions,
    savingStaff,
    handleUpdate,
    handleUpdateStaff,
    handleChargePayment,
    handleDelete,
  } = useJobDetail(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#A8A19A]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading job order details...
      </div>
    );
  }

  if (!job) {
    return <div className="text-[#A8A19A]">Job Order not found.</div>;
  }

  return (
    <>
      <div className="print:hidden max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#827A73] hover:text-[#2D2A26] transition-colors"
              type="button"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight flex items-center gap-2">
                {job.order_number}
                {job.intake_channel === 'online' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    <ShoppingBag size={11} /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#F0EAE3] text-[#827A73] px-2 py-0.5 rounded-full">
                    <Store size={11} /> Walk-in
                  </span>
                )}
                {job.fulfillment_type === 'shipping' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    <Truck size={11} /> Shipping
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Store size={11} /> Pickup
                  </span>
                )}
                {job.is_rush && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse border border-amber-200">
                    ⚡ Rush Order
                  </span>
                )}
              </h1>
              <p className="text-[#827A73] text-sm mt-1">Manage lifecycle and financials</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => globalThis.print()}
              className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#A8A19A] hover:text-[#524A44] transition-colors flex items-center gap-2"
              title="Print Job Ticket"
              type="button"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#A8A19A] hover:text-[#B26959] transition-colors flex items-center gap-2"
              title="Delete Job Order"
              type="button"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              type="button"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
              <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Job Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#A8A19A] block mb-1">Customer</span>
                  {job.customer ? (
                    <Link 
                      href={`/dashboard/customers/${job.customer.id}`} 
                      className="text-[#9A8073] hover:text-[#9A8073]/80 hover:underline font-semibold flex items-center gap-1.5"
                    >
                      {job.customer.name}
                      <span className="text-[10px] text-[#A8A19A] font-normal">(View Profile)</span>
                    </Link>
                  ) : (
                    <span className="text-[#524A44] font-medium">Unspecified</span>
                  )}
                </div>
                <div>
                  <span className="text-[#A8A19A] block mb-1">Service</span>
                  <span className="text-[#524A44] font-medium">{job.service?.name}</span>
                </div>
                <div>
                  <span className="text-[#A8A19A] block mb-1">Assigned Staff</span>
                  <span className="text-[#524A44] font-medium">{job.assigned_staff?.name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-[#A8A19A] block mb-1">Total Amount</span>
                  <span className="text-[#524A44] font-medium">₱{Number.parseFloat(String(job.total_amount)).toFixed(2)}</span>
                </div>
                {job.is_rush && (
                  <div>
                    <span className="text-[#A8A19A] block mb-1">⚡ Rush Fee</span>
                    <span className="text-[#B26959] font-semibold">₱{Number.parseFloat(String(job.rush_fee || '0')).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Specifications Card */}
            {job.custom_order_data && Object.keys(job.custom_order_data).some(k => k !== 'roster' && k !== 'team_roster') ? (
              <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
                <h2 className="text-lg font-medium text-[#2D2A26] mb-4">📋 Custom Specifications</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(job.custom_order_data)
                    .filter(([label]) => label !== 'roster' && label !== 'team_roster')
                    .map(([label, value]) => (
                      <div key={label}>
                        <span className="text-[#A8A19A] block mb-1 capitalize">{label.replaceAll('_', ' ')}</span>
                        <span className="text-[#524A44] font-medium">{typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '—'}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {/* Team Roster / Size Sheet Table Card */}
            {(() => {
              const teamRoster = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;
              if (!teamRoster || teamRoster.length === 0) return null;
              return (
                <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
                  <h2 className="text-lg font-medium text-[#2D2A26] mb-4">👕 Team Roster & Size Sheet</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-zinc-200">
                      <thead>
                        <tr>
                          <th className="pb-2 font-semibold text-zinc-600 w-12">#</th>
                          <th className="pb-2 font-semibold text-zinc-600">Player/Employee Name</th>
                          <th className="pb-2 font-semibold text-zinc-600">Print Name / Nickname</th>
                          <th className="pb-2 font-semibold text-zinc-600 w-24">Number</th>
                          <th className="pb-2 font-semibold text-zinc-600 w-24">Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150">
                        {teamRoster.map((row, idx: number) => (
                          <tr key={`${row.name}-${row.number}-${idx}`}>
                            <td className="py-2.5 text-zinc-500 font-mono">{idx + 1}</td>
                            <td className="py-2.5 font-medium text-zinc-800">{row.name || '—'}</td>
                            <td className="py-2.5 text-zinc-700">{row.print_name || '—'}</td>
                            <td className="py-2.5 font-mono text-zinc-600 font-bold">{row.number || '—'}</td>
                            <td className="py-2.5 text-zinc-700">
                              <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold">{row.size}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right text-xs text-[#827A73] font-medium mt-4">
                    Total Items: {teamRoster.length}
                  </div>
                </div>
              );
            })()}

            {/* Outsourcing Toggle */}
            <div className={`shadow-sm border rounded-2xl p-6 transition-colors ${isOutsourced ? 'bg-[#9A8073]/5 border-[#9A8073]/30' : 'bg-white border-[#EBE6E0]'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="outsourced-toggle" className="text-lg font-medium text-[#2D2A26] block cursor-pointer">Outsourcing</label>
                  <p className="text-sm text-[#827A73]">Is this order being outsourced to a partner shop?</p>
                </div>
                <div className="relative inline-flex items-center">
                  <input
                    id="outsourced-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isOutsourced}
                    onChange={(e) => setIsOutsourced(e.target.checked)}
                  />
                  <label htmlFor="outsourced-toggle" className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A8B76] cursor-pointer">
                    <span className="sr-only">Toggle Outsourcing</span>
                  </label>
                </div>
              </div>
              {isOutsourced && (
                <div className="mt-4">
                  <label htmlFor="partnerShopName" className="block text-sm font-medium text-[#524A44] mb-1">Partner Shop Name</label>
                  <input
                    id="partnerShopName"
                    type="text"
                    value={partnerShopName}
                    onChange={(e) => setPartnerShopName(e.target.value)}
                    placeholder="e.g. Maria's Tailoring"
                    className="w-full px-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                  />
                </div>
              )}
            </div>

            {/* Production Timeline Card */}
            <JobProductionTimeline
              job={job}
              status={status}
              setStatus={setStatus}
              notes={notes}
              setNotes={setNotes}
              fulfillmentType={fulfillmentType}
            />

            {/* Fulfillment Details Card */}
            <JobFulfillmentCard
              fulfillmentType={fulfillmentType}
              setFulfillmentType={setFulfillmentType}
              fulfillmentProvider={fulfillmentProvider}
              setFulfillmentProvider={setFulfillmentProvider}
              courierTracking={courierTracking}
              setCourierTracking={setCourierTracking}
              shippingAddress={shippingAddress}
              setShippingAddress={setShippingAddress}
              supportedCouriers={supportedCouriers}
            />

            {/* Multi-Stage Staff Assignment Card */}
            <JobStaffAssignmentCard
              allStaff={allStaff}
              staffAssignments={staffAssignments}
              setStaffAssignments={setStaffAssignments}
              staffCompletions={staffCompletions}
              handleUpdateStaff={handleUpdateStaff}
              savingStaff={savingStaff}
            />
          </div>

          <div className="space-y-6">
            {/* Financials / POS Card */}
            <JobFinancialsCard
              job={job}
              saving={saving}
              onCharge={handleChargePayment}
            />
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
          <div className="space-y-4">
            <p className="text-[#524A44] text-sm">
              Are you sure you want to delete this job order? This action cannot be undone.
            </p>
            <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                type="button"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Print View */}
      <div className="hidden print:block w-full text-black text-sm">
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider">{shop?.name || 'SUTURA'}</h1>
            <p className="text-gray-600 font-medium">Job Order Work Ticket</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">#{job.order_number}</p>
            <p className="text-gray-600 font-medium mt-1">Printed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="space-y-2">
            <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">Customer Information</h2>
            <p className="text-base"><strong>Name:</strong> {job.customer?.name || 'Unspecified'}</p>
            {job.fulfillment_type === 'shipping' && job.shipping_address && (
              <p><strong>Address:</strong> {job.shipping_address}</p>
            )}
          </div>
          <div className="space-y-2">
            <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">Job Details</h2>
            <p className="text-base"><strong>Service:</strong> {job.service?.name}</p>
            <p className="text-base"><strong>Intake Channel:</strong> {job.intake_channel.replace('_', ' ').toUpperCase()}</p>
            <p className="text-base"><strong>Fulfillment Type:</strong> {job.fulfillment_type.toUpperCase()}</p>
            <p className="text-base"><strong>Status:</strong> {job.status.replaceAll('_', ' ').toUpperCase()}</p>
            {job.due_date && <p className="text-base"><strong>Due Date:</strong> {new Date(job.due_date).toLocaleDateString()}</p>}
          </div>
        </div>

        {job.custom_order_data && Object.keys(job.custom_order_data).length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">Custom Specifications</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {Object.entries(job.custom_order_data)
                .filter(([k]) => k !== 'roster')
                .map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">{k}</span>
                    <span className="font-medium text-base border-b border-dashed border-gray-300 pb-1">{typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : '—'}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">Production Notes & Instructions</h2>
          <div className="min-h-[120px] border border-black p-4 rounded bg-gray-50/50">
            {job.notes ? (
              <p className="whitespace-pre-wrap text-base">{job.notes}</p>
            ) : (
              <p className="text-gray-400 italic">No special instructions provided.</p>
            )}
          </div>
        </div>
        
        {/* QA Sign-off area */}
        <div className="mt-16 pt-8 border-t border-dashed border-gray-400">
          <div className="flex justify-between items-end px-8">
            <div className="text-center w-48">
              <div className="border-b border-black h-8 mb-2"></div>
              <p className="text-xs uppercase font-semibold">Master Cutter</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-black h-8 mb-2"></div>
              <p className="text-xs uppercase font-semibold">Sewing Quality Check</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-black h-8 mb-2"></div>
              <p className="text-xs uppercase font-semibold">Final Finishing</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
