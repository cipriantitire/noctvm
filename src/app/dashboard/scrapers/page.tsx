'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ScraperManager from '@/components/dashboard/ScraperManager';
import { withAuth } from '@/components/hoc/withAuth';

function ScrapersDashboard() {
  return (
    <DashboardLayout>
      <ScraperManager />
    </DashboardLayout>
  );
}

export default withAuth(ScrapersDashboard, { requireAdmin: true });
