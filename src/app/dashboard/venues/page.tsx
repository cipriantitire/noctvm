'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import VenueManager from '@/components/dashboard/VenueManager';
import { withAuth } from '@/components/hoc/withAuth';

function VenuesDashboard() {
  return (
    <DashboardLayout>
      <VenueManager />
    </DashboardLayout>
  );
}

export default withAuth(VenuesDashboard, { requireOwner: true });
