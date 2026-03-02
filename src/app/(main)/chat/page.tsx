'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Wand, CalendarCheck, BarChart3, Lightbulb, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useUser, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, orderBy, serverTimestamp, addDoc, limit, getDocs, doc } from 'firebase/firestore';
import type { Message } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateSafe, cn } from '@/lib/utils';
import { marked } from 'marked';
import { omutoAI } from '@/ai/actions';
import { SmartReminders } from '@/components/dashboard/smart-reminders';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

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
          className="prose prose-sm dark:prose-invert max-w-full [&_p]:my-2"
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
  const { user } = useUser();
  const { profile, isLoading: isLoadingProfile } = useUserProfile(user);
  const { toast } = useToast();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Use a user-specific sub-collection for AI chats
  const messagesQuery = useMemoFirebase((db) => {
    if (!user) return null;
    return query(collection(db, 'users', user.uid, 'ai-chats'), orderBy('createdAt', 'asc'), limit(50));
  }, [user]);

  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || !profile || !firestore) return;

    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    
    const aiChatsCollection = collection(firestore, 'users', user.uid, 'ai-chats');
    
    const userMessageData = {
      text: text,
      userId: user.uid,
      userName: profile.name,
      userAvatar: user.photoURL || '',
      createdAt: serverTimestamp(),
    };
    
    addDoc(aiChatsCollection, userMessageData);

    try {
      // Construct history for AI from the private chat history
      const aiHistory = messages
        ?.map(m => ({
          role: m.userId === 'omuto-ai' ? 'model' as const : 'user' as const,
          content: [{ text: m.text }]
        })) || [];

      const aiResponse = await omutoAI({ question: text, history: aiHistory, userId: user.uid });
      
      if(aiResponse && aiResponse.answer) {
          const aiMessageData = {
            text: aiResponse.answer,
            userId: 'omuto-ai',
            userName: 'Omuto AI',
            userAvatar: '', // AI has no avatar
            createdAt: serverTimestamp(),
          };
          addDoc(aiChatsCollection, aiMessageData);
      }

    } catch (error: any) {
      console.error('Error with Omuto AI:', error);
      const errorMessageData = {
          text: `I'm sorry, I encountered a server error and couldn't complete your request. Please try again later.`,
          userId: 'omuto-ai',
          userName: 'Omuto AI',
          userAvatar: '',
          createdAt: serverTimestamp(),
      };
      addDoc(aiChatsCollection, errorMessageData);
    }

    setIsSending(false);
  };
  
  const handleQuickAction = (command: string) => {
      setNewMessage(command);
  }

  const handleClearChat = async () => {
      if (!firestore || !user) return;
      
      try {
          const q = query(collection(firestore, 'users', user.uid, 'ai-chats'));
          const snapshot = await getDocs(q);
          
          const deletePromises = snapshot.docs.map(docSnapshot => 
              deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'ai-chats', docSnapshot.id))
          );
          
          await Promise.all(deletePromises);
          
          toast({
              title: "Chat Cleared",
              description: "Your conversation history has been removed.",
          });
      } catch (error) {
          console.error("Failed to clear chat:", error);
          toast({
              variant: "destructive",
              title: "Error",
              description: "Could not clear chat history.",
          });
      }
  }

  const isSendDisabled = !newMessage.trim() || isSending || isLoadingProfile || !profile;

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              <div className='text-center space-y-2 py-8 relative'>
                 <div className="absolute right-0 top-0">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Clear Chat
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Clear Conversation?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all messages in your current AI chat history.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearChat}>Clear Chat</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
                <div className='inline-flex items-center justify-center'>
                    <Wand className="h-6 w-6 mr-2 text-primary" />
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Hello, {profile?.name.split(' ')[0]}!
                    </h1>
                </div>
                <p className="text-muted-foreground">What can I help you accomplish today?</p>
              </div>

              {profile && <SmartReminders profile={profile} />}

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
          
          <div className="p-4 border-t space-y-4">
            
            <div className='flex items-center gap-2 overflow-x-auto pb-2'>
                 <Button variant="outline" size="sm" onClick={() => handleQuickAction('Plan my day')}>
                    <CalendarCheck className="h-4 w-4 mr-2" /> Plan My Day
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickAction('Log an activity')}>
                    <BarChart3 className="h-4 w-4 mr-2" /> Log Activity
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickAction('Check out')}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Check Out
                </Button>
                 <Button variant="outline" size="sm" onClick={() => handleQuickAction('Search for ')}>
                    <Lightbulb className="h-4 w-4 mr-2" /> Quick Find
                </Button>
            </div>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Textarea
                placeholder={
                    isLoadingProfile ? "Loading profile..." : 
                    !user ? "You must be logged in to chat." : 
                    "Ask Omuto AI a question..."
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
            <div className="text-xs text-muted-foreground text-center">
                This is your private workspace with Omuto AI. Your conversations here are not shared with the team.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
