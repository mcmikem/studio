

'use client';

import { Home, ClipboardEdit, Rss, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './ui/sidebar';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/forms', label: 'Forms', icon: ClipboardEdit },
  { href: '/stream', label: 'Stream', icon: Rss },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-20 bg-card border-t border-border/20 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)]">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 group relative',
                isActive
                  ? 'text-accent'
                  : 'text-muted-foreground'
              )}
            >
              {isActive && <div className="absolute top-0 h-1 w-8 bg-accent rounded-b-full" />}
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
         <button
            onClick={() => setOpenMobile(true)}
            className="inline-flex flex-col items-center justify-center px-5 text-muted-foreground"
          >
            <Menu className="w-6 h-6 mb-1" />
            <span className="text-xs">More</span>
          </button>
      </div>
    </div>
  );
}
