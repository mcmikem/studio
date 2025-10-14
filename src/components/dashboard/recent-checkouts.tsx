
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { RecentCheckout } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { tagColors } from '@/lib/data';
import { formatDateSafe } from '@/lib/utils';
import { MessageSquareText } from 'lucide-react';

function CheckoutItem({ checkout }: { checkout: RecentCheckout }) {
  const timeAgo = formatDateSafe(checkout.timestamp);

  // Extract all hashtags from the task
  const tags = checkout.task?.match(/#\w+/g) || [];
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-9 w-9 border" data-ai-hint="person avatar">
        <AvatarImage src={checkout.avatar} alt="Avatar" />
        <AvatarFallback>{getInitials(checkout.name)}</AvatarFallback>
      </Avatar>
      <div className="grid gap-1 flex-1">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">{checkout.name}</p>
            <div className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</div>
        </div>
        <p className="text-sm text-muted-foreground">{checkout.task}</p>
         {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
                {tags.map(tag => (
                    <Badge key={tag} variant="outline" className={tagColors[tag as keyof typeof tagColors] || tagColors['#Update']}>
                        {tag}
                    </Badge>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}


export function RecentCheckouts({ checkouts }: { checkouts: RecentCheckout[] | null }) {

  return (
      <div className="space-y-4">
        {!checkouts ? (
            Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[250px]" />
                    </div>
                </div>
            ))
        ) : checkouts.length > 0 ? (
          checkouts.map((checkout) => <CheckoutItem key={checkout.id} checkout={checkout} />)
        ) : (
            <div className="flex flex-col items-center justify-center h-24 text-center text-muted-foreground">
                <MessageSquareText className="h-8 w-8" />
                <p className="mt-2 text-sm">No activity yet today. Post an update to get started!</p>
            </div>
        )}
      </div>
  );
}
