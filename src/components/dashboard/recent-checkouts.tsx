'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { RecentCheckout } from '@/lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { tagColors } from '@/lib/data';

function CheckoutItem({ checkout }: { checkout: RecentCheckout }) {
  const timeAgo = checkout.timestamp ? formatDistanceToNow(checkout.timestamp.toDate(), { addSuffix: true }) : 'Just now';

  const tag = checkout.task.split(' ')[0].startsWith('#') ? checkout.task.split(' ')[0] : '#Update';
  const taskText = checkout.task.startsWith('#') ? checkout.task.substring(tag.length).trim() : checkout.task;
  const colorClass = tagColors[tag as keyof typeof tagColors] || tagColors['#Update'];


  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-9 w-9 border" data-ai-hint="person avatar">
        <AvatarImage src={checkout.avatar} alt="Avatar" />
        <AvatarFallback>{checkout.role}</AvatarFallback>
      </Avatar>
      <div className="grid gap-1">
        <p className="text-sm font-medium leading-none">{checkout.name}</p>
        <p className="text-sm text-muted-foreground">{taskText}</p>
      </div>
      <div className="ml-auto text-right">
        <div className="text-sm text-muted-foreground whitespace-nowrap">{timeAgo}</div>
        <Badge variant="outline" className={`mt-1 ${colorClass}`}>{tag}</Badge>
      </div>
    </div>
  );
}


export function RecentCheckouts() {
  const firestore = useFirestore();

  const checkoutsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10));
  }, [firestore]);

  const { data: checkouts, isLoading } = useCollection<RecentCheckout>(checkoutsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Activity Feed</CardTitle>
        <CardDescription>Real-time updates from departments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
            Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[250px]" />
                    </div>
                    <div className="space-y-2 text-right">
                        <Skeleton className="h-4 w-[60px] ml-auto" />
                        <Skeleton className="h-5 w-[80px] ml-auto" />
                    </div>
                </div>
            ))
        )}
        {checkouts && checkouts.length > 0 ? (
          checkouts.map((checkout) => <CheckoutItem key={checkout.id} checkout={checkout} />)
        ) : (
          !isLoading && <p className="text-sm text-muted-foreground text-center py-4">No activity yet today.</p>
        )}
      </CardContent>
    </Card>
  );
}
