
'use client';

import {
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
  CheckSquare,
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
    <div className="flex items-center gap-3 px-2 py-4" data-ai-hint="logo">
        <div className="p-0.5 rounded-xl overflow-hidden">
            <Image src="/logo.svg" alt="Omuto Foundation Logo" width={36} height={36} className="rounded-xl" />
        </div>
        <div className="flex flex-col">
            <span className="font-heading font-black text-xl tracking-tight leading-none text-omuto-navy">OMUTO</span>
            <span className="text-[10px] font-bold text-omuto-red tracking-[0.2em] uppercase leading-none mt-1">Central</span>
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
    { href: '/meal/activity', icon: BarChart3, label: 'Log Activity' },
    { href: '/meal/attendance', icon: CheckCircle, label: 'Take Attendance' },
    { href: '/meal/baseline-survey', icon: Book, label: 'Baseline Survey' },
    { href: '/meal/endline-survey', icon: CheckSquare, label: 'Endline Survey' },
    { href: '/meal/pulse', icon: Heart, label: 'Pulse Content' },
    { href: '/forms/school', icon: School, label: 'Register School' },
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
  ],
  team: [
    { href: '/team-performance', icon: TrendingUp, label: 'Impact Stars' },
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
  'Administrator': ['daily', 'forms', 'programs', 'enterprise', 'ops', 'team', 'data', 'ai', 'content', 'system'],
  'Executive Director': ['daily', 'forms', 'programs', 'enterprise', 'ops', 'team', 'data', 'ai', 'content', 'system'],
  'Programs & Partnerships Manager': ['daily', 'forms', 'programs', 'enterprise', 'team', 'data', 'ai', 'content'],
  'Operations & Field Manager': ['daily', 'forms', 'programs', 'enterprise', 'team', 'data', 'ai', 'content'],
  'Media & Finance Lead': ['daily', 'forms', 'enterprise', 'ops', 'data', 'ai', 'content'],
  'Media & Communications Lead': ['daily', 'forms', 'enterprise', 'data', 'ai', 'content'],
  'Essentials Manager': ['daily', 'forms', 'enterprise', 'ops', 'data', 'ai'],
  'Youth Center Manager': ['daily', 'forms', 'enterprise', 'team', 'data', 'ai'],
  'Field Coordinator': ['daily', 'forms', 'programs', 'team', 'data', 'ai', 'content'],
  'Field Staff': ['daily', 'forms', 'team', 'data', 'ai', 'content'],
  'Media & Communications': ['daily', 'forms', 'content', 'data', 'ai'],
  'Accountant/Finance': ['daily', 'forms', 'ops', 'data', 'ai'],
  'Intern': ['daily', 'forms', 'team', 'content', 'ai'],
  'Volunteer': ['daily', 'forms', 'team', 'ai'],
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
      <SidebarGroup className="px-3">
        <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.15em] text-omuto-navy/30 font-medium mb-1">{title}</SidebarGroupLabel>
        <SidebarMenu className="gap-0.5">
          {navItems.map(item => (
             <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                href={item.href}
                isActive={isActive(item.href)}
                onClick={handleLinkClick}
                className={`
                    rounded-lg transition-all h-9 px-3 duration-150 relative
                    ${isActive(item.href) 
                        ? 'bg-omuto-red/10 text-omuto-red before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-r before:bg-omuto-red' 
                        : 'bg-transparent text-omuto-navy/60 hover:bg-omuto-navy/5 hover:text-omuto-navy'
                    }
                `}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive(item.href) ? 'text-omuto-red' : 'text-omuto-navy/50'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  };

  return (
    <div className="flex flex-col h-full bg-omuto-cream border-r border-omuto-navy/10">
      <SidebarHeader>
        <OmutoLogo />
      </SidebarHeader>
      <SidebarContent className="no-scrollbar pt-1">
        {renderNavSection('daily', 'Daily Ops')}
        {renderNavSection('forms', 'Impact Forms')}
        {renderNavSection('programs', 'Programs')}
        {renderNavSection('enterprise', 'Enterprise')}
        {renderNavSection('ops', 'Operations')}
        {renderNavSection('team', 'Team')}
        {renderNavSection('data', 'Data')}
        {renderNavSection('ai', 'AI & Strategy')}
        {renderNavSection('content', 'Content')}
        <Separator className="mx-5 my-3 bg-omuto-navy/8 border-none h-px" />
        {renderNavSection('system', 'System')}
      </SidebarContent>
      <SidebarFooter className="px-5 py-4 border-t border-omuto-navy/8 bg-omuto-cream">
        <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-omuto-navy/40" />
            <p className="text-xs text-omuto-navy/40 font-medium">Core Engine AI V2.0</p>
        </div>
      </SidebarFooter>
    </div>
  );
}
