'use client';

import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { ExecutiveDashboard } from '@/components/dashboard/executive-dashboard';
import { ProgramManagerDashboard } from '@/components/dashboard/program-manager-dashboard';
import { FieldStaffDashboard } from '@/components/dashboard/field-staff-dashboard';
import { DefaultDashboard } from '@/components/dashboard/default-dashboard';
import { MediaFinanceDashboard } from '@/components/dashboard/media-finance-dashboard';


export default function DashboardPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If there is no user, AuthProvider will redirect. If there is a user but no profile,
  // it's an error state (or a brand new user whose doc hasn't replicated).
  // The DefaultDashboard can serve as a safe fallback.
  if (!profile) {
    const fallbackProfile = { 
      id: user?.uid || 'guest', 
      name: user?.displayName || 'New User', 
      email: user?.email || '', 
      role: 'Staff' 
    };
    return <DefaultDashboard profile={fallbackProfile} />;
  }

  const renderDashboardByRole = () => {
    const userRole = profile.role; 

    switch (userRole) {
      case 'Executive Director':
        return <ExecutiveDashboard profile={profile} />;
      case 'Programs & Partnerships Manager':
        return <ProgramManagerDashboard profile={profile} />;
      case 'Operations & Field Manager':
      case 'Field Coordinator':
        return <FieldStaffDashboard profile={profile} />;
      case 'Media & Communications Lead':
         return <MediaFinanceDashboard profile={profile} />;
      default:
        return <DefaultDashboard profile={profile} />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {renderDashboardByRole()}
      <footer className="text-center text-xs text-muted-foreground mt-4">
        “Omuto Central – Empowering Youth, Transforming Communities.” ©{' '}
        {new Date().getFullYear()} Omuto Foundation | Built for Impact, by
        Youth.
      </footer>
    </div>
  );
}

    