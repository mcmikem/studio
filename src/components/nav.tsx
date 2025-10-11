
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

const OmutoLogo = () => (
    <div className="flex items-center gap-2" data-ai-hint="logo">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
             <svg
                className="h-6 w-6"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M42.5833 26.0416C43.7083 22.8333 41.9167 20.3333 38.0833 20.25C30.5 20.0833 24.5 27.5 22.25 33.5C20.5 38.1666 21.0833 42.6666 22.5 46.5C24.1667 50.8333 26.5 54.5833 29 57.25C31.5 59.9166 34.1667 61.75 36.5 63.5C40.75 66.5833 44.5 69.5833 44.5 74.5833C44.5 78.5833 41.5 81.6666 38.4167 83.5833C35.9167 85.1666 33.0833 86.25 30.25 86.9166C26.5 87.75 22.6667 88.0833 18.9167 88.0833C17.0833 88.0833 15.3333 87.9166 13.5833 87.5833C19.5 89.9166 26.5 91.25 33.75 91.25C55.8333 91.25 73.75 73.3333 73.75 51.25C73.75 29.1666 55.8333 11.25 33.75 11.25C28.5833 11.25 23.8333 12.4166 19.75 14.5C25.4167 15.4166 29.4167 18.0833 32.5 21.4166C32.5 21.4166 35.0833 21.4166 38.5 22.5833C40.0833 23.1666 41.6667 24.0833 42.5833 26.0416Z" fill="#FFFFFF"/>
                <path d="M65.5 51.5C65.5 60.8873 57.8873 68.5 48.5 68.5C39.1127 68.5 31.5 60.8873 31.5 51.5C31.5 42.1127 39.1127 34.5 48.5 34.5C57.8873 34.5 65.5 42.1127 65.5 51.5Z" fill="#FF6B35"/>
              </svg>
        </div>
        <span className="font-headline text-lg font-bold">Omuto Central</span>
    </div>
);


export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === path;
    return pathname.startsWith(path);
  }

  return (
    <>
      <SidebarHeader>
        <OmutoLogo />
      </SidebarHeader>
      <SidebarContent data-mobile={isMobile}>
        <SidebarGroup data-mobile={isMobile}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/"
                isActive={pathname === '/'}
                tooltip="Dashboard"
                onClick={handleLinkClick}
              >
                <Home />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                href="/checkins"
                isActive={isActive('/checkins')}
                tooltip="Check-in Stream"
                onClick={handleLinkClick}
              >
                <LogIn />
                <span>Check-in Stream</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/stream"
                isActive={isActive('/stream')}
                tooltip="Check-out Stream"
                onClick={handleLinkClick}
              >
                <Rss />
                <span>Check-out Stream</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup data-mobile={isMobile}>
          <SidebarGroupLabel data-mobile={isMobile}>Planning</SidebarGroupLabel>
           <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton
                        href="/calendar"
                        isActive={isActive('/calendar')}
                        tooltip="Team Calendar"
                        onClick={handleLinkClick}
                    >
                        <CalendarIcon />
                        <span>Team Calendar</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                    href="/workplan"
                    isActive={isActive('/workplan')}
                    tooltip="Weekly Workplan"
                    onClick={handleLinkClick}
                    >
                    <CalendarCheck />
                    <span>Weekly Workplan</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  href="/daily-plan"
                  isActive={isActive('/daily-plan')}
                  tooltip="Daily Planner"
                  onClick={handleLinkClick}
                >
                  <Sparkles />
                  <span>AI Daily Planner</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton
                  href="/plan"
                  isActive={isActive('/plan')}
                  tooltip="October 2025 Plan"
                  onClick={handleLinkClick}
                >
                  <ClipboardList />
                  <span>Operational Plan</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup data-mobile={isMobile}>
          <SidebarGroupLabel data-mobile={isMobile}>Execution</SidebarGroupLabel>
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton
                  href="/forms"
                  isActive={isActive('/forms')}
                  tooltip="Forms Hub"
                  onClick={handleLinkClick}
                >
                  <ClipboardEdit />
                  <span>Forms</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                  href="/activity-log"
                  isActive={isActive('/activity-log')}
                  tooltip="Activity Log (ROI)"
                  onClick={handleLinkClick}
                >
                  <AreaChart />
                  <span>Activity Log (ROI)</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                  href="/checklists"
                  isActive={isActive('/checklists')}
                  tooltip="Checklists"
                  onClick={handleLinkClick}
                >
                  <ListChecks />
                  <span>Checklists</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                  href="/management/programs"
                  isActive={isActive('/management')}
                  tooltip="Management"
                  onClick={handleLinkClick}
                >
                  <Briefcase />
                  <span>Management</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/resources" isActive={isActive('/resources')} tooltip="Resource Mobilization" onClick={handleLinkClick}>
                    <Handshake />
                    <span>Resources</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup data-mobile={isMobile}>
            <SidebarGroupLabel data-mobile={isMobile}>AI & Personal</SidebarGroupLabel>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/reporting" isActive={isActive('/reporting')} tooltip="Reporting" onClick={handleLinkClick}>
                        <Newspaper />
                        <span>Reporting</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/reports" isActive={isActive('/reports')} tooltip="Analysis" onClick={handleLinkClick}>
                        <FileText />
                        <span>Analysis</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/notifications" isActive={isActive('/notifications')} tooltip="Notifications" onClick={handleLinkClick}>
                        <Bell />
                        <span>Notifications</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/profile" isActive={isActive('/profile')} tooltip="My Profile" onClick={handleLinkClick}>
                        <User />
                        <span>My Profile</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/impact-story" isActive={isActive('/impact-story')} tooltip="Impact Story Generator" onClick={handleLinkClick}>
                        <Wand />
                        <span>Story Generator</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/chat" isActive={isActive('/chat')} tooltip="Team Chat" onClick={handleLinkClick}>
                        <MessageSquare />
                        <span>Chat & Team Space</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>

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
