
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { RecentCheckout, Checkout } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { tagColors } from '@/lib/data';
import { formatDateSafe } from '@/lib/utils';
import { MessageSquareText, Check, X } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';

function CheckoutItem({ checkout }: { checkout: Checkout }) {
  const timeAgo = formatDateSafe(checkout.timestamp);

  // Extract all hashtags from the task
  const completedTasks = checkout.tasks?.filter(t => t.status === 'Done') || [];
  const notCompletedTasks = checkout.tasks?.filter(t => t.status === 'Not Done') || [];
  
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
        <AvatarImage src={checkout.avatar} alt={checkout.name} />
        <AvatarFallback>{getInitials(checkout.name)}</AvatarFallback>
      </Avatar>
      <div className="grid gap-2 flex-1">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">{checkout.name}</p>
            <div className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</div>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
            {completedTasks.map((task, i) => (
                <div key={`done-${i}`} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{task.description}</span>
                </div>
            ))}
            {notCompletedTasks.map((task, i) => (
                <div key={`not-done-${i}`} className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="line-through">{task.description}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}


export function RecentCheckouts({ checkouts }: { checkouts: Checkout[] | null }) {

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
            <EmptyState 
                icon={MessageSquareText}
                title="No Activity Yet"
                description="No team members have checked out yet today. Updates will appear here live."
                className="min-h-0 py-10"
            />
        )}
      </div>
  );
}
