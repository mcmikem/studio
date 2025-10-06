'use client';

import {
  Calculator,
  ClipboardList,
  FileText,
  Home,
  Sparkles,
  Briefcase,
  AreaChart,
  MessageSquare,
  Bell,
  User,
  Truck,
  Banknote,
  Handshake,
  ClipboardEdit,
  Target,
} from 'lucide-react';
import Link from 'next/link';
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
} from '@/components/ui/sidebar';
import { Separator } from './ui/separator';

const OmutoLogo = () => (
    <div className="flex items-center gap-2" data-ai-hint="logo">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
             <svg
                className="h-6 w-6"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M45.5621 16.6323C41.3473 17.5186 40.8525 21.3323 39.8629 25.146C38.3785 30.7019 36.4026 36.312 36.4026 41.813C36.4026 47.7571 39.3681 53.6469 39.3681 59.8082C39.3681 65.698 34.9317 71.9793 30.7169 75.8473C27.5919 78.6813 23.3771 80.3953 19.1623 81.2816C23.8719 83.0499 28.5815 84.4267 33.7859 84.4267C55.8839 84.4267 73.7121 66.5985 73.7121 44.5005C73.7121 22.4025 55.8839 4.57428 33.7859 4.57428C28.5815 4.57428 23.8719 5.95111 19.1623 8.71841C24.3667 9.87611 27.5919 12.0494 31.2117 15.0153C31.7065 15.0153 32.2013 15.0153 32.6961 14.961C37.4057 14.4178 41.3473 14.8093 45.5621 16.6323Z"
                  fill="currentColor"
                />
                <path
                  d="M59.3908 44.5005C59.3908 51.5283 53.8051 57.114 46.7773 57.114C39.7495 57.114 34.1638 51.5283 34.1638 44.5005C34.1638 37.4727 39.7495 31.887 46.7773 31.887C53.8051 31.887 59.3908 37.4727 59.3908 44.5005Z"
                  stroke="#FF6B35"
                  strokeWidth="3"
                />
                 <rect x="44.5" y="27" width="4.5" height="7" fill="#FF6B35" />
                 <rect x="44.5" y="62" width="4.5" height="7" fill="#FF6B35" />
                 <rect x="62" y="44.5" width="7" height="4.5" transform="rotate(90 62 44.5)" fill="#FF6B35" />
                 <rect x="27" y="44.5" width="7" height="4.5" transform="rotate(90 27 44.5)" fill="#FF6B35" />
                 <rect x="34.8" y="32" width="4" height="6" transform="rotate(45 34.8 32)" fill="#FF6B35" />
                 <rect x="58" y="55.2" width="4" height="6" transform="rotate(45 58 55.2)" fill="#FF6B35" />
                 <rect x="32" y="55.2" width="6" height="4" transform="rotate(-45 32 55.2)" fill="#FF6B35" />
                 <rect x="55.2" y="32" width="6" height="4" transform="rotate(-45 55.2 32)" fill="#FF6B35" />
                 <rect x="38" y="28.2" width="4.5" height="7" transform="rotate(22.5 38 28.2)" fill="#FF6B35" />
                 <rect x="52.2" y="60.8" width="4.5" height="7" transform="rotate(22.5 52.2 60.8)" fill="#FF6B35" />
                 <rect x="28.2" y="52.2" width="7" height="4.5" transform="rotate(-22.5 28.2 52.2)" fill="#FF6B35" />
                 <rect x="60.8" y="38" width="7" height="4.5" transform="rotate(-22.5 60.8 38)" fill="#FF6B35" />
                 <rect x="30" y="37" width="6" height="4.5" transform="rotate(67.5 30 37)" fill="#FF6B35" />
                 <rect x="56" y="59" width="6" height="4.5" transform="rotate(67.5 56 59)" fill="#FF6B35" />
                 <rect x="37" y="59" width="4.5" height="6" transform="rotate(-67.5 37 59)" fill="#FF6B35" />
                 <rect x="59" y="30" width="4.5" height="6" transform="rotate(-67.5 59 30)" fill="#FF6B35" />
              </svg>
        </div>
        <span className="font-headline text-lg font-bold">Omuto Central</span>
    </div>
);


export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <>
      <SidebarHeader>
        <OmutoLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/'}
              tooltip="Dashboard"
            >
              <Link href="/">
                <Home />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarGroup>
          <SidebarGroupLabel>Core Modules</SidebarGroupLabel>
           <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/management')}
                  tooltip="Management"
                >
                  <Link href="/management/programs">
                    <Briefcase />
                    <span>Management</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/media-finance')}
                  tooltip="Media & Finance"
                >
                  <Link href="/media-finance">
                    <Banknote />
                    <span>Media & Finance</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/resources')}
                  tooltip="Resource Mobilization"
                >
                  <Link href="/resources">
                    <Handshake />
                    <span>Resource Mobilization</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/forms')}
                  tooltip="Forms Hub"
                >
                  <Link href="/forms">
                    <ClipboardEdit />
                    <span>Forms</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/plan')}
                  tooltip="October 2025 Plan"
                >
                  <Link href="/plan">
                    <ClipboardList />
                    <span>Operational Plan</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/activity-log')}
                  tooltip="Activity Log"
                >
                  <Link href="/activity-log">
                    <AreaChart />
                    <span>Activity Log</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/impact-story')} tooltip="Impact Story Generator">
                    <Link href="/impact-story">
                        <Sparkles />
                        <span>Story Generator</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/reports')}
                  tooltip="Reports"
                >
                  <Link href="/reports">
                    <FileText />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
            <SidebarGroupLabel>General</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive('/chat')} tooltip="Team Chat">
                        <Link href="/chat">
                            <MessageSquare />
                            <span>Chat & Team Space</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive('/notifications')} tooltip="Notifications">
                        <Link href="/notifications">
                            <Bell />
                            <span>Notifications</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive('/profile')} tooltip="My Profile">
                        <Link href="/profile">
                            <User />
                            <span>My Profile</span>
                        </Link>
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
