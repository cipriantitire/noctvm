'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import UserTable from '@/components/dashboard/UserTable';
import { withAuth } from '@/components/hoc/withAuth';

function UsersDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <header>
          <h1 className="text-4xl font-heading font-extrabold text-white mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            User Ecosystem
          </h1>
          <p className="text-noctvm-silver font-medium">
            Monitor activity, manage permissions, and certify authentic profiles.
          </p>
        </header>
        
        <UserTable />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(UsersDashboard, { requireAdmin: true });
