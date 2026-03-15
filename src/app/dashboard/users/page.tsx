'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import UserTable from '@/components/dashboard/UserTable';
import { withAuth } from '@/components/hoc/withAuth';

function UsersDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">

        
        <UserTable />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(UsersDashboard, { requireAdmin: true });
