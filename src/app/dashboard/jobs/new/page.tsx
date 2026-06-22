'use client';

import { Suspense } from 'react';
import JobCreateForm from '@/components/jobs/JobCreateForm';

export default function NewJobOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-[#A8A19A] animate-pulse">
          Loading form details...
        </div>
      }
    >
      <JobCreateForm />
    </Suspense>
  );
}
