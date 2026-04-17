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
  Coins,
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
  Library,
  Bot,
  ChevronDown,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Receipt,
  ClipboardList,
  Star,
  Plus,
  Minus,
  Search,
  X,
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
import { useState, useEffect, useMemo } from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';


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

// All navigation items with metadata
const allNavItems = [
  // Core section
  { href: '/', icon: LayoutDashboard, label: 'Mission Control', section: 'core' },
  { href: '/daily-plan', icon: Zap, label: 'AI Daily Planner', section: 'core' },
  { href: '/workplan', icon: CheckCircle, label: 'My Weekly Goals', section: 'core' },
  { href: '/calendar', icon: Calendar, label: 'Calendar', section: 'core' },
  
  // Daily standup flow
  { href: '/forms/check-in', icon: LogIn, label: 'Morning Check-in', section: 'daily', badge: 'Forms' },
  { href: '/forms/check-out', icon: LogOut, label: 'End of Day', section: 'daily', badge: 'Forms' },
  { href: '/stream', icon: Wind, label: 'Team Stream', section: 'daily' },
  
  // Impact & Programs
  { href: '/meal/data', icon: BarChart3, label: 'All Dashboards', section: 'impact', badge: 'Impact' },
  { href: '/meal/impact-studio', icon: Sparkles, label: 'Impact Studio', section: 'impact' },
  { href: '/school-xperience/impact-data/map', icon: MapIcon, label: 'Impact Map', section: 'impact' },
  { href: '/reports', icon: AreaChart, label: 'Reports', section: 'impact' },
  
  // Programs Hub
  { href: '/meal', icon: Building2, label: 'Programs Hub', section: 'programs', badge: 'Programs', isHub: true },
  { href: '/school-xperience', icon: Building2, label: 'School Xperience', section: 'programs' },
  { href: '/meal/ofa', icon: Swords, label: 'OFA Football', section: 'programs' },
  { href: '/talents/omuto-cup', icon: Trophy, label: 'Omuto Cup', section: 'programs' },
  { href: '/meal/red-campaign', icon: ShieldCheck, label: 'RED Campaign', section: 'programs' },
  { href: '/meal/greenschools', icon: Flower2, label: 'Green Schools', section: 'programs' },
  { href: '/meal/purewater', icon: Droplets, label: 'PureWater', section: 'programs' },
  { href: '/meal/slf', icon: School, label: 'SLF', section: 'programs' },
  { href: '/meal/yap', icon: Landmark, label: 'YAP', section: 'programs' },
  { href: '/meal/yoskills', icon: GraduationCap, label: 'YOSkills', section: 'programs' },
  { href: '/enterprise/youth-center', icon: UsersRound, label: 'Youth Center', section: 'programs' },
  
  // Recording & Activity
  { href: '/meal/activity', icon: BarChart3, label: 'Log Activity', section: 'record', badge: 'Forms' },
  { href: '/meal/beneficiary-registration', icon: Users, label: 'Register Beneficiary', section: 'record' },
  { href: '/school-xperience/log-visit', icon: Building2, label: 'Log School Visit', section: 'record' },
  { href: '/meal/record-testimony', icon: Mic, label: 'Record Testimony', section: 'record' },
  
  // Content & Storytelling
  { href: '/testimonies', icon: Video, label: 'Stories Library', section: 'content', badge: 'Content' },
  { href: '/impact-story', icon: Wand2, label: 'Create Impact Story', section: 'content' },
  { href: '/pulse', icon: Heart, label: 'Omuto Pulse', section: 'content' },
  
  // Finance
  { href: '/finance/dashboard', icon: Wallet, label: 'Finance Hub', section: 'finance', badge: 'Finance' },
  { href: '/forms/expense', icon: Receipt, label: 'Submit Expense', section: 'finance' },
  { href: '/finance/requisitions', icon: FileText, label: 'Requisitions', section: 'finance' },
  { href: '/finance/income', icon: TrendingUp, label: 'Income', section: 'finance' },
  { href: '/finance/accountabilities', icon: ShieldCheck, label: 'Accountabilities', section: 'finance' },
  
  // Enterprise
  { href: '/enterprise/essentials', icon: Store, label: 'Essentials Hub', section: 'enterprise', badge: 'Enterprise' },
  { href: '/enterprise/essentials/sales', icon: ShoppingCart, label: 'Point of Sale', section: 'enterprise' },
  { href: '/enterprise/essentials/products', icon: Package, label: 'Products', section: 'enterprise' },
  { href: '/enterprise/essentials/production', icon: TrendingUp, label: 'Production', section: 'enterprise' },
  
  // My Service
  { href: '/self-service', icon: UserCircle, label: 'My Hub', section: 'my', badge: 'Self-Service' },
  { href: '/self-service/leave', icon: Palmtree, label: 'Leave', section: 'my' },
  { href: '/self-service/attendance', icon: Timer, label: 'Attendance', section: 'my' },
  { href: '/self-service/payslips', icon: CreditCard, label: 'Payslips', section: 'my' },
  { href: '/my-finances', icon: Wallet, label: 'My Expenses', section: 'my' },
  { href: '/profile', icon: UserCircle, label: 'Profile & Tasks', section: 'my' },
  
  // AI & Knowledge
  { href: '/chat', icon: Bot, label: 'AI Coach', section: 'ai', badge: 'AI' },
  { href: '/know', icon: BookOpen, label: 'Knowledge Base', section: 'ai' },
  { href: '/management/operational-plan', icon: Goal, label: 'Strategy & OKRs', section: 'ai' },
  { href: '/resources', icon: Library, label: 'Grant Resources', section: 'ai' },
  
  // Management (Admin)
  { href: '/management', icon: Briefcase, label: 'Operations Desk', section: 'admin', badge: 'Admin' },
  { href: '/management/users', icon: Users, label: 'Staff Directory', section: 'admin' },
  { href: '/management/finance', icon: Wallet, label: 'Financial Mgmt', section: 'admin' },
  { href: '/management/expenses', icon: Receipt, label: 'Expense Mgmt', section: 'admin' },
  { href: '/management/partnerships', icon: Handshake, label: 'Partnerships', section: 'admin' },
  { href: '/management/programs', icon: ListChecks, label: 'Programs Mgmt', section: 'admin' },
  { href: '/management/projects', icon: Target, label: 'Projects', section: 'admin' },
  { href: '/management/workplans', icon: CheckSquare, label: 'Workplans', section: 'admin' },
  { href: '/management/data', icon: Database, label: 'Data Manager', section: 'admin' },
  { href: '/management/seeding', icon: FileSpreadsheet, label: 'Seeding Bot', section: 'admin' },
  
  // HR
  { href: '/hr/dashboard', icon: Users, label: 'HR Dashboard', section: 'hr', badge: 'HR' },
  { href: '/hr/leave', icon: Palmtree, label: 'Leave Management', section: 'hr' },
  { href: '/hr/hiring', icon: UserPlus, label: 'Hiring', section: 'hr' },
  { href: '/hr/performance', icon: FileBadge, label: 'Performance', section: 'hr' },
  { href: '/hr/payroll', icon: CreditCard, label: 'Payroll', section: 'hr' },
  
  // System
  { href: '/notifications', icon: Bell, label: 'Notifications', section: 'system' },
  { href: '/help', icon: LifeBuoy, label: 'Help & Guide', section: 'system' },
  { href: '/system/feedback', icon: Bug, label: 'Report Issue', section: 'system' },
];

