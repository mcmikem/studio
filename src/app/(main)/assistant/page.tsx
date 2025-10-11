'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles, User as UserIcon } from 'lucide-react';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const OmutoAIAvatar = () => (
    <Avatar className="h-9 w-9 border-2 border-primary" data-ai-hint="logo">
        <div className="flex h-full w-full items-center justify-center rounded-full bg-foreground text-background">
             <Sparkles className="h-5 w-5 text-background" />
        </div>
    </Avatar>
);

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let fullResponse = '';
    
    // Add a placeholder for the AI response
    setMessages(prev => [...prev, { role: 'model', content: '' }]);

    try {
      const response = await fetch('/api/flows/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            history: newMessages,
            userContext: {
              name: profile?.name || 'User',
              role: profile?.role || 'Team Member',
            }
          },
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to get response reader');

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // This regex helps handle multiple JSON objects in a single chunk
        chunk.match(/{"content":".*?"}/g)?.forEach(jsonString => {
             try {
                const parsed = JSON.parse(jsonString);
                if (parsed.content) {
                    fullResponse += parsed.content;
                     setMessages(prev => {
                        const updated = [...prev];
                        if (updated[updated.length - 1]?.role === 'model') {
                            updated[updated.length - 1].content = fullResponse;
                        }
                        return updated;
                    });
                }
            } catch (err) {
                 // Ignore parsing errors for incomplete chunks
            }
        });
      }

    } catch (error) {
      console.error('Streaming error:', error);
      setMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === 'model') {
            updated[updated.length - 1].content = "Sorry, I encountered an error. Please try again.";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
       <header className="pb-6">
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            Omuto AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Your partner for planning, reporting, and analysis. Ask me anything.
        </p>
      </header>
       <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-4',
                    message.role === 'user' ? 'justify-end' : ''
                  )}
                >
                  {message.role === 'model' && <OmutoAIAvatar />}
                  <div
                    className={cn(
                      'max-w-prose rounded-lg p-3 text-sm whitespace-pre-wrap',
                       message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    {message.content || <span className="animate-pulse">...</span>}
                  </div>
                   {message.role === 'user' && (
                     <Avatar className="h-9 w-9 border" data-ai-hint="user avatar">
                        {user?.photoURL && <AvatarImage src={user.photoURL} alt="User avatar" />}
                        <AvatarFallback>{getInitials(profile?.name, user?.email)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {messages.length === 0 && (
                 <div className="text-center text-muted-foreground pt-16">
                    <Sparkles className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">Welcome to the Omuto AI Assistant</p>
                    <p className="text-sm">You can ask questions like "Summarize our progress on KR1" or "Help me draft a checkout report".</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI assistant..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
