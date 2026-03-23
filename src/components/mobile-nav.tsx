'use client';

import { Home, Menu, Plus, BarChart3, LogIn, LogOut, Receipt, MessageCircle, X, CheckCircle, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './ui/sidebar';
import { useEffect, useRef, useState } from 'react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const actionDialogRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isActionMenuOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsActionMenuOpen(false);
      }
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

  const actions = [
    { href: '/daily-plan', label: 'Daily Planner', icon: LogIn, color: 'text-omuto-teal', bg: 'bg-omuto-teal/10' },
    { href: '/forms/check-out', label: 'Check-out', icon: LogOut, color: 'text-omuto-red', bg: 'bg-omuto-red/10' },
    { href: '/enterprise/essentials/sales', label: 'Point of Sale', icon: Receipt, color: 'text-omuto-blue', bg: 'bg-omuto-blue/10' },
    { href: '/meal/activity', label: 'Log Impact', icon: BarChart3, color: 'text-omuto-red', bg: 'bg-omuto-red/10' },
    { href: '/meal/data', label: 'Dashboards', icon: LayoutDashboard, color: 'text-omuto-navy', bg: 'bg-omuto-navy/10' },
    { href: '/management/expenses', label: 'Expenses', icon: Receipt, color: 'text-omuto-gold', bg: 'bg-omuto-gold/10' },
    { href: '/chat', label: 'AI Coach', icon: MessageCircle, color: 'text-omuto-brown', bg: 'bg-omuto-brown/10' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-[600] w-full pb-safe" aria-label="Mobile navigation">
      
      {/* Action drawer overlay */}
      {isActionMenuOpen && (
        <div
          className="fixed inset-0 bg-omuto-navy/80 backdrop-blur-sm z-[700] animate-in fade-in duration-300"
          onClick={() => setIsActionMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Quick actions menu"
        >
          <div
            ref={actionDialogRef}
            className="absolute bottom-32 left-4 right-4 space-y-3 animate-in slide-in-from-bottom-10 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 gap-3">
              {actions.map((action, i) => (
                <Link
                  key={action.href}
                  href={action.href}
                  ref={i === 0 ? firstActionRef : undefined}
                  onClick={() => setIsActionMenuOpen(false)}
                  aria-label={action.label}
                  className="flex items-center gap-4 p-5 bg-white card-comic-clean active:scale-95 transition-all group focus:outline-none focus:ring-2 focus:ring-omuto-navy focus:ring-offset-2 rounded-xl"
                >
                  <div className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <span className="font-black uppercase text-sm tracking-tight text-omuto-navy">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav 
        role="navigation"
        aria-label="Main mobile navigation"
        className={cn(
          "mx-4 mb-4 bg-white border-xl border-omuto-navy shadow-comic rounded-3xl relative z-[800] transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "h-20 py-4 flex items-center justify-between px-4 opacity-100" : "h-2 py-0 opacity-60 pointer-events-none"
        )}
      >
        <Link
          href="/"
          aria-label="Go to HQ"
          aria-current={isActive('/') ? 'page' : undefined}
          className={cn('flex flex-col items-center justify-center flex-1 h-full transition-all', isActive('/') ? 'text-omuto-red scale-110' : 'text-omuto-navy/40')}
        >
          <Home className="w-6 h-6" aria-hidden="true" />
          <span className="text-[11px] font-black uppercase mt-1">HQ</span>
        </Link>

        <Link
          href="/meal"
          aria-label="Go to Impact"
          aria-current={isActive('/meal') ? 'page' : undefined}
          className={cn('flex flex-col items-center justify-center flex-1 h-full transition-all', isActive('/meal') ? 'text-omuto-red scale-110' : 'text-omuto-navy/40')}
        >
          <BarChart3 className="w-6 h-6" aria-hidden="true" />
          <span className="text-[11px] font-black uppercase mt-1">Impact</span>
        </Link>

        <button
          onClick={() => setIsActionMenuOpen((open) => !open)}
          aria-label={isActionMenuOpen ? 'Close quick actions menu' : 'Open quick actions menu'}
          aria-expanded={isActionMenuOpen}
          aria-haspopup="dialog"
          className="flex items-center justify-center -mt-12 group"
        >
          <div
            className={cn(
              'w-16 h-16 border-xl border-omuto-navy rounded-full flex items-center justify-center text-white transition-all transform active:scale-90 shadow-comic-sm',
              isActionMenuOpen ? 'bg-omuto-navy rotate-45' : 'bg-omuto-red rotate-0'
            )}
          >
            {isActionMenuOpen ? <X className="w-8 h-8 stroke-[3px]" /> : <Plus className="w-8 h-8 stroke-[3px]" />}
          </div>
          <span className="sr-only">Quick Actions</span>
        </button>

        <Link
          href="/profile?tab=tasks"
          aria-label="Go to Tasks"
          aria-current={isActive('/profile?tab=tasks') ? 'page' : undefined}
          className={cn('flex flex-col items-center justify-center flex-1 h-full transition-all', isActive('/profile?tab=tasks') ? 'text-omuto-red scale-110' : 'text-omuto-navy/40')}
        >
          <CheckCircle className="w-6 h-6" aria-hidden="true" />
          <span className="text-[11px] font-black uppercase mt-1">Tasks</span>
        </Link>

        <button onClick={() => setOpenMobile(true)} aria-label="Open more navigation options" className="flex flex-col items-center justify-center flex-1 h-full text-omuto-navy/40">
          <Menu className="w-6 h-6" aria-hidden="true" />
          <span className="text-[11px] font-black uppercase mt-1">More</span>
        </button>
      </nav>

      {/* Hide/Show toggle — pill button anchored to bottom center */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-[900] transition-all duration-300 ease-in-out",
          isExpanded ? "-top-3" : "bottom-2"
        )}
        aria-label={isExpanded ? 'Collapse mobile menu' : 'Expand mobile menu'}
      >
        <div className={cn(
          "flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-omuto-navy/20 shadow-md transition-all",
          isExpanded 
            ? "bg-white/90 backdrop-blur-sm hover:bg-white" 
            : "bg-omuto-red text-white border-omuto-navy hover:scale-105 shadow-comic-sm"
        )}>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors",
            isExpanded ? "bg-omuto-navy/30" : "bg-white"
          )} />
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.15em]",
            isExpanded ? "text-omuto-navy/50" : "text-white"
          )}>
            {isExpanded ? 'Hide' : 'Menu'}
          </span>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors",
            isExpanded ? "bg-omuto-navy/30" : "bg-white"
          )} />
        </div>
      </button>
    </div>
  );
}
