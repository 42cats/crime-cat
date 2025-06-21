import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchChannels } from '@/api/misc/messageButtonService';
import { Channel } from '@/lib/types';

interface ChannelContextType {
  channels: Channel[];
  isLoading: boolean;
  error: Error | null;
}

const initialChannelContext: ChannelContextType = {
  channels: [],
  isLoading: false,
  error: null
};

export const ChannelContext = createContext<ChannelContextType>(initialChannelContext);

interface ChannelProviderProps {
  children: ReactNode;
  guildId: string;
}

export const ChannelProvider: React.FC<ChannelProviderProps> = ({ children, guildId }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!guildId) return;

    setIsLoading(true);
    
    fetchChannels(guildId)
      .then(channelList => {
        setChannels(channelList);
        setError(null);
      })
      .catch(err => {
        console.error('채널 목록 로드 실패:', err);
        setError(err instanceof Error ? err : new Error('채널 목록을 불러오는데 실패했습니다.'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [guildId]);

  return (
    <ChannelContext.Provider value={{ channels, isLoading, error }}>
      {children}
    </ChannelContext.Provider>
  );
};
