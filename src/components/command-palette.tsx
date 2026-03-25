'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { 
  Search, Home, DollarSign, Users, Briefcase, GraduationCap,
  Heart, PieChart, Settings, User, Plus, FileText, Calendar,
  BarChart3, ClipboardCheck, Building2, Gift, Droplets, TreePine, Map
} from 'lucide-react';
import { MapPin } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Dashboard', category: 'Main' },
  { href: '/finance', icon: DollarSign, label: 'Finance Hub', category: 'Finance' },
  { href: '/finance/requisitions', icon: FileText, label: 'Requisitions', category: 'Finance' },
  { href: '/finance/income', icon: PieChart, label: 'Income', category: 'Finance' },
  { href: '/finance/reports', icon: BarChart3, label: 'Reports', category: 'Finance' },
  { href: '/hr', icon: Users, label: 'HR Dashboard', category: 'HR' },
  { href: '/hr/leave', icon: Calendar, label: 'Leave Management', category: 'HR' },
  { href: '/hr/assets', icon: Building2, label: 'Asset Registry', category: 'HR' },
  { href: '/school-xperience', icon: GraduationCap, label: 'School Xperience', category: 'Programs' },
  { href: '/school-xperience/impact-data/map', icon: Map, label: 'Impact Map', category: 'Programs' },
  { href: '/meal', icon: Heart, label: 'MEAL Hub', category: 'Programs' },
  { href: '/meal/beneficiary-registration', icon: User, label: 'Register Beneficiary', category: 'Programs' },
  { href: '/meal/activity', icon: ClipboardCheck, label: 'Log Activity', category: 'Programs' },
  { href: '/enterprise', icon: Building2, label: 'Enterprise', category: 'Programs' },
  { href: '/forms/expense', icon: Plus, label: 'New Requisition', category: 'Quick Actions' },
  { href: '/forms/attendance', icon: Users, label: 'Take Attendance', category: 'Quick Actions' },
  { href: '/calendar', icon: Calendar, label: 'Calendar', category: 'Tools' },
  { href: '/workplan', icon: FileText, label: 'Workplan', category: 'Tools' },
  { href: '/settings', icon: Settings, label: 'Settings', category: 'System' },
];

const PROGRAM_ICONS: Record<string, any> = {
  'School Xperience': GraduationCap,
  'Cycle of Dignity': Heart,
  'Green Schools': TreePine,
  'PureWater': Droplets,
  'YoSkills': Briefcase,
  'default': Building2,
};

function getIconForProgram(program: string) {
  return PROGRAM_ICONS[program] || PROGRAM_ICONS.default;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      {/* Keyboard hint badge */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 lg:hidden bg-omuto-navy text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold"
      >
        <Search className="h-4 w-4" />
        <span className="text-xs">Search</span>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command Menu"
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4"
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        
        {/* Dialog */}
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-black/5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center border-b border-black/5 px-4">
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <Command.Input
              placeholder="Search pages, actions..."
              className="flex-1 h-14 bg-transparent outline-none text-base font-medium placeholder:text-muted-foreground/50"
            />
            <kbd className="hidden sm:flex h-6 items-center gap-1 rounded-md border bg-muted px-2 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-12 text-center text-muted-foreground">
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </Command.Empty>

            {['Main', 'Finance', 'HR', 'Programs', 'Quick Actions', 'Tools', 'System'].map((category) => (
              <Command.Group
                key={category}
                heading={category}
                className="mb-2"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 py-2">
                  {category}
                </div>
                {NAV_ITEMS.filter(item => item.category === category).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${item.category}`}
                      onSelect={() => runCommand(() => router.push(item.href))}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer data-[selected=true]:bg-primary/5 aria-selected:bg-primary/5 mx-1"
                    >
                      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4 text-omuto-navy" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-omuto-navy">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.href}</p>
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t border-black/5 px-4 py-3 bg-muted/30 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border text-[9px]">↵</kbd> to select
            </p>
            <p className="text-[10px] text-muted-foreground">
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border text-[9px]">↑↓</kbd> to navigate
            </p>
          </div>
        </div>
      </Command.Dialog>
    </>
  );
}
