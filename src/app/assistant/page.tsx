'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { streamAssistant } from '@/ai/flows/assistant-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ScrollArea } from '@/components/ui/scroll-area';

const promptSchema = z.object({
  prompt: z.string().min(1, 'Please enter a prompt.'),
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AssistantPage() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ prompt: string }>({
    resolver: zodResolver(promptSchema),
  });

  const onSubmit = async ({ prompt }: { prompt: string }) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    reset();

    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const stream = await streamAssistant(prompt);
      let content = '';
      for await (const chunk of stream) {
        content += chunk;
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === prev.length - 1 ? { ...msg, content } : msg
          )
        );
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? { ...msg, content: 'Sorry, I had trouble connecting to the AI.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (profile?.name) {
      const parts = profile.name.split(' ');
      if (parts.length > 1) {
        return parts[0][0] + parts[parts.length - 1][0];
      }
      return profile.name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Your personal Omuto expert for planning, reporting, and analysis.
        </p>
      </header>

      <Card className="flex flex-col flex-grow h-[70vh]">
        <CardHeader>
          <CardTitle>Omuto AI Chat</CardTitle>
          <CardDescription>
            Ask me anything about our programs, data, or best practices.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback>
                        <Bot />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                     <Avatar className="h-9 w-9 border">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-16 flex flex-col items-center">
                    <Bot className="h-12 w-12 mb-4" />
                    <p className="font-semibold">How can I help you today?</p>
                    <p className="text-sm mt-2">Try asking: "Give me a summary of our active programs" or "Help me brainstorm ideas for the RED Campaign."</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-6 border-t">
          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex gap-2">
            <Input {...register('prompt')} placeholder="Ask the AI assistant..." disabled={isLoading} />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Send'}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}