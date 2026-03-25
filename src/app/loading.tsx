import React from 'react';
import { OmutoLoader } from '@/components/omuto-loader';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-omuto-cream/80 backdrop-blur-md">
      <OmutoLoader 
        size="lg" 
        label="Initializing Mission Control..." 
      />
    </div>
  );
}
