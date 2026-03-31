'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { OmutoLoader } from '@/components/omuto-loader';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';

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

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="mb-12 relative">
         <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
         <OmutoLoader size="lg" label="Critical Interruption" />
      </div>

      <div className="max-w-lg space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-full text-rose-600 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">System Anomaly Detected</span>
        </div>
        
        <h1 className="text-4xl font-black text-omuto-navy uppercase tracking-tight">Technical Divergence</h1>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
          Mission Control has encountered a protocol discrepancy. 
          Institutional stability is being restored.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button onClick={() => reset()} className="btn-omuto h-14 rounded-2xl px-12 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto shadow-comic bg-omuto-navy hover:bg-omuto-navy/90">
                <RefreshCw className="mr-2 h-4 w-4" /> Reset Environment
            </Button>
            <Button variant="outline" className="h-14 rounded-2xl px-8 border-2 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto" onClick={() => window.open('mailto:support@omuto.org?subject=Error Report&body=' + encodeURIComponent(error.message || 'Technical divergence occurred'))}>
                <MessageSquare className="mr-2 h-4 w-4" /> Report to Support
            </Button>
        </div>
      </div>

      <div className="fixed bottom-10 opacity-10">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-omuto-navy">
              Error Digest: {error.digest || 'Internal Protocol Error'}
          </p>
      </div>
    </div>
  );
}
