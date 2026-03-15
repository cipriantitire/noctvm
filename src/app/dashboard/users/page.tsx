'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withAuth } from '@/components/hoc/withAuth';

function UsersDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-bold">User Management</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-noctvm-silver">
          User management module coming soon.
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(UsersDashboard, { requireAdmin: true });
