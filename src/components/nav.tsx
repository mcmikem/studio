'use client';

import {
  ClipboardList,
  Home,
  Sparkles,
  Briefcase,
  AreaChart,
  MessageSquare,
  Bell,
  User as UserIcon,
  Handshake,
  ClipboardEdit,
  FileText,
  Wand,
  Rss,
  CalendarCheck,
  Newspaper,
  CalendarClock,
  LogIn,
  Megaphone,
  Calendar as CalendarIcon,
  ListChecks,
  Video,
  DollarSign,
  Box,
  BarChart3,
  Wallet,
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
  all: [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/profile', icon: UserIcon, label: 'My Profile' },
  ],
  field: [
    { href: '/checkins', icon: LogIn, label: 'Check-in Stream' },
    { href: '/stream', icon: Rss, label: 'Check-out Stream' },
    { href: '/forms', icon: ClipboardEdit, label: 'Forms' },
    { href: '/my-finances', icon: Wallet, label: 'My Finances' },
    { href: '/activity-log', icon: AreaChart, label: 'Activity Log' },
  ],
  planning: [
     { href: '/calendar', icon: CalendarIcon, label: 'Team Calendar' },
     { href: '/workplan', icon: CalendarCheck, label: 'Weekly Workplan' },
     { href: '/daily-plan', icon: Sparkles, label: 'AI Daily Planner' },
     { href: '/plan', icon: ClipboardList, label: 'Operational Plan' },
  ],
  management: [
    { href: '/management/programs', icon: Briefcase, label: 'Management' },
    { href: '/management/finance', icon: DollarSign, label: 'Finance' },
    { href: '/management/users', icon: UserIcon, label: 'Users' },
  ],
  communication: [
    { href: '/reports', icon: BarChart3, label: 'M&E Hub' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/impact-story', icon: Wand, label: 'Story Generator' },
    { href: '/testimonies', icon: Video, label: 'Testimonies' },
    { href: '/chat', icon: MessageSquare, label: 'Chat & Team Space' },
  ]
};

const roleNavConfig = {
  'Administrator': ['all', 'field', 'planning', 'management', 'communication'],
  'Executive Director': ['all', 'field', 'planning', 'management', 'communication'],
  'Programs & Partnerships Manager': ['all', 'field', 'planning', 'management', 'communication'],
  'Resource Mobilization Lead': ['all', 'planning', 'management', 'communication'],
  'Operations & Field Manager': ['all', 'field', 'planning', 'management'],
  'Field Coordinator': ['all', 'field', 'planning'],
  'Media & Communications Lead': ['all', 'field', 'communication'],
  'default': ['all', 'field', 'planning'],
};


export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile: realProfile } = useUserProfile(user);
  const { isMobile, setOpenMobile } = useSidebar();
  const { viewAsRole } = useViewAs();
  
  const effectiveRole = viewAsRole || realProfile?.role;


  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === path;
    // For management, we need to check if the path starts with /management
    if (path.startsWith('/management')) return pathname.startsWith('/management');
    if (path.startsWith('/reports')) return pathname.startsWith('/reports');
    return pathname.startsWith(path);
  }
  
  const userRole = effectiveRole as keyof typeof roleNavConfig || 'default';
  const allowedSections = roleNavConfig[userRole] || roleNavConfig['default'];

  const renderNavSection = (sectionName: keyof typeof navConfig, title: string) => {
    if (!allowedSections.includes(sectionName)) return null;

    return (
      <SidebarGroup data-mobile={isMobile}>
        <SidebarGroupLabel data-mobile={isMobile}>{title}</SidebarGroupLabel>
        <SidebarMenu>
          {navConfig[sectionName].map(item => (
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
        {renderNavSection('all', 'Home')}
        {renderNavSection('planning', 'Planning')}
        {renderNavSection('field', 'Execution')}
        {renderNavSection('management', 'Oversight')}
        {renderNavSection('communication', 'Intelligence')}
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
