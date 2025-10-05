'use client';

import {
  Calculator,
  ClipboardList,
  FileText,
  HeartHandshake,
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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartHandshake className="h-5 w-5" />
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
                  tooltip="Programs & Partnerships"
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
                  isActive={isActive('/operations')}
                  tooltip="Operations"
                >
                  <Link href="/operations">
                    <Truck />
                    <span>Operations & Field</span>
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
                <SidebarMenuButton asChild isActive={isActive('/roi-calculator')} tooltip="ROI Calculator">
                    <Link href="/roi-calculator">
                        <Calculator />
                        <span>ROI Calculator</span>
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
