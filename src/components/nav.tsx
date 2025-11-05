

'use client';

import {
  ClipboardList,
  Home,
  Sparkles,
  Briefcase,
  AreaChart,
  Bell,
  User as UserIcon,
  Handshake,
  ClipboardEdit,
  FileText,
  Wand,
  Rss,
  CalendarCheck,
  LogIn,
  Calendar as CalendarIcon,
  ListChecks,
  Video,
  DollarSign,
  Box,
  BarChart3,
  Wallet,
  LayoutDashboard,
  Users,
  CheckCircle,
  TrendingUp,
  Receipt,
  FileSignature,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { Separator } from './ui/separator';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import Image from 'next/image';


const OmutoLogo = () => (
    <div className="flex items-center gap-2" data-ai-hint="logo">
        <Image src="/logo.svg" alt="Omuto Foundation Logo" width={32} height={32} />
        <span className="font-headline text-lg font-bold">Omuto Central</span>
    </div>
);

const navConfig = {
  home: [
    { href: '/chat', icon: Sparkles, label: 'AI Coach' },
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/plan', icon: FileSignature, label: 'Operational Plan' },
  ],
  myDay: [
     { href: '/daily-plan', icon: Sparkles, label: 'AI Daily Planner' },
     { href: '/workplan', icon: CalendarCheck, label: 'My Weekly Plan' },
     { href: '/profile?tab=tasks', icon: CheckCircle, label: 'My Tasks' },
     { href: '/my-finances', icon: Wallet, label: 'My Finances' },
  ],
  teamHub: [
    { href: '/team-space', icon: Users, label: 'Team Space' },
    { href: '/checkins', icon: LogIn, label: 'Check-in Stream' },
    { href: '/stream', icon: Rss, label: 'Check-out Stream' },
    { href: '/calendar', icon: CalendarIcon, label: 'Team Calendar' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
  ],
  dataReporting: [
     { href: '/forms', icon: ClipboardEdit, label: 'Forms Hub' },
     { href: '/activity-log', icon: AreaChart, label: 'Activity Log' },
     { href: '/reports', icon: BarChart3, label: 'M&E Hub' },
     { href: '/record-testimony', icon: Video, label: 'Record Testimony' },
     { href: '/testimonies', icon: FileText, label: 'Testimony Library' },
  ],
  management: [
    { href: '/management/programs', icon: Briefcase, label: 'Programs' },
    { href: '/management/projects', icon: Briefcase, label: 'Projects' },
    { href: '/management/partnerships', icon: Handshake, label: 'Partnerships' },
    { href: '/management/operational-plan', icon: FileSignature, label: 'Operational Plan', roles: ['Executive Director', 'Programs & Partnerships Manager'] },
    { href: '/management/finance', icon: DollarSign, label: 'Finance', roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator'] },
    { href: '/management/expenses', icon: Receipt, label: 'Expenses', roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator'] },
    { href: '/management/metrics', icon: TrendingUp, label: 'Metrics (KPIs)' },
    { href: '/management/workplans', icon: CalendarCheck, label: 'Team Workplans' },
    { href: '/management/equipment', icon: Box, label: 'Equipment' },
    { href: '/management/templates', icon: ListChecks, label: 'Templates' },
    { href: '/management/users', icon: UserIcon, label: 'User Roles' },
  ],
};

const roleNavConfig: { [key: string]: (keyof typeof navConfig)[] } = {
  'Administrator': ['home', 'myDay', 'teamHub', 'dataReporting', 'management'],
  'Executive Director': ['home', 'myDay', 'teamHub', 'dataReporting', 'management'],
  'Programs & Partnerships Manager': ['home', 'myDay', 'teamHub', 'dataReporting', 'management'],
  'Resource Mobilization Lead': ['home', 'myDay', 'teamHub', 'dataReporting', 'management'],
  'Operations & Field Manager': ['home', 'myDay', 'teamHub', 'dataReporting', 'management'],
  'Media & Finance Lead': ['home', 'myDay', 'teamHub', 'dataReporting', 'management'],
  'Media & Communications Lead': ['home', 'myDay', 'teamHub', 'dataReporting', 'management'],
  'Field Coordinator': ['home', 'myDay', 'teamHub', 'dataReporting'],
  'Intern': ['home', 'myDay', 'teamHub', 'dataReporting'],
  'Volunteer': ['home', 'myDay', 'teamHub', 'dataReporting'],
  'default': ['home', 'myDay', 'teamHub', 'dataReporting'],
};

const roleSpecificNav: Record<string, { href: string; icon: React.ElementType; label: string }[]> = {
  'Media & Finance Lead': [
    { href: '/management/finance', icon: DollarSign, label: 'Financial Ledger' },
    { href: '/management/expenses', icon: Receipt, label: 'Expense Approval' },
  ],
  'Media & Communications Lead': [
    { href: '/management/finance', icon: DollarSign, label: 'Financial Ledger' },
    { href: '/management/expenses', icon: Receipt, label: 'Expense Approval' },
  ],
  'Programs & Partnerships Manager': [
    { href: '/management/programs', icon: Briefcase, label: 'Program Tracker' },
    { href: '/management/partnerships', icon: Handshake, label: 'Partnership Pipeline' },
  ],
   'Executive Director': [
    { href: '/management/users', icon: Users, label: 'User Management' },
    { href: '/reports', icon: BarChart3, label: 'M&E Hub' },
  ],
};


export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile: realProfile, isLoading: isProfileLoading } = useUserProfile(user);
  const { isMobile, setOpenMobile } = useSidebar();
  const { viewAsRole } = useViewAs();
  
  if (isProfileLoading || !realProfile) {
    return (
        <>
            <SidebarHeader>
                <OmutoLogo />
            </SidebarHeader>
            <SidebarContent>
                 <div className="flex flex-col gap-4 p-2">
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                    <Separator className="my-2" />
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                </div>
            </SidebarContent>
        </>
    )
  }

  const effectiveRole = viewAsRole || realProfile?.role || 'default';


  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/chat' && pathname === '/chat') return true;
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && path !== '/chat' && pathname.startsWith(path)) return true;
    return false;
  }
  
  const userRole = effectiveRole as keyof typeof roleNavConfig;
  const allowedSections = roleNavConfig[userRole] || roleNavConfig['default'];
  const specificNavItems = roleSpecificNav[userRole] || [];

  const renderNavSection = (sectionName: keyof typeof navConfig, title: string) => {
    if (!allowedSections.includes(sectionName)) return null;
    
    let navItems = navConfig[sectionName];

    if (sectionName === 'management') {
      navItems = navItems.filter(item => {
        if (!item.roles) return true; // if no roles are specified, it's public for management
        return item.roles.includes(userRole);
      });
    }

    if (!navItems || navItems.length === 0) return null;

    return (
      <SidebarGroup data-mobile={isMobile}>
        <SidebarGroupLabel data-mobile={isMobile}>{title}</SidebarGroupLabel>
        <SidebarMenu>
          {navItems.map(item => (
             <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                href={item.href}
                isActive={isActive(item.href)}
                tooltip={item.label}
                onClick={handleLinkClick}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  };

  return (
    <>
      <SidebarHeader>
        <OmutoLogo />
      </SidebarHeader>
      <SidebarContent data-mobile={isMobile}>
        {renderNavSection('home', 'Home')}
        
        {specificNavItems.length > 0 && (
          <SidebarGroup data-mobile={isMobile}>
            <SidebarGroupLabel data-mobile={isMobile}>My Workspace</SidebarGroupLabel>
            <SidebarMenu>
              {specificNavItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    href={item.href}
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    onClick={handleLinkClick}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {renderNavSection('myDay', 'My Day')}
        {renderNavSection('teamHub', 'Team Hub')}
        {renderNavSection('dataReporting', 'Data & Reporting')}
        {renderNavSection('management', 'Management')}
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
        <div className="p-2 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Omuto Foundation
        </div>
      </SidebarFooter>
    </>
  );
}
