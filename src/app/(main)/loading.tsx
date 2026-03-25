import React from 'react';
import { OmutoLoader } from '@/components/omuto-loader';

export default function Loading() {
  return (
    <div className="h-[80vh] flex items-center justify-center">
      <OmutoLoader 
        size="md" 
        label="Syncing with Mission Control..." 
      />
    </div>
  );
}
