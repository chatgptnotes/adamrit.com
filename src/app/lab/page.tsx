// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import LabDashboard from '@/components/lab/LabDashboard';

function LabContent() {
  return (
    <div className="p-6">
      <LabDashboard />
    </div>
  );
}

export default function Lab() {
  return (
    <Suspense fallback={<div className="p-6">Loading Lab...</div>}>
      <LabContent />
    </Suspense>
  );
}
