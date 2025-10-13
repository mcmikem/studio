
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
