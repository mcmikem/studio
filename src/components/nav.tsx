
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
  Package,
  ShoppingCart,
  TrendingUp,
  UsersRound,
  GraduationCap,
  Flower2,
  Landmark,
  LogOut,
  History,
  ListChecks,
  Wand2,
  Handshake,
  BookOpen,
  Mic,
  Trees,
  ShieldCheck,
  School,
  Building2,
  Map as MapIcon,
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
        <div className="p-0.5 rounded-xl overflow-hidden shadow-md">
            <Image src="/logo.svg" alt="Omuto Foundation Logo" width={40} height={40} className="rounded-xl" />
        </div>
        <div className="flex flex-col">
            <span className="font-heading font-black text-xl tracking-tight leading-none text-omuto-navy">OMUTO</span>
            <span className="text-[11px] font-black text-omuto-red tracking-[0.25em] uppercase leading-none mt-1">Central</span>
        </div>
    </div>
);

const navConfig = {
  daily: [
    { href: '/', icon: LayoutDashboard, label: 'Mission Control' },
    { href: '/daily-plan', icon: Zap, label: 'Daily Planner' },
    { href: '/workplan', icon: CheckCircle, label: 'Weekly Goals' },
    { href: '/checklists', icon: ListChecks, label: 'SOP Checklists' },
    { href: '/profile?tab=tasks', icon: Bell, label: 'Task List' },
  ],
  forms: [
    { href: '/meal/beneficiary-registration', icon: Users, label: 'Register Beneficiary' },
    { href: '/forms/school', icon: Book, label: 'Register School' },
    { href: '/meal/activity', icon: BarChart3, label: 'Log Activity' },
    { href: '/meal/attendance', icon: Users, label: 'Take Attendance' },
    { href: '/meal/baseline-survey', icon: Book, label: 'Baseline Survey' },
    { href: '/meal/endline-survey', icon: Book, label: 'Endline Survey' },
    { href: '/meal/pulse', icon: Heart, label: 'Pulse Content' },
    { href: '/forms/check-in', icon: LogIn, label: 'Check-in' },
    { href: '/forms/check-out', icon: LogOut, label: 'Check-out' },
  ],
  enterprise: [
    { href: '/enterprise/essentials', icon: Store, label: 'Enterprise Hub' },
    { href: '/enterprise/essentials/products', icon: Package, label: 'Products' },
    { href: '/enterprise/essentials/sales', icon: ShoppingCart, label: 'Point of Sale' },
    { href: '/enterprise/essentials/production', icon: TrendingUp, label: 'Production' },
  ],
  programs: [
    { href: '/enterprise/youth-center', icon: UsersRound, label: 'Youth Center' },
    { href: '/meal/ofa', icon: Swords, label: 'OFA Football' },
    { href: '/talents/omuto-cup', icon: Trophy, label: 'Omuto Cup' },
    { href: '/meal/red-campaign', icon: ShieldCheck, label: 'RED Campaign' },
    { href: '/meal/slf', icon: School, label: 'SLF Program' },
    { href: '/meal/tree-survey', icon: Trees, label: 'Tree Survey' },
    { href: '/meal/yoskills', icon: GraduationCap, label: 'YOSkills' },
    { href: '/meal/yap', icon: Landmark, label: 'YAP' },
    { href: '/meal/greenschools', icon: Flower2, label: 'Green Schools' },
    { href: '/meal/purewater', icon: Droplets, label: 'PureWater' },
    { href: '/school-xperience', icon: Building2, label: 'School Xperience' },
    { href: '/school-xperience/seed', icon: Sparkles, label: 'Seed Demo' },
  ],
  team: [
    { href: '/team-performance', icon: Trophy, label: 'Impact Stars' },
    { href: '/checkins', icon: LogIn, label: 'Check-ins' },
    { href: '/activity-log', icon: History, label: 'Activity Log' },
    { href: '/stream', icon: Wind, label: 'Reports' },
    { href: '/calendar', icon: CalendarIcon, label: 'Calendar' },
  ],
  data: [
    { href: '/meal/data', icon: BarChart3, label: 'Dashboards' },
    { href: '/meal/impact-studio', icon: Sparkles, label: 'Impact Studio' },
    { href: '/reports', icon: AreaChart, label: 'Reports' },
    { href: '/school-xperience/impact-data/map', icon: MapIcon, label: 'Impact Map' },
  ],
  ai: [
    { href: '/chat', icon: Sparkles, label: 'AI Coach' },
    { href: '/know', icon: BookOpen, label: 'Knowledge Base' },
    { href: '/management/operational-plan', icon: Goal, label: 'Strategy' },
  ],
  ops: [
    { href: '/management', icon: Briefcase, label: 'Ops Desk' },
    { href: '/management/expenses', icon: Wallet, label: 'Expenses' },
    { href: '/resources', icon: Handshake, label: 'Grant Finder' },
    { href: '/my-finances', icon: Wallet, label: 'My Finances' },
  ],
  content: [
    { href: '/testimonies', icon: Video, label: 'Stories' },
    { href: '/record-testimony', icon: Mic, label: 'Capture Story' },
    { href: '/impact-story', icon: Wand2, label: 'Impact Narratives' },
    { href: '/pulse', icon: Heart, label: 'Pulse' },
  ],
  system: [
    { href: '/help', icon: LifeBuoy, label: 'Help' },
    { href: '/system/feedback', icon: Bug, label: 'Feedback' },
  ]
};

