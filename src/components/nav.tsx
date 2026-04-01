
'use client';

import {
  Sparkles,
  Briefcase,
  AreaChart,
  Bell,
  LogIn,
  Calendar,
  Video,
  BarChart3,
  Wallet,
  LayoutDashboard,
  Users,
  CheckCircle,
  CheckSquare,
  LifeBuoy,
  FileText,
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
  ShieldAlert,
  School,
  Building2,
  Map as MapIcon,
  UserCircle,
  Clock,
  HeartHandshake,
  UserPlus,
  Palmtree,
  Timer,
  FileBadge,
  CreditCard,
  Target,
  Dices,
  MessageSquareWarning,
  Library,
  Bot,
  ChevronDown,
  Database,
  FileSpreadsheet,
  Receipt,
  ClipboardList
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
  SidebarGroupContent,
  useSidebar,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  // Core - Always visible
  core: [
    { href: '/', icon: LayoutDashboard, label: 'Mission Control' },
    { href: '/daily-plan', icon: Zap, label: 'AI Planner' },
    { href: '/workplan', icon: CheckCircle, label: 'Weekly Goals' },
    { href: '/profile?tab=tasks', icon: Bell, label: 'Tasks' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
  ],
  // My Self Service
  my: [
    { href: '/self-service', icon: UserCircle, label: 'My Hub' },
    { href: '/profile', icon: UserCircle, label: 'My Profile' },
    { href: '/self-service/leave', icon: Palmtree, label: 'Leave' },
    { href: '/self-service/attendance', icon: Timer, label: 'Attendance' },
    { href: '/self-service/payslips', icon: CreditCard, label: 'Payslips' },
    { href: '/my-finances', icon: Wallet, label: 'My Wallet' },
  ],
  // Data & Impact
  impact: [
    { href: '/meal/data', icon: BarChart3, label: 'Dashboards' },
    { href: '/meal/impact-studio', icon: Sparkles, label: 'Impact Studio' },
    { href: '/school-xperience/impact-data/map', icon: MapIcon, label: 'Impact Map' },
    { href: '/meal/impact-studio', icon: Database, label: 'Data Studio' },
    { href: '/reports', icon: AreaChart, label: 'Reports' },
    { href: '/stream', icon: Wind, label: 'Team Stream' },
  ],
  // Programs
  programs: [
    { href: '/school-xperience', icon: Building2, label: 'School Xperience' },
    { href: '/school-xperience/impact', icon: MapIcon, label: 'SX Impact' },
    { href: '/meal/ofa', icon: Swords, label: 'OFA Football' },
    { href: '/talents/omuto-cup', icon: Trophy, label: 'Omuto Cup' },
    { href: '/meal/red-campaign', icon: ShieldCheck, label: 'RED Campaign' },
    { href: '/meal/slf', icon: School, label: 'SLF' },
    { href: '/meal/yap', icon: Landmark, label: 'YAP' },
    { href: '/meal/greenschools', icon: Flower2, label: 'Green Schools' },
    { href: '/meal/purewater', icon: Droplets, label: 'PureWater' },
    { href: '/meal/yoskills', icon: GraduationCap, label: 'YOSkills' },
    { href: '/enterprise/youth-center', icon: UsersRound, label: 'Youth Center' },
  ],
  // Enterprise
  enterprise: [
    { href: '/enterprise/essentials', icon: Store, label: 'Essentials Hub' },
    { href: '/enterprise/essentials/products', icon: Package, label: 'Products' },
    { href: '/enterprise/essentials/sales', icon: ShoppingCart, label: 'Point of Sale' },
    { href: '/enterprise/essentials/production', icon: TrendingUp, label: 'Production' },
  ],
  // Finance
  finance: [
    { href: '/finance/dashboard', icon: Wallet, label: 'Finance Hub' },
    { href: '/finance/requisitions', icon: FileText, label: 'Requisitions' },
    { href: '/finance/accountabilities', icon: ShieldCheck, label: 'Accountabilities' },
    { href: '/finance/income', icon: TrendingUp, label: 'Income' },
    { href: '/finance/reports', icon: BarChart3, label: 'Financial Reports' },
    { href: '/finance/petty-cash', icon: Landmark, label: 'Petty Cash' },
  ],
  // HR Admin (for admins only)
  hr: [
    { href: '/hr/dashboard', icon: Users, label: 'HR Dashboard' },
    { href: '/hr/leave', icon: Palmtree, label: 'Leave Mgmt' },
    { href: '/hr/hiring', icon: UserPlus, label: 'Hiring' },
    { href: '/hr/performance', icon: FileBadge, label: 'Performance' },
    { href: '/hr/payroll', icon: CreditCard, label: 'Payroll' },
    { href: '/management/users', icon: Users, label: 'Staff Directory' },
  ],
  // Data Management (Admin only)
  admin: [
    { href: '/management', icon: Briefcase, label: 'Operations Desk' },
    { href: '/management/data', icon: Database, label: 'Data Manager' },
    { href: '/management/seeding', icon: FileSpreadsheet, label: 'Seeding Bot' },
    { href: '/management/metrics', icon: BarChart3, label: 'Metrics' },
    { href: '/meal/baseline-survey', icon: ClipboardList, label: 'Baseline Survey' },
    { href: '/meal/endline-survey', icon: ClipboardList, label: 'Endline Survey' },
  ],
  // AI & Knowledge
  ai: [
    { href: '/chat', icon: Bot, label: 'AI Coach' },
    { href: '/know', icon: BookOpen, label: 'Knowledge Base' },
    { href: '/management/operational-plan', icon: Goal, label: 'Strategy' },
  ],
  // Content
  content: [
    { href: '/testimonies', icon: Video, label: 'Stories' },
    { href: '/impact-story', icon: Wand2, label: 'Impact Stories' },
    { href: '/pulse', icon: Heart, label: 'Omuto Pulse' },
  ],
  // Forms - Quick access
  forms: [
    { href: '/meal/beneficiary-registration', icon: Users, label: 'Register Beneficiary' },
    { href: '/meal/activity', icon: BarChart3, label: 'Log Activity' },
    { href: '/forms/check-in', icon: LogIn, label: 'Check-in' },
    { href: '/forms/check-out', icon: LogOut, label: 'Check-out' },
    { href: '/forms/expense', icon: Receipt, label: 'Submit Expense' },
    { href: '/meal/record-testimony', icon: Mic, label: 'Record Testimony' },
  ],
  // System
  system: [
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/help', icon: LifeBuoy, label: 'Help' },
    { href: '/system/feedback', icon: Bug, label: 'Feedback' },
  ]
};

const roleNavConfig: { [key: string]: (keyof typeof navConfig)[] } = {
  'Administrator': ['core', 'my', 'hr', 'forms', 'programs', 'enterprise', 'finance', 'impact', 'ai', 'content', 'system', 'admin'],
  'Executive Director': ['core', 'my', 'hr', 'forms', 'programs', 'enterprise', 'finance', 'impact', 'ai', 'content', 'system', 'admin'],
  'Programs & Partnerships Manager': ['core', 'my', 'forms', 'programs', 'enterprise', 'finance', 'impact', 'ai', 'content', 'system'],
  'Operations & Field Manager': ['core', 'my', 'forms', 'programs', 'enterprise', 'finance', 'impact', 'ai', 'content', 'system'],
  'Media & Finance Lead': ['core', 'my', 'forms', 'enterprise', 'finance', 'impact', 'ai', 'content', 'system'],
  'Media & Communications Lead': ['core', 'my', 'forms', 'enterprise', 'finance', 'impact', 'ai', 'content', 'system'],
  'Essentials Manager': ['core', 'my', 'forms', 'enterprise', 'impact', 'ai', 'system'],
  'Youth Center Manager': ['core', 'my', 'forms', 'enterprise', 'impact', 'ai', 'system'],
  'Field Coordinator': ['core', 'my', 'forms', 'programs', 'impact', 'ai', 'content', 'system'],
  'Field Staff': ['core', 'my', 'forms', 'impact', 'ai', 'content', 'system'],
  'Media & Communications': ['core', 'my', 'forms', 'content', 'impact', 'ai', 'system'],
  'Accountant/Finance': ['core', 'my', 'forms', 'finance', 'impact', 'ai', 'system'],
  'Intern': ['core', 'my', 'impact', 'content', 'ai', 'system'],
  'Volunteer': ['core', 'my', 'impact', 'ai', 'system'],
  'default': ['core', 'my', 'impact', 'ai', 'system'],
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
    const isSectionActive = navItems.some(item => isActive(item.href));

    return (
      <Collapsible
        key={sectionName}
        asChild
        defaultOpen={isSectionActive}
        className="group/collapsible"
      >
        <SidebarGroup className="px-3">
          <SidebarGroupLabel asChild className="px-3 text-[10px] uppercase tracking-[0.2em] text-omuto-navy/40 font-bold mb-1 hover:bg-omuto-navy/5 hover:text-omuto-navy rounded-md transition-colors cursor-pointer group-data-[state=open]/collapsible:text-omuto-navy/60">
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
              {title}
              <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 opacity-50 group-hover:opacity-100" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
                <SidebarMenu className="gap-0.5 mt-1">
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
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  return (
    <div className="flex flex-col h-full bg-omuto-cream border-r border-omuto-navy/10">
      <SidebarHeader>
        <OmutoLogo />
      </SidebarHeader>
      <SidebarContent className="no-scrollbar pt-1">
        {renderNavSection('core', 'Core')}
        {renderNavSection('my', 'My Service')}
        {renderNavSection('forms', 'Quick Forms')}
        {renderNavSection('programs', 'Programs')}
        {renderNavSection('enterprise', 'Enterprise')}
        {renderNavSection('finance', 'Finance')}
        {renderNavSection('impact', 'Impact')}
        {renderNavSection('hr', 'HR Admin')}
        {renderNavSection('admin', 'Admin')}
        {renderNavSection('ai', 'AI & Strategy')}
        {renderNavSection('content', 'Content')}
        <Separator className="mx-5 my-3 bg-omuto-navy/8 border-none h-px" />
        {renderNavSection('system', 'System')}
      </SidebarContent>
      <SidebarFooter className="px-5 py-4 border-t border-omuto-navy/8 bg-omuto-cream">
        <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-omuto-navy/40" />
            <p className="text-xs text-omuto-navy/40 font-medium">Omuto Central</p>
        </div>
      </SidebarFooter>
    </div>
  );
}
