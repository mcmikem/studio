
'use client';

import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { useViewAs } from '@/hooks/use-view-as';
import type { User, ImpactMetric } from '@/lib/types';
import { QuickStatsSummary } from '@/components/dashboard/quick-stats-summary';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';


// Define a loading component for dynamic imports
const DashboardLoading = () => (
  <div className="space-y-6 mt-6">
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
  'Operations & Field Manager': ProgramManagerDashboard, // Using Program Manager for now
  'Field Coordinator': FieldStaffDashboard,
  'Media & Communications Lead': MediaFinanceDashboard,
  'Resource Mobilization Lead': ProgramManagerDashboard, // Using Program Manager for now
  'default': DefaultDashboard,
};


export default function DashboardPage() {
  const { user } = useUser();
  const { profile: realProfile, isLoading: isLoadingProfile } = useUserProfile(user);
  const { viewAsRole } = useViewAs();
  const firestore = useFirestore();

  const effectiveRole = viewAsRole || realProfile?.role;

  const profile = viewAsRole ? ({ ...realProfile, role: viewAsRole } as User) : realProfile;

  const metricsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'impact-metrics'), orderBy('createdAt', 'desc'), limit(4)) : null, [firestore]);
  const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);

  if (isLoadingProfile || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!profile) {
    // This can happen briefly while the user profile is being created for the first time.
     return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Finalizing account setup...</p>
      </div>
    );
  }

  const DashboardComponent = roleToDashboard[effectiveRole as string] || roleToDashboard['default'];
  
  return (
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={profile} />
        <QuickStatsSummary metrics={metrics} />
        <div className="flex-1">
            <DashboardComponent profile={profile} />
        </div>
    </div>
  );
}
