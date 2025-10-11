'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles, User } from 'lucide-react';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const OmutoLogoAvatar = () => (
    <Avatar className="h-9 w-9 border-2 border-primary" data-ai-hint="logo">
         <div className="flex h-full w-full items-center justify-center rounded-full bg-foreground text-background">
             <svg
                className="h-6 w-6"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M42.5833 26.0416C43.7083 22.8333 41.9167 20.3333 38.0833 20.25C30.5 20.0833 24.5 27.5 22.25 33.5C20.5 38.1666 21.0833 42.6666 22.5 46.5C24.1667 50.8333 26.5 54.5833 29 57.25C31.5 59.9166 34.1667 61.75 36.5 63.5C40.75 66.5833 44.5 69.5833 44.5 74.5833C44.5 78.5833 41.5 81.6666 38.4167 83.5833C35.9167 85.1666 33.0833 86.25 30.25 86.9166C26.5 87.75 22.6667 88.0833 18.9167 88.0833C17.0833 88.0833 15.3333 87.9166 13.5833 87.5833C19.5 89.9166 26.5 91.25 33.75 91.25C55.8333 91.25 73.75 73.3333 73.75 51.25C73.75 29.1666 55.8333 11.25 33.75 11.25C28.5833 11.25 23.8333 12.4166 19.75 14.5C25.4167 15.4166 29.4167 18.0833 32.5 21.4166C32.5 21.4166 35.0833 21.4166 38.5 22.5833C40.0833 23.1666 41.6667 24.0833 42.5833 26.0416Z" fill="#FFFFFF"/>
                <circle cx="65.5" cy="51.5" r="17" fill="#FF1A1A"/>
              </svg>
        </div>
    </Avatar>
);

const UserAvatar = ({ profile, authUser }: { profile: any, authUser: any }) => {
    const getInitials = (name?: string, email?: string) => {
        if (name) {
          const parts = name.split(' ');
          if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
            return parts[0][0] + parts[parts.length - 1][0];
          }
          return name.substring(0, 2).toUpperCase();
        }
        if (email) {
          return email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <Avatar className="h-9 w-9">
            {authUser?.photoURL && <AvatarImage src={authUser.photoURL} alt="User avatar" />}
            <AvatarFallback>{getInitials(profile?.name, authUser?.email)}</AvatarFallback>
        </Avatar>
    )
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  const { user: authUser } = useUser();
  const { profile } = useUserProfile(authUser);
  const parsedContent = { __html: marked.parse(message.content) };

  return (
    <div className={cn('flex items-start gap-3', isUser ? 'justify-end' : '')}>
      {!isUser && <OmutoLogoAvatar />}
      <div
        className={cn(
          'max-w-sm md:max-w-md lg:max-w-lg rounded-xl p-3 shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <div className="prose prose-sm text-foreground" dangerouslySetInnerHTML={parsedContent} />
      </div>
       {isUser && <UserAvatar profile={profile} authUser={authUser} />}
    </div>
  );
};


export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat container when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);


 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForApi = messages.map(msg => ({
        role: msg.role,
        content: [{ text: msg.content }]
    }));

    try {
      const response = await fetch(`/api/flows/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            history: historyForApi,
            prompt: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Could not get response reader');
      }
      
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        
        setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1].role === 'model') {
                newMessages[newMessages.length - 1].content = fullResponse;
            }
            return newMessages;
        });
      }

    } catch (error) {
      console.error('Streaming error:', error);
       setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col gap-6 h-full">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Your personal AI-powered coach for all things Omuto.
        </p>
      </header>
      <Card className="flex-1 flex flex-col">
        <CardContent ref={chatContainerRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
          {messages.length === 0 && !isLoading && (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Sparkles className="h-12 w-12" />
                <p className="mt-4 text-lg font-semibold">Welcome to your AI Assistant</p>
                <p className="text-sm">Ask me about programs, data, or how to write a report.</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start gap-3">
              <OmutoLogoAvatar />
              <div className="bg-muted rounded-xl p-3 shadow-sm">
                <Skeleton className="h-4 w-10 animate-pulse" />
              </div>
            </div>
          )}
        </CardContent>
        <div className="border-t p-4 bg-background">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Omuto..."
              autoComplete="off"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
