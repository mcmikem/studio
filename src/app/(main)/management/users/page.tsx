'use client';

import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Users as UsersIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';

const userRoles = [
    'Executive Director',
    'Programs & Partnerships Manager',
    'Operations & Field Manager',
    'Resource Mobilization Lead',
    'Media & Communications Lead',
    'Field Coordinator',
    'Administrator',
    'Intern',
    'Volunteer'
];

export default function UserManagementPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('name'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const parentRefMobile = useRef<HTMLDivElement>(null);
  const parentRefDesktop = useRef<HTMLDivElement>(null);

  const virtualizerMobile = useVirtualizer({
    count: users?.length || 0,
    getScrollElement: () => parentRefMobile.current,
    estimateSize: () => 100, // Approximate height of a mobile user card
    overscan: 5,
  });

  const virtualizerDesktop = useVirtualizer({
    count: users?.length || 0,
    getScrollElement: () => parentRefDesktop.current,
    estimateSize: () => 73, // Approximate height of a table row
    overscan: 5,
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { role: newRole })
      .then(() => {
        toast({
          title: 'Role Updated',
          description: "The user's role has been successfully changed.",
        });
      })
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update user role. Please try again.',
        });
        console.error('Failed to update role:', error);
      });
  };
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View, manage, and edit roles for all team members in the system.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
         {/* Mobile View */}
        <div className="sm:hidden h-[600px] overflow-auto px-4" ref={parentRefMobile}>
            {isLoading && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-20 w-full mb-4" />)}
            {users && users.length > 0 ? (
                <div
                    style={{
                        height: `${virtualizerMobile.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualizerMobile.getVirtualItems().map((virtualItem) => {
                        const user = users[virtualItem.index];
                        return (
                            <div
                                key={virtualItem.key}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualItem.start}px)`,
                                    paddingBottom: '16px'
                                }}
                            >
                                <Card key={user.id} className="p-4 border-lg shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                                                <AvatarImage src={user.photoURL} alt={user.name} />
                                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-bold truncate">{user.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-wider">{user.role}</Badge>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {userRoles.map(role => (
                                                    <DropdownMenuItem key={role} onSelect={() => handleRoleChange(user.id, role)} disabled={user.role === role}>
                                                        {role} {user.role === role && '(Current)'}
                                                    </DropdownMenuItem>
                                                ))}
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            ) : (
                !isLoading && (
                    <EmptyState
                        icon={UsersIcon}
                        title="No Users Found"
                        description="Could not find any users in the database."
                        className="py-12"
                    />
                )
            )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block">
            <div className="border border-omuto-navy/10 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-[1fr,200px,100px] gap-4 px-6 py-4 bg-muted/40 border-b border-omuto-navy/10 font-bold uppercase text-[10px] tracking-widest text-omuto-navy/60">
                    <div>User</div>
                    <div>Role</div>
                    <div className="text-right">Actions</div>
                </div>
                <div className="h-[600px] overflow-auto no-scrollbar" ref={parentRefDesktop}>
                    {isLoading && Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-[1fr,200px,100px] gap-4 px-6 py-4 border-b border-omuto-navy/5 last:border-0 items-center">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-8 w-8 ml-auto" />
                        </div>
                    ))}
                    {users && users.length > 0 ? (
                        <div
                            style={{
                                height: `${virtualizerDesktop.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {virtualizerDesktop.getVirtualItems().map((virtualItem) => {
                                const user = users[virtualItem.index];
                                return (
                                    <div
                                        key={virtualItem.key}
                                        className="grid grid-cols-[1fr,200px,100px] gap-4 px-6 py-4 border-b border-omuto-navy/5 last:border-0 items-center hover:bg-muted/10 transition-colors"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualItem.size}px`,
                                            transform: `translateY(${virtualItem.start}px)`,
                                        }}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-10 w-10 border-md border-omuto-navy/10 shadow-sm" data-ai-hint="person avatar">
                                                <AvatarImage src={user.photoURL} alt={user.name} />
                                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-omuto-navy truncate">{user.name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <Badge variant="secondary" className="bg-omuto-navy/5 text-omuto-navy border-none font-bold text-[10px] uppercase">{user.role}</Badge>
                                        </div>
                                        <div className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-omuto-navy/5 rounded-xl">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {userRoles.map(role => (
                                                        <DropdownMenuItem key={role} onSelect={() => handleRoleChange(user.id, role)} disabled={user.role === role}>
                                                            {role} {user.role === role && '(Current)'}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        !isLoading && (
                            <div className="flex flex-col items-center justify-center h-48">
                                <UsersIcon className="h-12 w-12 text-muted-foreground/30 mb-2" />
                                <p className="text-muted-foreground font-bold">No Users Found</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
