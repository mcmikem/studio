
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
import { Send, MessageSquare, Wand } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import type { Message } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateSafe } from '@/lib/utils';
import { marked } from 'marked';
import { omutoAIFlow } from '@/ai/flows/omuto-ai-flow';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


function MessageItem({ message }: { message: Message }) {
  const { user } = useUser();
  const isCurrentUser = user?.uid === message.userId;
  const isAI = message.userId === 'omuto-ai';
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  const renderedText = { __html: marked.parse(message.text || "") as string };

  return (
    <div className={cn('flex items-start gap-3', isCurrentUser && 'flex-row-reverse', isAI && 'justify-start')}>
      <Avatar className="h-8 w-8 border" data-ai-hint="person avatar">
         {isAI ? (
            <AvatarFallback className="bg-primary/20 text-primary"><Wand className="h-4 w-4" /></AvatarFallback>
        ) : (
          <>
            <AvatarImage src={message.userAvatar} />
            <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
          </>
        )}
      </Avatar>
      <div className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2', 
          isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
          isAI && 'bg-background border'
        )}>
        <p className="font-semibold text-xs mb-1">{isAI ? "Omuto AI" : message.userName}</p>
        <div
          className="prose prose-sm dark:prose-invert max-w-full"
          dangerouslySetInnerHTML={renderedText}
        />
        <p className={cn(
            'text-xs mt-1', 
            isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
            isAI && 'text-muted-foreground'
            )}>
          {formatDateSafe(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile, isLoading: isLoadingProfile } = useUserProfile(user);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'messages'), orderBy('createdAt', 'asc'));
  }, [firestore]);

  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile || !firestore) return;

    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    
    const messagesCollection = collection(firestore, 'messages');
    
    const userMessageData = {
      text: text,
      userId: user.uid,
      userName: profile.name,
      userAvatar: user.photoURL || '',
      createdAt: serverTimestamp(),
    };
    
    // Add user's message to Firestore immediately.
    await addDoc(messagesCollection, userMessageData);

    // If message starts with @omuto, it's a query for the AI
    if (text.startsWith('@omuto')) {
      try {
        const question = text.replace('@omuto', '').trim();
        
        // Construct history for AI, ensuring it matches the expected schema
        const aiHistory = messages
          ?.filter(m => m.userId === user.uid || m.userId === 'omuto-ai')
          .map(m => ({
            role: m.userId === 'omuto-ai' ? 'model' as const : 'user' as const,
            content: [{ text: m.text }]
          })) || [];

        const aiResponse = await omutoAIFlow({ question, history: aiHistory });
        
        if(aiResponse.answer) {
            const aiMessageData = {
              text: aiResponse.answer,
              userId: 'omuto-ai',
              userName: 'Omuto AI',
              userAvatar: '', // AI has no avatar
              createdAt: serverTimestamp(),
            };
            await addDoc(messagesCollection, aiMessageData);
        }

      } catch (error) {
        console.error('Error with Omuto AI:', error);
        const errorMessageData = {
            text: "Sorry, I encountered an error and couldn't process your request.",
            userId: 'omuto-ai',
            userName: 'Omuto AI',
            userAvatar: '',
            createdAt: serverTimestamp(),
        };
        await addDoc(messagesCollection, errorMessageData);
      }
    }

    setIsSending(false);
  };

  const isSendDisabled = !newMessage.trim() || isSending || isLoadingProfile || !profile;

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
              {isLoadingMessages && (
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
          
          <div className="p-4 border-t space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/50 text-primary">
                <Wand className="h-3 w-3 mr-1.5"/>
                Start with <span className="font-bold mx-1">@omuto</span> to ask the AI
              </Badge>
            </div>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Textarea
                placeholder={
                    isLoadingProfile ? "Loading profile..." : 
                    !user ? "You must be logged in to chat." : 
                    "Type your message or ask @omuto..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isSendDisabled) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                className="min-h-0 h-12 resize-none"
                disabled={isLoadingProfile || !user}
              />
              <Button type="submit" size="icon" disabled={isSendDisabled}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
