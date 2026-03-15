'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import EventManager from '@/components/dashboard/EventManager';
import { withAuth } from '@/components/hoc/withAuth';

function EventsDashboard() {
  return (
    <DashboardLayout>
      <EventManager />
    </DashboardLayout>
  );
}

export default withAuth(EventsDashboard, { requireOwner: true });
