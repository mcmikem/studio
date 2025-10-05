'use client';

import {
  BookOpen,
  Calculator,
  ClipboardList,
  FileText,
  HeartHandshake,
  LayoutGrid,
  Sparkles,
  Users,
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
import Image from 'next/image';

const OmutoLogo = () => (
    <div className="flex items-center gap-2" data-ai-hint="logo">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <HeartHandshake className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-headline text-lg font-bold">Omuto Central</span>
    </div>
);


export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <SidebarHeader>
        <OmutoLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" legacyBehavior passHref>
              <SidebarMenuButton
                isActive={isActive('/')}
                tooltip="Dashboard"
              >
                <LayoutGrid />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel>Planning</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/plan" legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={isActive('/plan')}
                  tooltip="October 2025 Plan"
                >
                  <ClipboardList />
                  <span>October 2025 Plan</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/templates" legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={isActive('/templates')}
                  tooltip="Form Templates"
                >
                  <BookOpen />
                  <span>Form Templates</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/roi-calculator" legacyBehavior passHref>
                    <SidebarMenuButton isActive={isActive('/roi-calculator')} tooltip="ROI Calculator">
                        <Calculator />
                        <span>ROI Calculator</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/impact-story" legacyBehavior passHref>
                    <SidebarMenuButton isActive={isActive('/impact-story')} tooltip="Impact Story Generator">
                        <Sparkles />
                        <span>Impact Story Generator</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Reporting</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/reports" legacyBehavior passHref>
                    <SidebarMenuButton isActive={isActive('/reports')} tooltip="Reports">
                        <FileText />
                        <span>Reports</span>
                    </SidebarMenuButton>
                </Link>
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
