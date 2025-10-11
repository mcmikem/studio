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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, User, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

type ChatFormData = z.infer<typeof chatSchema>;

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatFormData>({
    resolver: zodResolver(chatSchema),
  });

  const onSubmit = async (data: ChatFormData) => {
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: data.message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    reset();

    const modelResponse: Message = { role: 'model', content: '' };
    setMessages(prev => [...prev, modelResponse]);

    try {
      const response = await fetch('/api/flows/assistantFlow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream: true,
          input: {
            history: newMessages.map(msg => ({
              role: msg.role,
              content: [{ text: msg.content }],
            })),
          },
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        
        // Process streaming JSON chunks
        chunk.split('__NEXT_STREAM_CHUNK_BOUNDARY__\n').forEach(part => {
          if (part.trim()) {
            try {
              const json = JSON.parse(part);
              if (json.flowState?.output) {
                 setMessages(prev => {
                  const updatedMessages = [...prev];
                  const lastMessage = updatedMessages[updatedMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.content = json.flowState.output;
                  }
                  return updatedMessages;
                });
              }
            } catch (e) {
                // Not a JSON chunk, likely the final boundary
            }
          }
        });
      }

    } catch (error) {
      console.error('Error calling assistant flow:', error);
       setMessages(prev => {
            const updatedMessages = [...prev];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage.role === 'model') {
                lastMessage.content = "Sorry, I encountered an error. Please try again.";
            }
            return updatedMessages;
        });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Your personal guide to Omuto Foundation's data and operations.
        </p>
      </header>

      <Card className="mt-6 flex-1 flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.length === 0 && (
                 <div className="text-center text-muted-foreground py-8">
                    <p>Ask me anything about Omuto's plans, programs, or data.</p>
                    <p className="text-xs mt-2">e.g., "What is the status of the RED Campaign?"</p>
                 </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'model' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-prose rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                   {message.role === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback><User size={16} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
              <Input
                {...register('message')}
                placeholder="Ask a question..."
                autoComplete="off"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Send'
                )}
              </Button>
            </form>
             {errors.message && (
              <p className="text-sm text-destructive mt-2">{errors.message.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
