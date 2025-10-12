'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '@/lib/types';

type Role = User['role'];

interface ViewAsContextType {
  viewAsRole: Role | null;
  setViewAsRole: (role: Role | null) => void;
  clearViewAs: () => void;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export const ViewAsProvider = ({ children }: { children: ReactNode }) => {
  const [viewAsRole, setViewAsRole] = useState<Role | null>(null);

  const clearViewAs = () => {
    setViewAsRole(null);
  };

  return (
    <ViewAsContext.Provider value={{ viewAsRole, setViewAsRole, clearViewAs }}>
      {children}
    </ViewAsContext.Provider>
  );
};

export const useViewAs = () => {
  const context = useContext(ViewAsContext);
  if (!context) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  return context;
};
