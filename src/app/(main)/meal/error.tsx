'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { OmutoLoader } from '@/components/omuto-loader';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';

export default function MEALError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('MEAL Module Error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center rounded-2xl shadow-comic-sm border my-4">
      <div className="mb-8 relative">
         <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
         <OmutoLoader size="lg" label="Impact Data Interruption" />
      </div>

      <div className="max-w-lg space-y-6 relative z-10 w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-full text-rose-600 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">MEAL Module Anomaly</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black text-omuto-navy uppercase tracking-tight">Impact Divergence</h1>
        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
          The Monitoring, Evaluation & Learning module has encountered a discrepancy. 
          Impact data remains intact. Please reload the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button onClick={() => reset()} className="btn-omuto h-12 rounded-2xl px-8 font-black uppercase tracking-widest text-[9px] w-full sm:w-auto shadow-comic bg-omuto-navy text-white hover:bg-omuto-navy/90">
                <RefreshCw className="mr-2 h-4 w-4" /> Reload MEAL
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl px-6 border-2 font-black uppercase tracking-widest text-[9px] w-full sm:w-auto text-omuto-navy bg-white" onClick={() => window.open('mailto:support@omuto.org?subject=MEAL Error&body=' + encodeURIComponent(error.message || 'MEAL error occurred'))}>
                <MessageSquare className="mr-2 h-4 w-4" /> Report to Support
            </Button>
        </div>
      </div>
    </div>
  );
}
