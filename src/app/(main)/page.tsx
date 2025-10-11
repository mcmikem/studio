'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { DefaultDashboard } from '@/components/dashboard/default-dashboard';
import { ExecutiveDashboard } from '@/components/dashboard/executive-dashboard';
import { ProgramManagerDashboard } from '@/components/dashboard/program-manager-dashboard';
import { FieldStaffDashboard } from '@/components/dashboard/field-staff-dashboard';
import { MediaFinanceDashboard } from '@/components/dashboard/media-finance-dashboard';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Program, Partnership, Expense, Task, KeyResult, Checkout, ImpactMetric, Activity } from '@/lib/types';

const roleToDashboard: { [key: string]: React.FC<any> } = {
  'Executive Director': ExecutiveDashboard,
  'Programs & Partnerships Manager': ProgramManagerDashboard,
  'Operations & Field Manager': FieldStaffDashboard,
  'Field Coordinator': FieldStaffDashboard,
  'Media & Communications Lead': MediaFinanceDashboard,
  'Resource Mobilization Lead': ProgramManagerDashboard,
  'Administrator': ExecutiveDashboard,
  'default': DefaultDashboard,
};

export default function DashboardPage() {
  const { user } = useUser();
  const { profile, isLoading: isLoadingProfile } = useUserProfile(user);
  const firestore = useFirestore();

  // --- Centralized Data Fetching ---
  const programsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'programs'), orderBy('deadline')) : null, [firestore]);
  const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);

  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts, isLoading: isLoadingCheckouts } = useCollection<Checkout>(checkoutsQuery);

  const metricsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'impact-metrics')) : null, [firestore]);
  const { data: metrics, isLoading: isLoadingMetrics } = useCollection<ImpactMetric>(metricsQuery);
  
  const activitiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'activities')) : null, [firestore]);
  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);

  const pendingExpensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), where('status', 'in', ['Pending', 'Approved']), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: pendingExpenses, isLoading: isLoadingExpenses } = useCollection<Expense>(pendingExpensesQuery);

  // Combine all loading states
  const isDataLoading = isLoadingProfile || isLoadingPrograms || isLoadingCheckouts || isLoadingMetrics || isLoadingActivities || isLoadingExpenses;

  if (isDataLoading) {
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
  
  // Pass all fetched data down to the specific dashboard component
  const dashboardProps = {
    profile,
    programs,
    checkouts,
    metrics,
    activities,
    pendingExpenses,
  };

  return <DashboardComponent {...dashboardProps} />;
}
