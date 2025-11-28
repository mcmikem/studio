'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/components/auth-provider';
import { CommandStateProvider } from '@/hooks/use-command-state';
import { ViewAsProvider } from '@/hooks/use-view-as';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthProvider>
        <CommandStateProvider>
          <ViewAsProvider>
            {children}
          </ViewAsProvider>
        </CommandStateProvider>
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
