'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { RecentCheckout } from '@/lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

function CheckoutItem({ checkout }: { checkout: RecentCheckout }) {
  const timeAgo = checkout.timestamp ? formatDistanceToNow(checkout.timestamp.toDate(), { addSuffix: true }) : 'Just now';

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-9 w-9 border" data-ai-hint="person avatar">
        <AvatarImage src={checkout.avatar} alt="Avatar" />
        <AvatarFallback>{checkout.role}</AvatarFallback>
      </Avatar>
      <div className="grid gap-1">
        <p className="text-sm font-medium leading-none">{checkout.name}</p>
        <p className="text-sm text-muted-foreground">{checkout.task}</p>
      </div>
      <div className="ml-auto text-sm text-muted-foreground">{timeAgo}</div>
    </div>
  );
}


export function RecentCheckouts() {
  const firestore = useFirestore();

  const checkoutsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(5));
  }, [firestore]);

  const { data: checkouts, isLoading } = useCollection<RecentCheckout>(checkoutsQuery);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Recent Check-outs</CardTitle>
        <CardDescription>Latest updates from the team at the end of the day.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
            <>
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[250px]" />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[250px]" />
                    </div>
                </div>
            </>
        )}
        {checkouts && checkouts.length > 0 ? (
          checkouts.map((checkout) => <CheckoutItem key={checkout.id} checkout={checkout} />)
        ) : (
          !isLoading && <p className="text-sm text-muted-foreground text-center py-4">No check-outs yet today.</p>
        )}
      </CardContent>
    </Card>
  );
}
