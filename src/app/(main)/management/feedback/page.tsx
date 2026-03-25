
'use client';

import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bug, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FeedbackItem {
    id: string;
    type: 'bug' | 'feature';
    description: string;
    userId: string;
    userName: string;
    status: 'New' | 'In Progress' | 'Resolved';
    timestamp: any;
}

export default function FeedbackManagementPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const feedbackQuery = useMemoFirebase((db) => {
        return query(collection(db, 'feedback'), orderBy('timestamp', 'desc'));
    }, []);

    const { data: feedbackItems, isLoading } = useCollection<FeedbackItem>(feedbackQuery);

    const handleStatusUpdate = async (id: string, newStatus: 'In Progress' | 'Resolved') => {
        if (!firestore) return;
        const ref = doc(firestore, 'feedback', id);
        try {
            await updateDocumentNonBlocking(ref, { status: newStatus });
            toast({ title: "Status Updated", description: `Feedback marked as ${newStatus}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
    };

    if (isLoading) {
        return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-heading text-3xl font-bold tracking-tight">User Feedback</h1>
                <p className="text-muted-foreground">Manage bug reports and feature requests from the team.</p>
            </header>

            <div className="grid gap-4">
                {feedbackItems && feedbackItems.length > 0 ? (
                    feedbackItems.map((item) => (
                        <Card key={item.id} className="border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        {item.type === 'bug' ? <Bug className="text-red-500 h-5 w-5" /> : <MessageSquare className="text-blue-500 h-5 w-5" />}
                                        <CardTitle className="text-lg capitalize">{item.type} Report</CardTitle>
                                        <Badge variant={item.status === 'Resolved' ? 'secondary' : 'default'}>{item.status}</Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDateSafe(item.timestamp)}</span>
                                </div>
                                <CardDescription>Submitted by {item.userName}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm mb-4">{item.description}</p>
                                <div className="flex gap-2 justify-end">
                                    {item.status === 'New' && (
                                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item.id, 'In Progress')}>
                                            <Clock className="mr-2 h-4 w-4" /> Mark In Progress
                                        </Button>
                                    )}
                                    {item.status !== 'Resolved' && (
                                        <Button size="sm" onClick={() => handleStatusUpdate(item.id, 'Resolved')}>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Mark Resolved
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 text-muted-foreground">No feedback reports found.</div>
                )}
            </div>
        </div>
    );
}
