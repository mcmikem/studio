
'use client';

import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { DefaultDashboard } from '@/components/dashboard/default-dashboard';
import { ExecutiveDashboard } from '@/components/dashboard/executive-dashboard';
import { ProgramManagerDashboard } from '@/components/dashboard/program-manager-dashboard';
import { FieldStaffDashboard } from '@/components/dashboard/field-staff-dashboard';
import { MediaFinanceDashboard } from '@/components/dashboard/media-finance-dashboard';

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
  const { profile, isLoading } = useUserProfile(user);

  if (isLoading || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const DashboardComponent = roleToDashboard[profile.role] || roleToDashboard['default'];

  return <DashboardComponent profile={profile} />;
}
