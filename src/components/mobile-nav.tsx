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
  const actionDialogRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isActionMenuOpen) return;

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

  const actions = [
    { href: '/daily-plan', label: 'Daily Planner', icon: LogIn, color: 'text-omuto-teal', bg: 'bg-omuto-teal/10' },
    { href: '/meal/activity', label: 'Log Impact', icon: BarChart3, color: 'text-omuto-red', bg: 'bg-omuto-red/10' },
    { href: '/enterprise/essentials/sales', label: 'Point of Sale', icon: Receipt, color: 'text-omuto-blue', bg: 'bg-omuto-blue/10' },
    { href: '/chat', label: 'AI Coach', icon: MessageCircle, color: 'text-omuto-brown', bg: 'bg-omuto-brown/10' },
  ];

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
            className="absolute bottom-24 left-4 right-4 animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2">
              {actions.map((action, i) => (
                <Link
                  key={action.href}
                  href={action.href}
                  ref={i === 0 ? firstActionRef : undefined}
                  onClick={() => setIsActionMenuOpen(false)}
                  aria-label={action.label}
                  className="flex items-center gap-3 p-3.5 bg-white border border-omuto-navy/8 rounded-xl active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className={`p-2 rounded-lg ${action.bg} ${action.color}`}>
                    <action.icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="font-medium text-xs text-omuto-navy leading-tight">{action.label}</span>
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
