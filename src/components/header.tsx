
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Settings, Bell, PlusCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth, useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Badge } from './ui/badge';
import { useUserProfile } from '@/hooks/use-user-profile';
import Link from 'next/link';
import { collection, query, limit } from 'firebase/firestore';
import type { Alert } from '@/lib/types';


export function AppHeader() {
    const { user } = useUser();
    const { profile } = useUserProfile(user);
    const firestore = useFirestore();

    // In a real app, we'd add a 'read' flag and filter by `where('read', '==', false)`.
    // For now, we'll just check if there are any alerts at all to show the badge.
    const unreadAlertsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        // This is a simplified logic. A real implementation would filter by user and read status.
        return query(collection(firestore, 'alerts'), limit(1));
    }, [user, firestore]);

    const { data: unreadAlerts } = useCollection<Alert>(unreadAlertsQuery);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
       <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        <p className="hidden md:block text-sm text-muted-foreground font-medium">Empowering Youth. Building Sustainable Communities.</p>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            {unreadAlerts && unreadAlerts.length > 0 && (
                 <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/80"></span>
                </span>
            )}
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forms">
            <PlusCircle className="h-5 w-5" />
            <span className="sr-only">Quick Add</span>
          </Link>
        </Button>
        <UserMenu user={user} profile={profile} />
      </div>
    </header>
  );
}

function UserMenu({ user, profile }: { user: any, profile: any }) {
  const auth = useAuth();

  const handleLogout = () => {
    if(auth) {
      signOut(auth);
    }
  };
  
  const getInitials = (name?: string, email?: string) => {
    if (name) {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return parts[0][0] + parts[parts.length - 1][0];
        }
        return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full"
        >
          <Avatar className="h-9 w-9" data-ai-hint="user avatar">
            {user?.photoURL && <AvatarImage src={user.photoURL} alt="User avatar" />}
            <AvatarFallback>{getInitials(profile?.name, user?.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10" data-ai-hint="user avatar">
              {user?.photoURL && <AvatarImage src={user.photoURL} alt="User avatar" />}
              <AvatarFallback>{getInitials(profile?.name, user?.email)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
           </div>
        </DropdownMenuLabel>
         <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <Badge>{profile?.role || 'Staff'}</Badge>
          </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
