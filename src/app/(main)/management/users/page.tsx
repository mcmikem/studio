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
import { MoreHorizontal, Users as UsersIcon, TrendingUp, ShieldCheck, UserCheck, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/dashboard/stat-card';

const userRoles = [
    'Executive Director',
    'Programs & Partnerships Manager',
    'Operations & Field Manager',
    'Resource Mobilization Lead',
    'Media & Communications Lead',
    'Field Coordinator',
    'Administrator',
    'Intern',
    'Volunteer',
    'Board Chair',
    'Board Member'
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
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={UsersIcon}
        title="Team Directory"
        description="Manage organizational roles, access permissions, and staff onboarding for the Omuto ecosystem."
        breadcrumbs={[{ name: 'Dashboard', href: '/' }, { name: 'Management', href: '/management' }, { name: 'Users', href: '/management/users' }]}
      />

      {/* Staff Pulse Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={UsersIcon}
          label="Total Staff"
          value={isLoading ? '—' : (users?.length || 0)}
          trend="All active"
          color="text-blue-600"
          alertLevel="green"
        />
        <StatCard
          icon={ShieldCheck}
          label="Admins"
          value={isLoading ? '—' : (users?.filter(u => u.role === 'Administrator').length || 0)}
          trend="Privileged access"
          color="text-primary"
          alertLevel="yellow"
        />
        <StatCard
          icon={UserCheck}
          label="Field Team"
          value={isLoading ? '—' : (users?.filter(u => u.role.includes('Manager') || u.role.includes('Coordinator')).length || 0)}
          trend="Mission critical"
          color="text-emerald-600"
          alertLevel="green"
        />
        <StatCard
          icon={UserMinus}
          label="Recent Joins"
          value="2"
          trend="Onboarding..."
          color="text-amber-600"
          alertLevel="green"
        />
      </div>

      <Card className="border-lg border-omuto-navy/10 shadow-comic-sm overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem]">
        <CardHeader className="bg-omuto-cream/20 border-b-lg border-omuto-navy/5 p-8">
            <div className="flex items-center justify-between">
                <div>
                   <CardTitle className="text-2xl font-black tracking-tighter uppercase text-omuto-navy">Staff Registry</CardTitle>
                   <CardDescription className="font-bold text-omuto-navy/40 uppercase text-[10px] tracking-widest mt-1">
                      {isLoading ? 'Syncing...' : `${users?.length || 0} Team Members Active`}
                   </CardDescription>
                </div>
                <Button className="btn-omuto h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest shadow-sm">
                    Invite Member
                </Button>
            </div>
        </CardHeader>
      <CardContent className="p-0 sm:p-6">
         {/* Mobile View */}
        <div className="sm:hidden h-[50vh] sm:h-[600px] overflow-auto px-4" ref={parentRefMobile}>
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
            <div className="border border-omuto-navy/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm m-6 mt-0">
                <div className="grid grid-cols-[1fr,250px,100px] gap-4 px-8 py-5 bg-muted/20 border-b border-omuto-navy/5 font-black uppercase text-[10px] tracking-[0.2em] text-omuto-navy/30">
                    <div>Team Member</div>
                    <div>Organizational Role</div>
                    <div className="text-right">Manage</div>
                </div>
                <div className="h-[50vh] lg:h-[600px] overflow-auto no-scrollbar" ref={parentRefDesktop}>
                    {isLoading && Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-[1fr,250px,100px] gap-4 px-8 py-5 border-b border-omuto-navy/5 last:border-0 items-center">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-40 rounded-lg" />
                            <Skeleton className="h-10 w-10 ml-auto rounded-xl" />
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
                                        className="grid grid-cols-[1fr,250px,100px] gap-4 px-8 py-5 border-b border-omuto-navy/5 last:border-0 items-center hover:bg-white transition-all group"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualItem.size}px`,
                                            transform: `translateY(${virtualItem.start}px)`,
                                        }}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <Avatar className="h-12 w-12 border-2 border-white shadow-xl shadow-omuto-navy/10 group-hover:scale-105 transition-transform" data-ai-hint="person avatar">
                                                <AvatarImage src={user.photoURL} alt={user.name} />
                                                <AvatarFallback className="font-black text-xs">{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-heading text-base font-black text-omuto-navy truncate group-hover:text-primary transition-colors">{user.name}</p>
                                                <p className="text-[11px] font-bold text-omuto-navy/40 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <Badge variant="secondary" className="bg-omuto-navy/5 text-omuto-navy border-2 border-white shadow-sm font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-lg">{user.role}</Badge>
                                        </div>
                                        <div className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-omuto-navy/5 rounded-[1rem] transition-all">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl border-2 border-omuto-navy/5 shadow-2xl p-2 min-w-[200px]">
                                                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Change Mission Role</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-omuto-navy/5" />
                                                    {userRoles.map(role => (
                                                        <DropdownMenuItem 
                                                            key={role} 
                                                            onSelect={() => handleRoleChange(user.id, role)} 
                                                            disabled={user.role === role}
                                                            className="rounded-xl px-3 py-2 text-xs font-bold focus:bg-primary focus:text-white transition-colors cursor-pointer"
                                                        >
                                                            {role}
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
    </div>
  );
}
