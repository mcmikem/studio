
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateSafe } from '@/lib/utils';
import { Send, MessageSquare } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Skeleton } from './skeleton';
import { useToast } from '@/hooks/use-toast';

interface Comment {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar: string;
    createdAt: any;
    targetId: string;
}

interface CommentsSectionProps {
    targetId: string;
    targetCollection: string;
    title?: string;
}

export function CommentsSection({ targetId, targetCollection, title = "Discussion" }: CommentsSectionProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { profile } = useUserProfile(user);
    const { toast } = useToast();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Query comments for this specific target
    const q = firestore ? query(
        collection(firestore, 'comments'), 
        where('targetId', '==', targetId), 
        where('targetCollection', '==', targetCollection),
        orderBy('createdAt', 'desc'),
        limit(20)
    ) : null;

    const { data: comments, isLoading } = useCollection<Comment>(q);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user || !profile || !firestore) return;

        setIsSubmitting(true);
        try {
            await addDocumentNonBlocking(collection(firestore, 'comments'), {
                text: newComment,
                userId: user.uid,
                userName: profile.name,
                userAvatar: user.photoURL || '',
                createdAt: serverTimestamp(),
                targetId,
                targetCollection
            });
            setNewComment('');
            toast({ title: "Comment Added" });
        } catch (error) {
            console.error("Failed to add comment:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not post comment." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2);

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> {title}
            </h4>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {isLoading && <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>}
                
                {comments && comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 text-sm">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.userAvatar} />
                                <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">{comment.userName}</span>
                                    <span className="text-xs text-muted-foreground">{formatDateSafe(comment.createdAt)}</span>
                                </div>
                                <p className="text-muted-foreground">{comment.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    !isLoading && <p className="text-sm text-muted-foreground italic">No comments yet. Be the first!</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea 
                    placeholder="Add a comment..." 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="min-h-[2.5rem] py-2 resize-none text-sm"
                />
                <Button type="submit" size="icon" disabled={isSubmitting || !newComment.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
