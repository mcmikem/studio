
'use client';

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
    'Media & Finance Lead',
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
      <CardContent>
         {/* Mobile View */}
        <div className="space-y-4 sm:hidden">
            {isLoading && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            {users?.map(user => (
                <Card key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                                <AvatarImage src={user.photoURL} alt={user.name} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {userRoles.map(role => (
                                <DropdownMenuItem key={role} onSelect={() => handleRoleChange(user.id, role)} disabled={user.role === role}>
                                    {user.role === role ? `Set as ${role} (Current)` : `Set as ${role}`}
                                </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                     <Badge variant="secondary" className="mt-2">{user.role}</Badge>
                </Card>
            ))}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                            <AvatarImage src={user.photoURL} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {userRoles.map(role => (
                                <DropdownMenuItem key={role} onSelect={() => handleRoleChange(user.id, role)} disabled={user.role === role}>
                                    {user.role === role ? `Set as ${role} (Current)` : `Set as ${role}`}
                                </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48">
                        <EmptyState
                            icon={UsersIcon}
                            title="No Users Found"
                            description="Could not find any users in the database."
                            className="min-h-0"
                        />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
