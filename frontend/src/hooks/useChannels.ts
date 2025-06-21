import { useContext } from 'react';
import { ChannelContext } from '../contexts/ChannelContext';

export const useChannels = () => useContext(ChannelContext);