'use client';

import { useState, useEffect } from 'react';
import { Bot, MessageCircle, X, Send, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function FloatingAIButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  
  // Don't show on mobile (they have the action drawer)
  useEffect(() => {
    const checkMobile = () => {
      setIsMinimized(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (isMinimized) return null;
  
  const quickPrompts = [
    { label: 'Summarize today', prompt: 'Summarize my check-in and check-out activity from today' },
    { label: 'What tasks do I have?', prompt: 'What are my pending tasks?' },
    { label: 'Help with expense', prompt: 'Help me write an expense report for' },
    { label: 'Team activity', prompt: 'What has the team been working on recently?' },
  ];
  
  const handleSend = async () => {
    if (!message.trim() || !user) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setShowQuickPrompts(false);
    
    try {
      // Call the AI endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          userId: user.uid,
          userName: profile?.name || 'User',
          userRole: profile?.role || 'Team Member',
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I\'m here to help! How can I assist you today?',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      // Show a helpful error but don't crash
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please try again or visit the AI Coach page for more detailed assistance.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
    handleSend();
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-24 right-4 z-[900] bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg transition-all hover:scale-105 flex items-center gap-2 group"
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
        <span className="text-sm font-bold pr-1 group-hover:pr-2 transition-all">Ask AI</span>
        <Sparkles className="h-4 w-4 animate-pulse" />
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-24 right-4 z-[900] w-80 sm:w-96 bg-white dark:bg-omuto-navy rounded-2xl shadow-2xl border border-omuto-navy/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-bold">AI Coach</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close AI Assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
        {messages.length === 0 && !showQuickPrompts && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">How can I help you today?</p>
          </div>
        )}
        
        {showQuickPrompts && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Quick prompts:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(qp.prompt)}
                  className="text-left p-2 rounded-lg border border-muted hover:bg-muted/50 transition-colors text-xs"
                >
                  {qp.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center pt-2">
              Or type your question below
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl p-3 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-muted dark:bg-omuto-navy/50 rounded-bl-md'
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={cn(
                'text-[10px] mt-1',
                msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground'
              )}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted dark:bg-omuto-navy/50 rounded-2xl rounded-bl-md p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-omuto-navy/10">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 h-10"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            size="icon"
            className="h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <a 
            href="/chat" 
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            Open full chat →
          </a>
        </div>
      </div>
    </div>
  );
}