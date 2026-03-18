'use client';

import { Home, Menu, Plus, BarChart3, LogIn, LogOut, Receipt, MessageCircle, X, CheckCircle, LayoutDashboard, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './ui/sidebar';
import { useEffect, useState } from 'react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!isActionMenuOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsActionMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onEscape);
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
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-6 right-4 bg-white border-2 border-b-0 border-omuto-navy rounded-t-lg px-3 py-1 shadow-comic-sm z-[900]"
        aria-label={isExpanded ? 'Hide menu' : 'Show menu'}
      >
        {isExpanded ? <ChevronDown className="w-4 h-4 text-omuto-navy" /> : <ChevronUp className="w-4 h-4 text-omuto-navy" />}
      </button>
      
      {isActionMenuOpen && (
        <div
          className="fixed inset-0 bg-omuto-navy/80 backdrop-blur-sm z-[700] animate-in fade-in duration-300"
          onClick={() => setIsActionMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Quick actions"
        >
          <div
            className="absolute bottom-32 left-4 right-4 space-y-3 animate-in slide-in-from-bottom-10 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 gap-3">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={() => setIsActionMenuOpen(false)}
                  className="flex items-center gap-4 p-5 bg-white card-comic-clean active:scale-95 transition-all group"
                >
                  <div className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="font-black uppercase text-sm tracking-tight text-omuto-navy">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div 
        className={cn(
          "mx-4 mb-4 bg-white border-xl border-omuto-navy shadow-comic rounded-3xl relative z-[800] transition-all duration-300 overflow-hidden",
          isExpanded ? "h-20 py-4 flex items-center justify-between px-4" : "h-0 py-0 border-none shadow-none"
        )}
      >
        <Link
          href="/"
          aria-label="Go to HQ"
          className={cn('flex flex-col items-center justify-center flex-1 h-full transition-all', isActive('/') ? 'text-omuto-red scale-110' : 'text-omuto-navy/40')}
        >
          <Home className="w-6 h-6" />
          <span className="text-[11px] font-black uppercase mt-1">HQ</span>
        </Link>

        <Link
          href="/meal"
          aria-label="Go to Impact"
          className={cn('flex flex-col items-center justify-center flex-1 h-full transition-all', isActive('/meal') ? 'text-omuto-red scale-110' : 'text-omuto-navy/40')}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[11px] font-black uppercase mt-1">Impact</span>
        </Link>

        <button
          onClick={() => setIsActionMenuOpen((open) => !open)}
          aria-label={isActionMenuOpen ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={isActionMenuOpen}
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
          <div className="absolute -bottom-6 w-max bg-omuto-navy text-white text-[10px] font-black px-2 py-0.5 rounded shadow-comic-sm opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest border border-white/20">
            Quick Actions
          </div>
        </button>

        <Link
          href="/profile?tab=tasks"
          aria-label="Go to Tasks"
          className={cn('flex flex-col items-center justify-center flex-1 h-full transition-all', isActive('/profile?tab=tasks') ? 'text-omuto-red scale-110' : 'text-omuto-navy/40')}
        >
          <CheckCircle className="w-6 h-6" />
          <span className="text-[11px] font-black uppercase mt-1">Tasks</span>
        </Link>

        <button onClick={() => setOpenMobile(true)} aria-label="Open more navigation" className="flex flex-col items-center justify-center flex-1 h-full text-omuto-navy/40">
          <Menu className="w-6 h-6" />
          <span className="text-[11px] font-black uppercase mt-1">More</span>
        </button>
      </div>
    </div>
  );
}