// Section colors and labels
const sectionConfig: Record<string, { label: string; defaultOpen: boolean; icon?: any }> = {
  core: { label: '🚀 Core', defaultOpen: true },
  daily: { label: '📋 Daily Standup', defaultOpen: true },
  my: { label: '👤 My Service', defaultOpen: true, icon: UserCircle },
  record: { label: '📝 Record & Log', defaultOpen: false, icon: ClipboardList },
  programs: { label: '🎯 Programs', defaultOpen: false, icon: Trophy },
  enterprise: { label: '🏪 Enterprise', defaultOpen: false, icon: Store },
  finance: { label: '💰 Finance', defaultOpen: false, icon: Wallet },
  impact: { label: '📊 Impact', defaultOpen: false, icon: BarChart3 },
  content: { label: '✨ Content', defaultOpen: false, icon: Video },
  ai: { label: '🤖 AI & Strategy', defaultOpen: false, icon: Bot },
  admin: { label: '⚙️ Management', defaultOpen: false, icon: Briefcase },
  hr: { label: '👥 HR', defaultOpen: false, icon: Users },
  system: { label: '🔧 System', defaultOpen: false, icon: LifeBuoy },
};

// Define which sections each role can see
const roleNavConfig: Record<string, string[]> = {
  'Administrator': ['core', 'daily', 'my', 'record', 'programs', 'enterprise', 'finance', 'content', 'ai', 'admin', 'hr', 'system'],
  'Executive Director': ['core', 'daily', 'my', 'record', 'programs', 'enterprise', 'finance', 'impact', 'content', 'ai', 'admin', 'hr', 'system'],
  'Board Chair': ['core', 'finance', 'impact', 'ai', 'system'],
  'Board Member': ['core', 'finance', 'impact', 'ai', 'system'],
  'Programs & Partnerships Manager': ['core', 'daily', 'my', 'record', 'programs', 'finance', 'impact', 'content', 'ai', 'admin', 'system'],
  'Operations & Field Manager': ['core', 'daily', 'my', 'record', 'programs', 'finance', 'impact', 'content', 'ai', 'system'],
  'Media & Finance Lead': ['core', 'daily', 'my', 'record', 'enterprise', 'finance', 'impact', 'content', 'ai', 'system'],
  'Essentials Manager': ['core', 'daily', 'my', 'record', 'enterprise', 'impact', 'ai', 'system'],
  'Youth Center Manager': ['core', 'daily', 'my', 'record', 'enterprise', 'impact', 'ai', 'system'],
  'Field Coordinator': ['core', 'daily', 'my', 'record', 'programs', 'impact', 'content', 'ai', 'system'],
  'Field Staff': ['core', 'daily', 'my', 'record', 'impact', 'content', 'ai', 'system'],
  'Media & Communications': ['core', 'daily', 'my', 'record', 'content', 'impact', 'ai', 'system'],
  'Accountant/Finance': ['core', 'daily', 'my', 'finance', 'impact', 'ai', 'system'],
  'Intern': ['core', 'daily', 'my', 'impact', 'content', 'ai', 'system'],
  'Volunteer': ['core', 'daily', 'my', 'impact', 'ai', 'system'],
  'default': ['core', 'daily', 'my', 'impact', 'ai', 'system'],
};

