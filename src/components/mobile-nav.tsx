

'use client';

import { Home, ClipboardEdit, Rss, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './ui/sidebar';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';

const navItems = [
  { href: '/forms', label: 'Forms', icon: ClipboardEdit },
  { href: '/stream', label: 'Stream', icon: Rss },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { user } = useUser();
  const { profile } = useUserProfile(user);

  const HomeIcon = () => (
    <Link href="/" className={cn(
        'inline-flex flex-col items-center justify-center px-5 group relative',
         pathname === '/' ? 'text-accent' : 'text-muted-foreground'
    )}>
        {pathname === '/' && <div className="absolute top-0 h-1 w-8 bg-accent rounded-b-full" />}
        <Avatar className="h-7 w-7 mb-1 border-2" data-ai-hint="user avatar">
            <AvatarImage src={user?.photoURL || ''} alt={profile?.name || ''} />
            <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
        </Avatar>
      <span className="text-xs">Home</span>
    </Link>
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-20 bg-card border-t border-border/20 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)]">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        <HomeIcon />
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
