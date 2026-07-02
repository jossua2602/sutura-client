'use client';

import React from 'react';
import { useAppointments } from '@/components/appointments/useAppointments';
import AppointmentCalendarView from '@/components/appointments/AppointmentCalendarView';
import AppointmentActionModals from '@/components/appointments/AppointmentActionModals';
import AppointmentCreateModal from '@/components/appointments/AppointmentCreateModal';

export default function ProfileAppointmentsCalendar() {
  const aptState = useAppointments();

  return (
    <div className="bg-white border border-[#EBE6E0] rounded-xl shadow-sm overflow-hidden min-h-[500px]">
      <AppointmentCalendarView
        appointments={aptState.appointments}
        currentDate={aptState.currentDate}
        setCurrentDate={aptState.setCurrentDate}
        selectedDay={aptState.selectedDay}
        setSelectedDay={aptState.setSelectedDay}
        calSubMode={aptState.calSubMode}
        setCalSubMode={aptState.setCalSubMode}
        hoveredAptId={aptState.hoveredAptId}
        setHoveredAptId={aptState.setHoveredAptId}
        actionLoadingId={aptState.actionLoadingId}
        isOwnerOrManager={aptState.isOwnerOrManager}
        onReviewClick={(apt) => { aptState.setReviewApt(apt); aptState.setShowReviewModal(true); }}
        onStartClick={(id) => aptState.updateStatus(id, 'in_progress')}
        onCompleteClick={(apt) => { aptState.setCompleteApt(apt); aptState.setShowCompleteModal(true); }}
        onCreateJobClick={(apt) => aptState.handleCreateJob(apt)}
        onDetailsClick={(apt) => { aptState.setViewApt(apt); aptState.setShowViewModal(true); }}
        onAddClick={(dayStr, defaultTime) => {
          aptState.setEditingApt(null);
          aptState.setShowCreateModal(true);
        }}
      />

      <AppointmentCreateModal
        isOpen={aptState.showCreateModal}
        onClose={() => { aptState.setShowCreateModal(false); aptState.setEditingApt(null); aptState.setError(''); }}
        editingApt={aptState.editingApt}
        customers={aptState.customers}
        services={aptState.services}
        branches={aptState.branches}
        staff={aptState.staff}
        jobOrders={aptState.jobOrders}
        todayStr={aptState.todayStr}
        minTimeFor={aptState.minTimeFor}
        onSubmit={aptState.handleCreateSubmit}
        isSubmitting={aptState.isSubmitting}
        error={aptState.error}
      />

      <AppointmentActionModals
        showReviewModal={aptState.showReviewModal}
        setShowReviewModal={aptState.setShowReviewModal}
        reviewApt={aptState.reviewApt}
        setReviewApt={aptState.setReviewApt}
        showRescheduleModal={aptState.showRescheduleModal}
        setShowRescheduleModal={aptState.setShowRescheduleModal}
        rescheduleApt={aptState.rescheduleApt}
        setRescheduleApt={aptState.setRescheduleApt}
        showCompleteModal={aptState.showCompleteModal}
        setShowCompleteModal={aptState.setShowCompleteModal}
        completeApt={aptState.completeApt}
        setCompleteApt={aptState.setCompleteApt}
        showCancelModal={aptState.showCancelModal}
        setShowCancelModal={aptState.setShowCancelModal}
        cancelApt={aptState.cancelApt}
        setCancelApt={aptState.setCancelApt}
        showViewModal={aptState.showViewModal}
        setShowViewModal={aptState.setShowViewModal}
        viewApt={aptState.viewApt}
        setViewApt={aptState.setViewApt}
        jobOrders={aptState.jobOrders}
        todayStr={aptState.todayStr}
        minTimeFor={aptState.minTimeFor}
        isSubmitting={aptState.isSubmitting}
        actionLoadingId={aptState.actionLoadingId}
        onConfirmReview={aptState.handleConfirmReview}
        onRejectReview={aptState.handleRejectReview}
        onRescheduleSubmit={aptState.handleRescheduleSubmit}
        onCompleteSubmit={aptState.handleCompleteSubmit}
        onCancelConfirm={aptState.handleCancelConfirm}
        onCreateJob={aptState.handleCreateJob}
      />
    </div>
  );
}