// Default favorites for each role
const defaultFavorites: Record<string, string[]> = {
  'Administrator': ['/', '/forms/check-in', '/forms/check-out', '/management/expenses', '/chat', '/hr/dashboard'],
  'Executive Director': ['/', '/forms/check-in', '/forms/check-out', '/management/finance', '/chat'],
  'Field Coordinator': ['/', '/forms/check-in', '/forms/check-out', '/meal/activity', '/chat'],
  'Field Staff': ['/', '/forms/check-in', '/forms/check-out', '/meal/activity', '/chat'],
  'default': ['/', '/forms/check-in', '/forms/check-out', '/chat'],
};

const STORAGE_KEY_PREFIX = 'omuto-sidebar-favorites-';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile: realProfile, isLoading: isProfileLoading } = useUserProfile(user);
  const { isMobile, setOpenMobile } = useSidebar();
  const { viewAsRole } = useViewAs();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load favorites from localStorage - MUST be at top level, not after conditional
  const effectiveRole = viewAsRole || realProfile?.role || 'default';
  const userId = user?.uid || 'anonymous';
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
        const roleDefaults = defaultFavorites[effectiveRole] || defaultFavorites['default'];
        setFavorites(roleDefaults);
      }
    } catch (e) {
      console.warn('Failed to load sidebar favorites:', e);
    }
  }, [storageKey, effectiveRole]);
  
  // Early return AFTER all hooks
  if (isProfileLoading || !realProfile) {
    return (
        <div className="p-6 space-y-6 h-full bg-omuto-cream border-r-lg border-omuto-navy/20">
            <OmutoLogo />
            <SidebarMenuSkeleton showIcon />
            <SidebarMenuSkeleton showIcon />
        </div>
    )
  }
  
  // Save favorites to localStorage
  const saveFavorites = (newFavorites: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (e) {
      console.warn('Failed to save sidebar favorites:', e);
    }
  };
  
  const toggleFavorite = (href: string) => {
    if (favorites.includes(href)) {
      saveFavorites(favorites.filter(f => f !== href));
    } else {
      saveFavorites([...favorites, href]);
    }
  };
  
  const userRole = effectiveRole as keyof typeof roleNavConfig;
  const allowedSections = roleNavConfig[userRole] || roleNavConfig['default'];
  
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Get favorites with their nav item data
  const favoriteItems = useMemo(() => {
    return favorites
      .map(href => allNavItems.find(item => item.href === href))
      .filter(Boolean) as typeof allNavItems;
  }, [favorites]);
  
  // Filter nav items by search
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return allNavItems.filter(item => 
      allowedSections.includes(item.section) &&
      (item.label.toLowerCase().includes(query) || item.href.toLowerCase().includes(query))
    );
  }, [searchQuery, allowedSections]);
  
  // Group nav items by section
  const groupedNavItems = useMemo(() => {
    const grouped: Record<string, typeof allNavItems> = {};
    for (const section of allowedSections) {
      const items = allNavItems.filter(item => item.section === section);
      if (items.length > 0) {
        grouped[section] = items;
      }
    }
    return grouped;
  }, [allowedSections]);
  
  const renderNavItem = (item: typeof allNavItems[0], showStar = true) => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        href={item.href}
        isActive={isActive(item.href)}
        onClick={handleLinkClick}
        className={cn(
          'rounded-lg transition-all h-9 px-3 duration-150 relative group',
          isActive(item.href) 
            ? 'bg-omuto-red/10 text-omuto-red before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-r before:bg-omuto-red' 
            : 'bg-transparent text-omuto-navy/60 hover:bg-omuto-navy/5 hover:text-omuto-navy'
        )}
      >
        <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive(item.href) ? 'text-omuto-red' : 'text-omuto-navy/50')} />
        <span className="font-medium text-sm flex-1">{item.label}</span>
        {item.badge && (
          <span className="text-[8px] bg-muted px-1.5 py-0.5 rounded font-bold">{item.badge}</span>
        )}
        {showStar && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(item.href);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
            aria-label={favorites.includes(item.href) ? 'Remove from favorites' : 'Add to favorites'}
          >
            {favorites.includes(item.href) ? (
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            ) : (
              <Star className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
  
  const renderNavSection = (sectionName: string) => {
    const config = sectionConfig[sectionName];
    if (!config) return null;
    
    const navItems = groupedNavItems[sectionName] || [];
    if (navItems.length === 0) return null;
    
    const isOpen = expandedSections[sectionName] ?? config.defaultOpen;
    const isSectionActive = navItems.some(item => isActive(item.href));
    
    return (
      <Collapsible
        key={sectionName}
        asChild
        defaultOpen={config.defaultOpen}
        className="group/collapsible"
      >
        <SidebarGroup className="px-3">
          <SidebarGroupLabel asChild className="px-3 text-[10px] uppercase tracking-[0.2em] text-omuto-navy/40 font-bold mb-1 hover:bg-omuto-navy/5 hover:text-omuto-navy rounded-md transition-colors cursor-pointer group-data-[state=open]/collapsible:text-omuto-navy/60">
            <CollapsibleTrigger 
              onClick={() => toggleSection(sectionName)}
              className="flex w-full items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                {config.icon && <config.icon className="h-3.5 w-3.5" />}
                {config.label}
              </div>
              <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 opacity-50 group-hover:opacity-100" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5 mt-1">
                {navItems.map(item => renderNavItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  return (
    <div className="flex flex-col h-full bg-omuto-cream border-r border-omuto-navy/10 overflow-hidden">
      <SidebarHeader>
        <OmutoLogo />
      </SidebarHeader>
      
      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-8 text-xs bg-white border-omuto-navy/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      
      <SidebarContent className="no-scrollbar pt-1 flex-1 overflow-y-auto">
        {/* Search Results */}
        {filteredNavItems ? (
          <div className="px-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-2">
              Search Results ({filteredNavItems.length})
            </div>
            <SidebarMenu className="gap-0.5">
              {filteredNavItems.map(item => renderNavItem(item))}
            </SidebarMenu>
          </div>
        ) : (
          <>
            {/* Favorites Section */}
            {favoriteItems.length > 0 && (
              <SidebarGroup className="px-3">
                <div className="px-3 pb-2 flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-amber-600 font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    Favorites
                  </div>
                </div>
                <SidebarMenu className="gap-0.5">
                  {favoriteItems.map(item => renderNavItem(item))}
                </SidebarMenu>
              </SidebarGroup>
            )}
            
            {/* Navigation Sections */}
            {allowedSections.map(section => renderNavSection(section))}
          </>
        )}
      </SidebarContent>
      
      <SidebarFooter className="px-5 py-4 border-t border-omuto-navy/8 bg-omuto-cream mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-omuto-navy/40" />
            <p className="text-xs text-omuto-navy/40 font-medium">Omuto Central</p>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {favoriteItems.length} favorites
          </span>
        </div>
      </SidebarFooter>
    </div>
  );
}