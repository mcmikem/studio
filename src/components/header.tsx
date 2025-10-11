
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Settings, Bell, PlusCircle, Receipt, FolderKanban } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth, useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Badge } from './ui/badge';
import { useUserProfile } from '@/hooks/use-user-profile';
import Link from 'next/link';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import type { Alert as AlertType } from '@/lib/types';
import { formatDateSafe } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { alertIcons } from '@/lib/data';


function QuickAddMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon">
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">Quick Add</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Quick Add</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/forms?tab=expense">
                            <Receipt className="mr-2 h-4 w-4" />
                            <span>New Expense Report</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/management/programs">
                            <FolderKanban className="mr-2 h-4 w-4" />
                            <span>New Program</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function NotificationsMenu() {
    const firestore = useFirestore();
    const { user } = useUser();
    
    // In a real app, we'd add a 'read' flag and filter by `where('read', '==', false)`.
    const alertsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'alerts'), orderBy('createdAt', 'desc'), limit(5));
    }, [user, firestore]);

    const { data: alerts, isLoading } = useCollection<AlertType>(alertsQuery);
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {alerts && alerts.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                        <span>Recent Notifications</span>
                        {alerts && alerts.length > 0 && <Badge>{alerts.length}</Badge>}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {isLoading && (
                        <div className="p-2 space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    )}
                    {alerts && alerts.length > 0 ? (
                        alerts.map(alert => (
                            <DropdownMenuItem key={alert.id} asChild className="h-auto items-start">
                                <Link href={alert.action} className="flex gap-3 py-2">
                                     <div className="mt-1">{alertIcons[alert.type]}</div>
                                     <div>
                                        <p className="text-sm font-medium leading-snug whitespace-normal">{alert.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDateSafe(alert.createdAt)}</p>
                                     </div>
                                </Link>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        !isLoading && <p className="p-4 text-sm text-center text-muted-foreground">No new notifications.</p>
                    )}
                </DropdownMenuGroup>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link href="/notifications" className="justify-center">
                        View all notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
       <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        <p className="hidden md:block text-sm text-muted-foreground font-medium">Empowering Youth. Building Sustainable Communities.</p>
      </div>
      <div className="flex items-center gap-2">
        <QuickAddMenu />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const auth = useAuth();

  const handleLogout = () => {
    if(auth) {
      signOut(auth);
    }
  };
  
  const getInitials = (name?: string, email?: string) => {
    if (name) {
        const parts = name.split(' ');
        if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
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
