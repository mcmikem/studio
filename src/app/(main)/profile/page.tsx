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
import { useUser, useFirestore, useCollection, updateDocumentNonBlocking, useFirebaseApp, useMemoFirebase } from '@/firebase';
import { User, Mail, Briefcase, History, Loader2, Upload, ChevronDown, LogOut as LogOutIcon, Settings, ChevronsUpDown, Eye, BarChart3 } from 'lucide-react';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import type { Checkout } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserTasks } from '@/components/profile/user-tasks';
import { useSearchParams } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { formatDateSafe } from '@/lib/utils';
import { Suspense, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadImageAndUpdateProfile } from '@/firebase/storage';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { UserPerformance } from '@/components/profile/user-performance';

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

function RecentUserCheckouts() {
  const { user } = useUser();

  const checkoutsQuery = useMemoFirebase((db) => {
    if (!user) return null;
    return query(
      collection(db, 'checkouts'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
  }, [user]); 

  const { data: checkouts, isLoading } =
    useCollection<Checkout>(checkoutsQuery);

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
          Array.from({ length: 5 }).map((_, i) => (
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
              <p className="text-sm text-muted-foreground">{(checkout.tasks && checkout.tasks[0]?.description) || 'No task description'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDateSafe(checkout.timestamp)}
              </p>
            </div>
          ))
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
              <History className="h-12 w-12" />
              <p className="mt-4 font-semibold">No Activity Yet</p>
              <p className="mt-1 text-sm">Complete your first checkout to see it here!</p>
            </div>
          )
        )}
      </CardContent>
       <CardFooter>
        <Button variant="link" asChild className="p-0 h-auto">
          <Link href="/stream">View all my activity</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function UserProfileCard() {
  const { user } = useUser();
  const { profile, isLoading } = useUserProfile(user);
  const { toast } = useToast();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string, email?: string | null) => {
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
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user && firestore && firebaseApp) {
      setIsUploading(true);
      try {
        await uploadImageAndUpdateProfile(firebaseApp, file, user, firestore);
        toast({
          title: "Profile Picture Updated!",
          description: "Your new picture has been saved.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: error.message || "Could not upload your picture. Please try again.",
        });
      } finally {
        setIsUploading(false);
        event.target.value = '';
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleRoleChange = (newRole: string) => {
    if (!user || !firestore || newRole === profile?.role) return;

    const userDocRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userDocRef, { role: newRole });
    toast({
        title: "Role Updated!",
        description: `Your role has been changed to ${newRole}. Your dashboard and navigation will now update.`,
    })
  }


  if (isLoading) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-8 w-40 mb-2" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-10 w-48 mt-4" />
                </div>
                 <div className="mt-6 space-y-4 text-sm">
                    <div className="flex items-center">
                        <User className="h-4 w-4 mr-3 text-muted-foreground" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                        <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                        <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-3 text-muted-foreground" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                </div>
            </CardContent>
             <CardFooter>
                <Skeleton className="h-4 w-36" />
            </CardFooter>
        </Card>
    )
  }

  if (!profile) {
    return <Card><CardContent><p className="p-6 text-center text-muted-foreground">Could not load user profile.</p></CardContent></Card>
  }

  return (
     <Card>
        <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                        {(profile?.photoURL || user?.photoURL) && <AvatarImage src={profile?.photoURL || user?.photoURL || ''} alt="User avatar" />}
                        <AvatarFallback className="text-3xl">{getInitials(profile?.name, user?.email)}</AvatarFallback>
                    </Avatar>
                     <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8 text-white" />
                      )}
                    </div>
                </div>
                 <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/gif"
                />

                <h2 className="text-2xl font-semibold">{profile?.name || 'User'}</h2>
                <p className="text-muted-foreground">{profile?.email}</p>
                
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="outline" className="mt-4">
                            {profile?.role}
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Change My Role</DropdownMenuLabel>
                        <DropdownMenuGroup>
                          {userRoles.map(role => (
                              <DropdownMenuItem key={role} onSelect={() => handleRoleChange(role)} disabled={role === profile.role}>
                                  {role}
                              </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
            <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center">
                    <User className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{profile?.name || 'Not specified'}</span>
                </div>
                    <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{profile?.email}</span>
                </div>
                    <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{profile?.role}</span>
                </div>
                <div className="flex items-center">
                    <History className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>User since {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
        </CardContent>
    </Card>
  )
}

function ProfilePageContent() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'profile';
    const { user } = useUser();

    if (!user) {
        return <Loader2 className="h-8 w-8 animate-spin" />
    }

    return (
        <div className="flex flex-col gap-6">
        <header>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
            My Profile &amp; Tasks
            </h1>
            <p className="text-muted-foreground">
            Your personal information, tasks, and activity.
            </p>
        </header>
        <Tabs defaultValue={tab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile &amp; Activity</TabsTrigger>
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
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
                <UserTasks userId={user.uid} />
            </TabsContent>
            <TabsContent value="performance">
                 <div className="mt-4">
                    <UserPerformance userId={user.uid} />
                 </div>
            </TabsContent>
        </Tabs>
        </div>
    );
}


export default function ProfilePage() {
  return (
    <Suspense>
        <ProfilePageContent />
    </Suspense>
  );
}
