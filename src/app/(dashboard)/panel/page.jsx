import React from 'react';
import DashboardOverview from '@/component/staff/pages/Overview';
import { isStaffLogin } from '@/lib/auth/staff';

export const metadata = {
  title: 'Management Overview | Disibin Studio',
  description: 'Administrative overview workspace for Disibin operational management and staff members.',
};

const DashboardPage = async () => {
  const auth = await isStaffLogin();
  const staffData = auth?.success ? auth.data : null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardOverview staffData={staffData} />
    </div>
  );
};

export default DashboardPage;
