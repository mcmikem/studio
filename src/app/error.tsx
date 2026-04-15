'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { OmutoLoader } from '@/components/omuto-loader';
import { AlertTriangle, RefreshCw, MessageSquare, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  // Extract useful error info
  const errorMessage = error.message || 'Something went wrong';
  const isAuthError = error.message?.includes('Firebase') || (error as any).code?.includes('auth');
  const isNetworkError = error.message?.includes('network') || error.message?.includes('fetch');

  const getHelpText = () => {
    if (isAuthError) return 'Try logging out and back in. If the problem continues, contact support.';
    if (isNetworkError) return 'Check your internet connection and try again.';
    return 'If this keeps happening, please report it using the button below.';
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="mb-12 relative">
         <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
         <OmutoLoader size="lg" label="Error" />
      </div>

      <div className="max-w-lg space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-full text-rose-600 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Something went wrong</span>
        </div>
        
        <h1 className="text-4xl font-black text-omuto-navy uppercase tracking-tight">Oops!</h1>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
          {getHelpText()}
        </p>

        <div className="bg-muted/30 rounded-xl p-4 text-left">
          <p className="text-xs font-mono text-muted-foreground break-all">
            {errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button onClick={() => reset()} className="btn-omuto h-14 rounded-2xl px-8 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto shadow-comic bg-omuto-navy hover:bg-omuto-navy/90">
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
            <Button variant="outline" className="h-14 rounded-2xl px-8 border-2 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto" onClick={() => window.location.href = '/'}>
                <Home className="mr-2 h-4 w-4" /> Go to Dashboard
            </Button>
            <Button variant="ghost" className="h-10 text-xs" onClick={() => window.open('mailto:support@omuto.org?subject=Error Report&body=' + encodeURIComponent('Error: ' + (error.message || 'Unknown') + '\n\nSteps to reproduce:\n1. '))}>
                <MessageSquare className="mr-2 h-3 w-3" /> Report Issue
            </Button>
        </div>
      </div>

      <div className="fixed bottom-10 opacity-10">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-omuto-navy">
              Error Code: {error.digest || 'ERR-UNKNOWN'}
          </p>
      </div>
    </div>
  );
}
