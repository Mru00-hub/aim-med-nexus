import React, { createContext, useState, useContext, ReactNode } from 'react';

interface SocialCountsContextType {
  requestCount: number;
  unreadInboxCount: number;
  setRequestCount: (count: number) => void;
  setUnreadInboxCount: (count: number) => void;
}

const SocialCountsContext = createContext<SocialCountsContextType | undefined>(undefined);

export const SocialCountsProvider = ({ children }: { children: ReactNode }) => {
  const [requestCount, setRequestCount] = useState(0);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  return (
    <SocialCountsContext.Provider value={{ requestCount, unreadInboxCount, setRequestCount, setUnreadInboxCount }}>
      {children}
    </SocialCountsContext.Provider>
  );
};

export const useSocialCounts = () => {
  const context = useContext(SocialCountsContext);
  if (context === undefined) {
    throw new Error('useSocialCounts must be used within a SocialCountsProvider');
  }
  return context;
};
