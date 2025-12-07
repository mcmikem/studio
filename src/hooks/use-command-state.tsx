
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import dynamic from 'next/dynamic';

const GlobalCommandBar = dynamic(() =>
  import('@/components/global-command-bar').then((mod) => mod.GlobalCommandBar)
);

interface CommandContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export const CommandStateProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <CommandContext.Provider value={{ open, setOpen }}>
      {children}
      <GlobalCommandBar />
    </CommandContext.Provider>
  );
};

export const useCommandState = () => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandState must be used within a CommandStateProvider');
  }
  return context;
};

    