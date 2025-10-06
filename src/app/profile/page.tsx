'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { User, Mail, Briefcase, History } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { RecentCheckout } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserTasks } from '@/components/profile/user-tasks';

function RecentUserCheckouts() {
  const firestore = useFirestore();
  const { user } = useUser();

  const checkoutsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'checkouts'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: checkouts, isLoading } =
    useCollection<RecentCheckout>(checkoutsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          My Recent Activity
        </CardTitle>
        <CardDescription>Your last 5 checkout reports.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-2 border-b pb-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        {checkouts && checkouts.length > 0 ? (
          checkouts.map((checkout) => (
            <div
              key={checkout.id}
              className="flex flex-col border-b pb-3 last:border-b-0"
            >
              <p className="text-sm text-muted-foreground">{checkout.task}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {checkout.timestamp
                  ? formatDistanceToNow(checkout.timestamp.toDate(), {
                      addSuffix: true,
                    })
                  : ''}
              </p>
            </div>
          ))
        ) : (
          !isLoading && (
            <p className="text-sm text-muted-foreground">
              No checkout reports found.
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}

function UserProfileCard() {
  const { user } = useUser();
  const [userRole, setUserRole] = useState('Staff');

  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then((idTokenResult) => {
        const role = (idTokenResult.claims.role as string) || 'Staff';
        setUserRole(role);
      });
    }
  }, [user]);

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    const name = user?.displayName;
    if (name) {
      const parts = name.split(' ');
      if (parts.length > 1) {
        return parts[0][0] + parts[parts.length - 1][0];
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
     <Card>
        <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt="User avatar" />}
                    <AvatarFallback className="text-3xl">{getInitials(user?.email)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-semibold">{user?.displayName || 'User'}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <Badge className="mt-4">{userRole}</Badge>
            </div>
            <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center">
                    <User className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{user?.displayName || 'Not specified'}</span>
                </div>
                    <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{user?.email}</span>
                </div>
                    <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{userRole}</span>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">User since {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</p>
        </CardFooter>
    </Card>
  )
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          My Profile & Tasks
        </h1>
        <p className="text-muted-foreground">
          Your personal information, tasks, and recent activity.
        </p>
      </header>
       <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile & Activity</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                <div className="lg:col-span-1">
                    <UserProfileCard />
                </div>
                <div className="lg:col-span-2">
                    <RecentUserCheckouts />
                </div>
            </div>
        </TabsContent>
        <TabsContent value="tasks">
            <UserTasks />
        </TabsContent>
       </Tabs>
    </div>
  );
}