const roleNavConfig: { [key: string]: (keyof typeof navConfig)[] } = {
  'Administrator': ['daily', 'ai', 'ops', 'enterprise', 'programs', 'forms', 'team', 'data', 'content', 'system'],
  'Executive Director': ['daily', 'ai', 'ops', 'enterprise', 'programs', 'forms', 'team', 'data', 'content', 'system'],
  'Programs & Partnerships Manager': ['daily', 'ai', 'enterprise', 'programs', 'forms', 'team', 'data', 'content'],
  'Operations & Field Manager': ['daily', 'ai', 'enterprise', 'programs', 'forms', 'team', 'data', 'content'],
  'Media & Finance Lead': ['daily', 'ai', 'ops', 'enterprise', 'forms', 'data', 'content'],
  'Media & Communications Lead': ['daily', 'ai', 'enterprise', 'forms', 'data', 'content'],
  'Essentials Manager': ['daily', 'ai', 'enterprise', 'ops', 'forms', 'data'],
  'Youth Center Manager': ['daily', 'ai', 'enterprise', 'forms', 'team', 'data'],
  'Field Coordinator': ['daily', 'ai', 'programs', 'forms', 'team', 'data', 'content'],
  'Field Staff': ['daily', 'ai', 'forms', 'team', 'data', 'content'],
  'Media & Communications': ['daily', 'ai', 'forms', 'content', 'data'],
  'Accountant/Finance': ['daily', 'ai', 'ops', 'forms', 'data'],
  'Intern': ['daily', 'ai', 'forms', 'team', 'content'],
  'Volunteer': ['daily', 'ai', 'forms', 'team'],
  'default': ['daily', 'team', 'data'],
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
    const navItems = navConfig[sectionName];

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
                    rounded-lg border-md transition-all h-11 px-4 duration-200
                    ${isActive(item.href) 
                        ? 'bg-omuto-red text-white border-omuto-navy shadow-comic-sm hover:translate-x-1' 
                        : 'bg-transparent text-omuto-navy/70 border-transparent hover:bg-white hover:border-omuto-navy hover:shadow-comic-sm hover:-translate-y-0.5 hover:text-omuto-navy'
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
        {renderNavSection('daily', 'Daily Ops')}
        <div className="h-3" />
        {renderNavSection('ai', 'AI & Strategy')}
        <div className="h-3" />
        {renderNavSection('ops', 'Operations')}
        <div className="h-3" />
        {renderNavSection('enterprise', 'Enterprise')}
        <div className="h-3" />
        {renderNavSection('programs', 'Programs')}
        <div className="h-3" />
        {renderNavSection('forms', 'Impact Forms')}
        <div className="h-3" />
        {renderNavSection('team', 'Team')}
        <div className="h-3" />
        {renderNavSection('data', 'Data')}
        <div className="h-3" />
        {renderNavSection('content', 'Content')}
        <Separator className="mx-7 my-5 bg-omuto-navy/10 border-none h-[2px]" />
        {renderNavSection('system', 'System')}
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
