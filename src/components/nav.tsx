
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
  LifeBuoy,
  Heart,
  Swords,
  Droplets,
  Store,
  Wind,
  Trophy,
  Bug,
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
  workspace: [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/chat', icon: Sparkles, label: 'AI Coach' },
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
  meal: [
      { href: '/meal', icon: BarChart3, label: 'MEAL Hub' },
  ],
  talents: [
       { href: '/talents', icon: Trophy, label: 'Talents Hub' },
  ],
  enterprises: [
        { href: '/essentials', icon: Store, label: 'Omuto Essentials' },
        { href: '/pulse', icon: Wind, label: 'Omuto Pulse' },
  ],
  reports: [
     { href: '/reports', icon: BarChart3, label: 'Reports Hub' },
     { href: '/activity-log', icon: AreaChart, label: 'Activity Log' },
     { href: '/testimonies', icon: FileText, label: 'Testimony Library' },
  ],
  management: [
    { href: '/management/programs', icon: Briefcase, label: 'Programs' },
    { href: '/management/projects', icon: Briefcase, label: 'Projects' },
    { href: '/management/partnerships', icon: Handshake, label: 'Partnerships' },
    { href: '/management/resources', icon: Handshake, label: 'Resources' },
    { href: '/management/operational-plan', icon: FileSignature, label: 'Operational Plan', roles: ['Executive Director', 'Programs & Partnerships Manager', 'Administrator'] },
    { href: '/management/finance', icon: DollarSign, label: 'Finance', roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator'] },
    { href: '/management/expenses', icon: Receipt, label: 'Expenses', roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator', 'Programs & Partnerships Manager', 'Operations & Field Manager'] },
    { href: '/management/metrics', icon: TrendingUp, label: 'Metrics (KPIs)' },
    { href: '/management/workplans', icon: CalendarCheck, label: 'Team Workplans' },
    { href: '/management/equipment', icon: Box, label: 'Equipment' },
    { href: '/management/templates', icon: ListChecks, label: 'Templates' },
    { href: '/management/users', icon: UserIcon, label: 'User Roles' },
  ],
  system: [
    { href: '/help', icon: LifeBuoy, label: 'Help & Support' },
    { href: '/forms/system/feedback', icon: Bug, label: 'Feedback' },
  ]
};

const roleNavConfig: { [key: string]: (keyof typeof navConfig)[] } = {
  'Administrator': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports', 'management', 'system'],
  'Executive Director': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports', 'management', 'system'],
  'Programs & Partnerships Manager': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports', 'management'],
  'Resource Mobilization Lead': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports', 'management'],
  'Operations & Field Manager': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports', 'management'],
  'Media & Finance Lead': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports', 'management'],
  'Media & Communications Lead': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports', 'management'],
  'Field Coordinator': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports'],
  'Intern': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports'],
  'Volunteer': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports'],
  'default': ['workspace', 'teamHub', 'meal', 'talents', 'enterprises', 'reports'],
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
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  }
  
  const userRole = effectiveRole as keyof typeof roleNavConfig;
  const allowedSections = roleNavConfig[userRole] || roleNavConfig['default'];

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
        {renderNavSection('workspace', 'Workspace')}
        {renderNavSection('teamHub', 'Team Hub')}
        {renderNavSection('meal', 'MEAL')}
        {renderNavSection('talents', 'Talents')}
        {renderNavSection('enterprises', 'Enterprises')}
        {renderNavSection('reports', 'Reports & Analytics')}
        {renderNavSection('management', 'Management')}
        <Separator className="my-2" />
        {renderNavSection('system', 'System')}
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
