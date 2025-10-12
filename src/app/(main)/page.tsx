
'use client';

import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Define a loading component for dynamic imports
const DashboardLoading = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="relative rounded-xl h-48 -mx-4 -mt-4 lg:-mx-6 lg:-mt-6" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 flex flex-col gap-6">
             <Skeleton className="h-48" />
             <Skeleton className="h-64" />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Skeleton className="h-96" />
        </div>
    </div>
  </div>
);


// Dynamically import each dashboard component
const DefaultDashboard = dynamic(() => import('@/components/dashboard/default-dashboard').then(mod => mod.DefaultDashboard), { loading: () => <DashboardLoading /> });
const AdminDashboard = dynamic(() => import('@/components/dashboard/admin-dashboard').then(mod => mod.AdminDashboard), { loading: () => <DashboardLoading /> });
const ExecutiveDashboard = dynamic(() => import('@/components/dashboard/executive-dashboard').then(mod => mod.ExecutiveDashboard), { loading: () => <DashboardLoading /> });
const ProgramManagerDashboard = dynamic(() => import('@/components/dashboard/program-manager-dashboard').then(mod => mod.ProgramManagerDashboard), { loading: () => <DashboardLoading /> });
const FieldStaffDashboard = dynamic(() => import('@/components/dashboard/field-staff-dashboard').then(mod => mod.FieldStaffDashboard), { loading: () => <DashboardLoading /> });
const MediaFinanceDashboard = dynamic(() => import('@/components/dashboard/media-finance-dashboard').then(mod => mod.MediaFinanceDashboard), { loading: () => <DashboardLoading /> });


const roleToDashboard: { [key: string]: React.FC<any> } = {
  'Administrator': AdminDashboard,
  'Executive Director': ExecutiveDashboard,
  'Programs & Partnerships Manager': ProgramManagerDashboard,
  'Operations & Field Manager': FieldStaffDashboard,
  'Field Coordinator': FieldStaffDashboard,
  'Media & Communications Lead': MediaFinanceDashboard,
  'Resource Mobilization Lead': ProgramManagerDashboard,
  'default': DefaultDashboard,
};


export default function DashboardPage() {
  const { user } = useUser();
  const { profile, isLoading: isLoadingProfile } = useUserProfile(user);

  if (isLoadingProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!profile) {
     return (
      <div className="flex h-full items-center justify-center">
        <p>Could not load user profile.</p>
      </div>
    );
  }

  const DashboardComponent = roleToDashboard[profile.role] || roleToDashboard['default'];
  
  // The specific dashboard component will be responsible for its own data fetching.
  // This prevents loading all data for all roles on a single page.
  return <DashboardComponent profile={profile} />;
}
