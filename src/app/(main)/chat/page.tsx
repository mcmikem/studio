
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Message } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateSafe } from '@/lib/utils';
import { marked } from 'marked';

function MessageItem({ message }: { message: Message }) {
  const { user } = useUser();
  const isCurrentUser = user?.uid === message.userId;
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  // Sanitize and render markdown content
  const renderedText = { __html: marked.parse(message.text) as string };

  return (
    <div className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 border" data-ai-hint="person avatar">
        <AvatarImage src={message.userAvatar} />
        <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
      </Avatar>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        <div
          className="prose prose-sm dark:prose-invert"
          dangerouslySetInnerHTML={renderedText}
        />
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {formatDateSafe(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'messages'), orderBy('createdAt', 'asc'));
  }, [firestore]);

  const { data: messages, isLoading } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    // Scroll to the bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile) return;

    setIsSending(true);
    const messageData = {
      text: newMessage,
      userId: user.uid,
      userName: profile.name,
      userAvatar: user.photoURL || '',
      createdAt: serverTimestamp(),
    };

    const messagesCollection = collection(firestore, 'messages');
    try {
      await addDocumentNonBlocking(messagesCollection, messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally, show a toast notification for the error
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Chat & Team Space
        </h1>
        <p className="text-muted-foreground">
          Real-time communication and collaboration for the Omuto team.
        </p>
      </header>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {isLoading && (
                <>
                  <Skeleton className="h-16 w-3/4" />
                  <Skeleton className="h-16 w-3/4 ml-auto" />
                  <Skeleton className="h-16 w-3/4" />
                </>
              )}
              {messages && messages.map(msg => (
                <MessageItem key={msg.id} message={msg} />
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                className="min-h-0 h-12 resize-none"
                disabled={!user}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
