'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { RecentCheckout } from '@/lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { tagColors } from '@/lib/data';
import { MessageSquareText } from 'lucide-react';

function CheckoutItem({ checkout }: { checkout: RecentCheckout }) {
  const timeAgo = checkout.timestamp ? formatDistanceToNow(checkout.timestamp.toDate(), { addSuffix: true }) : 'Just now';

  // Extract all hashtags from the task
  const tags = checkout.task?.match(/#\w+/g) || [];
  const primaryTag = tags[0] || '#Update';
  const colorClass = tagColors[primaryTag as keyof typeof tagColors] || tagColors['#Update'];

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-9 w-9 border" data-ai-hint="person avatar">
        <AvatarImage src={checkout.avatar} alt="Avatar" />
        <AvatarFallback>{checkout.role}</AvatarFallback>
      </Avatar>
      <div className="grid gap-1 flex-1">
        <p className="text-sm font-medium leading-none">{checkout.name}</p>
        <p className="text-sm text-muted-foreground">{checkout.task}</p>
      </div>
      <div className="ml-auto text-right flex-shrink-0">
        <div className="text-sm text-muted-foreground whitespace-nowrap">{timeAgo}</div>
        <Badge variant="outline" className={`mt-1 ${colorClass}`}>{primaryTag}</Badge>
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
      <div className="space-y-4">
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
          !isLoading && (
            <div className="flex flex-col items-center justify-center h-24 text-center text-muted-foreground">
                <MessageSquareText className="h-8 w-8" />
                <p className="mt-2 text-sm">No activity yet today. Post an update to get started!</p>
            </div>
          )
        )}
      </div>
  );
}
