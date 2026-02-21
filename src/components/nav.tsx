'use client';

import {
  Home,
  Sparkles,
  Briefcase,
  AreaChart,
  Bell,
  LogIn,
  Calendar as CalendarIcon,
  Video,
  BarChart3,
  Wallet,
  LayoutDashboard,
  Users,
  CheckCircle,
  LifeBuoy,
  Heart,
  Swords,
  Droplets,
  Store,
  Wind,
  Trophy,
  Bug,
  Book,
  Goal,
  Zap,
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
    <div className="flex items-center gap-3 px-2 py-6" data-ai-hint="logo">
        <div className="p-1 border-lg border-omuto-navy shadow-comic-sm bg-white rounded-lg">
            <Image src="/logo.svg" alt="Omuto Foundation Logo" width={36} height={36} />
        </div>
        <div className="flex flex-col">
            <span className="font-heading font-black text-xl tracking-tight leading-none text-omuto-navy">OMUTO</span>
            <span className="text-[11px] font-black text-omuto-red tracking-[0.25em] uppercase leading-none mt-1">Central</span>
        </div>
    </div>
);

const navConfig = {
  workspace: [
    { href: '/', icon: LayoutDashboard, label: 'Mission Control' },
    { href: '/management/operational-plan', icon: Goal, label: 'Strategy Map' },
    { href: '/chat', icon: Sparkles, label: 'AI Coach' },
    { href: '/daily-plan', icon: Zap, label: 'Daily Planner' },
    { href: '/workplan', icon: CheckCircle, label: 'Weekly Goals' },
    { href: '/profile?tab=tasks', icon: Bell, label: 'Task List' },
    { href: '/my-finances', icon: Wallet, label: 'Finances' },
  ],
  teamHub: [
    { href: '/team-performance', icon: Trophy, label: 'Impact Stars' },
    { href: '/checkins', icon: LogIn, label: 'Morning Call' },
    { href: '/stream', icon: Wind, label: 'Evening Report' },
    { href: '/calendar', icon: CalendarIcon, label: 'HQ Calendar' },
    { href: '/notifications', icon: Bell, label: 'System Alerts' },
  ],
  meal: [
      { href: '/meal', icon: BarChart3, label: 'Impact Hub' },
  ],
  reports: [
     { href: '/reports', icon: AreaChart, label: 'Field Data' },
     { href: '/testimonies', icon: Video, label: 'Success Stories' },
  ],
  management: [
    { href: '/management', icon: Briefcase, label: 'Ops Desk' },
  ],
  system: [
    { href: '/help', icon: LifeBuoy, label: 'User Manual' },
    { href: '/system/feedback', icon: Bug, label: 'Report Bug' },
  ]
};

const roleNavConfig: { [key: string]: (keyof typeof navConfig)[] } = {
  'Administrator': ['workspace', 'teamHub', 'meal', 'reports', 'management', 'system'],
  'Executive Director': ['workspace', 'teamHub', 'meal', 'reports', 'management', 'system'],
  'Programs & Partnerships Manager': ['workspace', 'teamHub', 'meal', 'reports', 'management'],
  'default': ['workspace', 'teamHub', 'meal', 'reports'],
};


export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile: realProfile, isLoading: isProfileLoading } = useUserProfile(user);
  const { isMobile, setOpenMobile } = useSidebar();
  const { viewAsRole } = useViewAs();
  
  if (isProfileLoading || !realProfile) {
    return (
        <div className="p-6 space-y-6 h-full bg-omuto-cream border-r-lg border-omuto-navy/20">
            <OmutoLogo />
            <SidebarMenuSkeleton showIcon />
            <SidebarMenuSkeleton showIcon />
        </div>
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

    return (
      <SidebarGroup className="px-4">
        <SidebarGroupLabel className="px-3 font-heading font-black text-[10px] uppercase tracking-[0.2em] text-omuto-navy/40 mb-2">{title}</SidebarGroupLabel>
        <SidebarMenu className="gap-1">
          {navItems.map(item => (
             <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                href={item.href}
                isActive={isActive(item.href)}
                onClick={handleLinkClick}
                className={`
                    rounded-lg border-md border-transparent transition-all h-11 px-4
                    ${isActive(item.href) 
                        ? 'bg-omuto-red text-white border-omuto-navy shadow-comic-sm hover:bg-omuto-red hover:text-white' 
                        : 'bg-white text-omuto-navy/70 hover:bg-omuto-cream/50 hover:border-omuto-navy/20'
                    }
                `}
              >
                <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-white' : 'text-omuto-navy'}`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  };

  return (
    <div className="flex flex-col h-full bg-omuto-cream border-r-lg border-omuto-navy/20 halftone-bg">
      <SidebarHeader>
        <OmutoLogo />
      </SidebarHeader>
      <SidebarContent className="no-scrollbar pt-2">
        {renderNavSection('workspace', 'Command Center')}
        <div className="h-5" />
        {renderNavSection('teamHub', 'Network')}
        <div className="h-5" />
        {renderNavSection('meal', 'Impact')}
        <div className="h-5" />
        {renderNavSection('reports', 'Analysis')}
        <div className="h-5" />
        {renderNavSection('management', 'Operations')}
        <Separator className="mx-7 my-5 bg-omuto-navy/10 border-none h-[2px]" />
        {renderNavSection('system', 'Platform')}
      </SidebarContent>
      <SidebarFooter className="p-6 border-t-lg border-omuto-navy/10 bg-white">
        <div className="flex items-center gap-4">
             <div className="p-2 bg-omuto-yellow border-md border-omuto-navy/20 shadow-comic-sm rounded-xl rotate-2">
                <Sparkles className="h-4 w-4 text-omuto-navy" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-tight leading-none text-omuto-navy/50">Core Engine</p>
                <p className="text-sm font-black text-omuto-navy mt-1 uppercase">AI V2.0</p>
            </div>
        </div>
      </SidebarFooter>
    </div>
  );
}
