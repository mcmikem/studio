'use client';

import { Home, Menu, Plus, BarChart3, LogIn, LogOut, Receipt, MessageCircle, X, CheckCircle, LayoutDashboard, Search, DollarSign, TrendingUp, Users, Wallet, FileText, Sparkles, ClipboardCheck, Heart, Building2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './ui/sidebar';
import { useEffect, useRef, useState } from 'react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const actionDialogRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLAnchorElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isActionMenuOpen) {
      setSearchQuery('');
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsActionMenuOpen(false);
    };

    const onFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const dialog = actionDialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onEscape);
    document.addEventListener('keydown', onFocusTrap);
    firstActionRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('keydown', onFocusTrap);
    };
  }, [isActionMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const allActions = [
    // Quick forms - most used
    { href: '/forms/expense', label: 'Expense Report', icon: Receipt, category: 'Finance' },
    { href: '/forms/check-in', label: 'Morning Check-in', icon: LogIn, category: 'Daily' },
    { href: '/forms/check-out', label: 'End of Day', icon: LogOut, category: 'Daily' },
    { href: '/daily-plan', label: 'AI Planner', icon: LayoutDashboard, category: 'Daily' },
    // Impact logging
    { href: '/meal/activity', label: 'Log Activity', icon: BarChart3, category: 'Impact' },
    { href: '/school-xperience/log-visit', label: 'Log School Visit', icon: Building2, category: 'Impact' },
    { href: '/meal/beneficiary-registration', label: 'Register Beneficiary', icon: Users, category: 'Impact' },
    // Finance
    { href: '/finance/income', label: 'Log Income', icon: DollarSign, category: 'Finance' },
    { href: '/finance/requisitions', label: 'View Requisitions', icon: FileText, category: 'Finance' },
    { href: '/finance/petty-cash', label: 'Petty Cash', icon: Wallet, category: 'Finance' },
    // AI
    { href: '/chat', label: 'AI Coach', icon: MessageCircle, category: 'AI' },
    { href: '/impact-story', label: 'Impact Story', icon: Sparkles, category: 'Content' },
    { href: '/pulse', label: 'Omuto Pulse', icon: Heart, category: 'Content' },
    { href: '/testimonies', label: 'Capture Story', icon: ClipboardCheck, category: 'Content' },
  ];

  const filteredActions = searchQuery 
    ? allActions.filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : allActions;

  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, typeof allActions>);

  const categories = ['Daily', 'Finance', 'Impact', 'Content', 'AI'];

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-[600] w-full pb-safe" aria-label="Mobile navigation">
      
      {/* Action drawer overlay */}
      {isActionMenuOpen && (
        <div
          className="fixed inset-0 bg-omuto-navy/60 backdrop-blur-sm z-[700] animate-in fade-in duration-200"
          onClick={() => setIsActionMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Quick actions menu"
        >
          <div
            ref={actionDialogRef}
            className="absolute bottom-24 left-2 right-2 max-h-[70vh] animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-omuto-navy/10 bg-white shadow-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="off"
              />
            </div>

            {/* Actions list */}
            <div className="bg-white rounded-2xl shadow-lg border border-omuto-navy/10 overflow-hidden max-h-[50vh] overflow-y-auto">
              {filteredActions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No actions found</p>
                  <p className="text-xs">Try a different search term</p>
                </div>
              ) : searchQuery ? (
                // Show flat list when searching
                <div className="grid grid-cols-2 gap-1 p-2">
                  {filteredActions.map((action, i) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      ref={i === 0 ? firstActionRef : undefined}
                      onClick={() => setIsActionMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted active:scale-[0.98] transition-all"
                    >
                      <div className={`p-2 rounded-lg bg-omuto-navy/5`}>
                        <action.icon className="h-4 w-4 text-omuto-navy" />
                      </div>
                      <span className="text-sm font-medium text-omuto-navy">{action.label}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                // Show grouped when not searching
                categories.map(category => {
                  const items = groupedActions[category];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={category}>
                   <div className="px-4 py-2 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                         {category}
                       </div>
                      <div className="grid grid-cols-2 gap-1 p-2">
                        {items.map((action, i) => (
                          <Link
                            key={action.href}
                            href={action.href}
                            ref={category === 'Daily' && i === 0 ? firstActionRef : undefined}
                            onClick={() => setIsActionMenuOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted active:scale-[0.98] transition-all"
                          >
                            <div className={`p-2 rounded-lg bg-omuto-navy/5`}>
                              <action.icon className="h-4 w-4 text-omuto-navy" />
                            </div>
                            <span className="text-sm font-medium text-omuto-navy">{action.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav 
        role="navigation"
        aria-label="Main mobile navigation"
        className="mx-3 mb-3 bg-white/95 backdrop-blur-md border border-omuto-navy/8 rounded-2xl z-[800] h-16 py-2.5 flex items-center justify-between px-3"
      >
        <Link
          href="/"
          aria-label="Go to HQ"
          aria-current={isActive('/') ? 'page' : undefined}
          className={cn('flex flex-col items-center justify-center flex-1 h-full transition-all', isActive('/') ? 'text-omuto-red' : 'text-omuto-navy/35')}
        >
          <Home className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs font-medium mt-0.5">HQ</span>
        </Link>

        <Link
          href="/meal"
          aria-label="Go to Impact"
          aria-current={isActive('/meal') ? 'page' : undefined}
          className={cn('flex flex-col items-center justify-center flex-1 h-full transition-all', isActive('/meal') ? 'text-omuto-red' : 'text-omuto-navy/35')}
        >
          <BarChart3 className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs font-medium mt-0.5">Impact</span>
        </Link>

        <button
          onClick={() => setIsActionMenuOpen((open) => !open)}
          aria-label={isActionMenuOpen ? 'Close quick actions menu' : 'Open quick actions menu'}
          aria-expanded={isActionMenuOpen}
          aria-haspopup="dialog"
          className="flex items-center justify-center -mt-6"
        >
          <div
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center text-white transition-all active:scale-90 shadow-md',
              isActionMenuOpen ? 'bg-omuto-navy/80 rotate-45' : 'bg-omuto-red rotate-0'
            )}
          >
            {isActionMenuOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </div>
          <span className="sr-only">Quick Actions</span>
        </button>

        <Link
          href="/profile?tab=tasks"
          aria-label="Go to Tasks"
          aria-current={isActive('/profile?tab=tasks') ? 'page' : undefined}
          className={cn('flex flex-col items-center justify-center flex-1 h-full transition-all', isActive('/profile?tab=tasks') ? 'text-omuto-red' : 'text-omuto-navy/35')}
        >
          <CheckCircle className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs font-medium mt-0.5">Tasks</span>
        </Link>

        <button onClick={() => setOpenMobile(true)} aria-label="Open more navigation options" className="flex flex-col items-center justify-center flex-1 h-full text-omuto-navy/35">
          <Menu className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs font-medium mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
}