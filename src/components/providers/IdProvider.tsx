'use client';

import React, { createContext, useContext, useId } from 'react';

interface IdProviderContextType {
  generateId: (prefix?: string) => string;
}

const IdProviderContext = createContext<IdProviderContextType | undefined>(undefined);

export function IdProvider({ children }: { children: React.ReactNode }) {
  const baseId = useId();

  const generateId = React.useCallback((prefix = 'radix') => {
    // Use React's useId which is stable between server and client
    // Remove colons and replace with hyphens for valid HTML IDs
    const cleanId = baseId.replace(/:/g, '-');
    return `${prefix}-${cleanId}`;
  }, [baseId]);

  return (
    <IdProviderContext.Provider value={{ generateId }}>
      {children}
    </IdProviderContext.Provider>
  );
}

export function useIdProvider() {
  const context = useContext(IdProviderContext);
  if (context === undefined) {
    throw new Error('useIdProvider must be used within an IdProvider');
  }
  return context;
}
