'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OmutoLoader } from '@/components/omuto-loader';
import { MapPinOff, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-omuto-cream bg-[url('/noise.svg')] bg-repeat p-6 text-center">
      <div className="mb-8 relative">
        <div className="absolute -top-12 -left-12 opacity-10 scale-150 rotate-12">
            <MapPinOff className="h-40 w-40 text-omuto-navy" />
        </div>
        <OmutoLoader size="lg" />
      </div>

      <div className="max-w-md space-y-6 relative z-10">
        <h1 className="text-6xl font-black text-omuto-navy uppercase tracking-tighter">404</h1>
        <h2 className="text-2xl font-black text-omuto-navy uppercase tracking-tight">Mission Out of Bounds</h2>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
          The coordinates you’ve entered lead to uncharted territory. 
          Mission Control recommends returning to your assigned station.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button asChild variant="outline" className="h-14 rounded-2xl px-8 border-2 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto">
                <Link href="javascript:history.back()"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Link>
            </Button>
            <Button asChild className="btn-omuto h-14 rounded-2xl px-12 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto shadow-comic">
                <Link href="/"><Home className="mr-2 h-4 w-4" /> Mission Control</Link>
            </Button>
        </div>
      </div>

      <div className="mt-20 opacity-20 flex items-center gap-4">
          <span className="h-px w-20 bg-omuto-navy" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Omuto Foundation</p>
          <span className="h-px w-20 bg-omuto-navy" />
      </div>
    </div>
  );
}
