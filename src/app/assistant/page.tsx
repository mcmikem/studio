
'use client';

import { useState, useMemo } from 'react';
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collection, query, orderBy, where, limit } from 'firebase/firestore';
import type { Program, Partnership, Expense, Task, KeyResult } from '@/lib/types';

const promptSchema = z.object({
  prompt: z.string().min(1, 'Please enter a prompt.'),
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Helper function to build a context string from fetched data
const buildContextString = (
  data: { name: string; data: any[] | null }[]
): string => {
  let context = "START OF CONTEXT\n";
  for (const item of data) {
    if (item.data && item.data.length > 0) {
      context += `\n## ${item.name}:\n`;
      context += JSON.stringify(item.data, null, 2);
      context += "\n";
    }
  }
  context += "END OF CONTEXT\n";
  return context;
};

export default function AssistantPage() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();

  // --- Data fetching for AI context ---
  const programsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'programs'), where('status', '!=', 'Completed')) : null, [firestore]);
  const { data: programs } = useCollection<Program>(programsQuery);

  const partnershipsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partnerships')) : null, [firestore]);
  const { data: partnerships } = useCollection<Partnership>(partnershipsQuery);
  
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(10)) : null, [firestore]);
  const { data: expenses } = useCollection<Expense>(expensesQuery);

  const tasksQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'users', user.uid, 'tasks'), where('completed', '==', false)) : null, [firestore, user]);
  const { data: tasks } = useCollection<Task>(tasksQuery);
  
  const keyResultsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'key-results')) : null, [firestore]);
  const { data: keyResults } = useCollection<KeyResult>(keyResultsQuery);
  // --- End of data fetching ---

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
    const newMessages: Message[] = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);
    reset();

    // Build the full context string to pass to the AI
    const fullContext = buildContextString([
      { name: "Active Programs", data: programs },
      { name: "Partnerships", data: partnerships },
      { name: "Recent Expenses", data: expenses },
      { name: "My Pending Tasks", data: tasks },
      { name: "October Key Results", data: keyResults },
    ]);
    
    const promptWithContext = `${fullContext}\nUser's question: ${prompt}`;

    try {
      // Add a placeholder for the assistant's response
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const stream = await streamAssistant(promptWithContext);
      
      for await (const chunk of stream) {
        if (chunk.text) {
          setMessages(prev => {
            const updatedMessages = [...prev];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content += chunk.text;
            }
            return updatedMessages;
          });
        }
      }

    } catch (e) {
      console.error(e);
       setMessages(prev => {
           const updatedMessages = [...prev];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.content === '') {
                 lastMessage.content = 'Sorry, I had trouble connecting to the AI.';
                 return updatedMessages;
            }
           return [...updatedMessages, { role: 'assistant', content: 'Sorry, I had trouble connecting to the AI.' }];
       });
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
    <div className="flex flex-col gap-6 h-full">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Your personal Omuto expert for planning, reporting, and analysis.
        </p>
      </header>

      <Card className="flex flex-col flex-grow">
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
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback>
                        <Bot />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 max-w-lg bg-muted flex items-center">
                       <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
              )}
              {messages.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground pt-16 flex flex-col items-center">
                    <Bot className="h-12 w-12 mb-4" />
                    <p className="font-semibold">How can I help you today?</p>
                    <p className="text-sm mt-2">Try asking: "Give me a summary of our active programs" or "What are my pending tasks?"</p>
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

    