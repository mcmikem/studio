
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import type { Feedback } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Bug, Lightbulb, Check, Clock, X, MessageSquare } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const typeIcons: { [key: string]: React.ReactNode } = {
    bug: <Bug className="h-5 w-5 text-red-500" />,
    feature: <Lightbulb className="h-5 w-5 text-blue-500" />,
    ai: <MessageSquare className="h-5 w-5 text-purple-500" />,
};

const statusColors: { [key: string]: string } = {
  New: 'border-blue-500 bg-blue-500/10 text-blue-500',
  'In Progress': 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  Done: 'border-green-500 bg-green-500/10 text-green-500',
  Rejected: 'border-red-500 bg-red-500/10 text-red-500',
};

const statusIcons: { [key: string]: React.ReactNode } = {
  New: <Lightbulb className="h-4 w-4" />,
  'In Progress': <Clock className="h-4 w-4" />,
  Done: <Check className="h-4 w-4" />,
  Rejected: <X className="h-4 w-4" />,
};

export default function FeedbackPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const feedbackQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feedback'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: feedbacks, isLoading } = useCollection<Feedback>(feedbackQuery);

  const handleStatusChange = async (feedbackId: string, status: Feedback['status']) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'feedback', feedbackId);
    try {
      await updateDoc(docRef, { status });
      toast({ title: 'Status Updated', description: 'The feedback item has been updated.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Update Failed' });
    }
  };


  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">System Feedback</h1>
        <p className="text-muted-foreground">
          A log of all user-submitted bug reports, feature requests, and AI feedback.
        </p>
      </header>
       <Card>
        <CardHeader>
          <CardTitle>Feedback Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          {!isLoading && feedbacks?.map(fb => (
            <div key={fb.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="pt-1">{typeIcons[fb.type]}</div>
                <div className="flex-1">
                    <p className="font-medium">{fb.description || `AI Feedback on: ${fb.flow}`}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Submitted by {fb.userName} on {formatDateSafe(fb.timestamp, 'dateOnly')}
                        {fb.type === 'ai' && (
                            <span className={fb.wasHelpful ? 'text-green-500' : 'text-red-500'}>
                                 - Marked as {fb.wasHelpful ? 'Helpful' : 'Not Helpful'}
                            </span>
                        )}
                    </p>
                    {fb.type === 'ai' && fb.comment && (
                        <blockquote className="mt-2 text-sm italic border-l-2 pl-2">"{fb.comment}"</blockquote>
                    )}
                </div>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-32 justify-between">
                       <div className="flex items-center gap-2">
                        {statusIcons[fb.status]}
                        {fb.status}
                       </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Object.keys(statusColors).map(status => (
                      <DropdownMenuItem key={status} onSelect={() => handleStatusChange(fb.id, status as Feedback['status'])}>
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          ))}
        </CardContent>
       </Card>
    </div>
  );
}

```
- src/components/forms/ofa/player-registration-form.tsx</file>
    <content><![CDATA[