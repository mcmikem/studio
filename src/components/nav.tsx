
'use client';

import {
  ClipboardList,
  Home,
  Sparkles,
  Briefcase,
  AreaChart,
  MessageSquare,
  Bell,
  User,
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

const OmutoLogo = () => (
    <div className="flex items-center gap-2" data-ai-hint="logo">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
             <svg
                className="h-6 w-6"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M42.5833 26.0416C43.7083 22.8333 41.9167 20.3333 38.0833 20.25C30.5 20.0833 24.5 27.5 22.25 33.5C20.5 38.1666 21.0833 42.6666 22.5 46.5C24.1667 50.8333 26.5 54.5833 29 57.25C31.5 59.9166 34.1667 61.75 36.5 63.5C40.75 66.5833 44.5 69.5833 44.5 74.5833C44.5 78.5833 41.5 81.6666 38.4167 83.5833C35.9167 85.1666 33.0833 86.25 30.25 86.9166C26.5 87.75 22.6667 88.0833 18.9167 88.0833C17.0833 88.0833 15.3333 87.9166 13.5833 87.5833C19.5 89.9166 26.5 91.25 33.75 91.25C55.8333 91.25 73.75 73.3333 73.75 51.25C73.75 29.1666 55.8333 11.25 33.75 11.25C28.5833 11.25 23.8333 12.4166 19.75 14.5C25.4167 15.4166 29.4167 18.0833 32.5 21.4166C32.5 21.4166 35.0833 21.4166 38.5 22.5833C40.0833 23.1666 41.6667 24.0833 42.5833 26.0416Z" fill="currentColor"/>
                <path d="M65.5 51.5C65.5 60.8873 57.8873 68.5 48.5 68.5C39.1127 68.5 31.5 60.8873 31.5 51.5C31.5 42.1127 39.1127 34.5 48.5 34.5C57.8873 34.5 65.5 42.1127 65.5 51.5Z" fill="currentColor"/>
              </svg>
        </div>
        <span className="font-headline text-lg font-bold">Omuto Central</span>
    </div>
);

const navConfig = {
  all: [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/profile', icon: User, label: 'My Profile' },
  ],
  field: [
    { href: '/checkins', icon: LogIn, label: 'Check-in Stream' },
    { href: '/stream', icon: Rss, label: 'Check-out Stream' },
    { href: '/forms', icon: ClipboardEdit, label: 'Forms' },
    { href: '/checklists', icon: ListChecks, label: 'Checklists' },
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
    { href: '/resources', icon: Handshake, label: 'Resources' },
  ],
  communication: [
    { href: '/reports', icon: FileText, label: 'Analysis' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/impact-story', icon: Wand, label: 'Story Generator' },
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
  'default': ['all'],
};


export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === path;
    // For management, we need to check if the path starts with /management
    if (path === '/management/programs') return pathname.startsWith('/management');
    return pathname.startsWith(path);
  }
  
  const userRole = profile?.role as keyof typeof roleNavConfig || 'default';
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
