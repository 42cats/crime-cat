import { useEffect, useCallback, useState } from 'react';
import websocketService, { ServerInfo, ChannelInfo, ServerRole } from '../services/websocketService';

export interface UseServerChannelReturn {
  currentServer?: string;
  currentChannel?: { serverId: string; channelId: string };
  serverRoles: ServerRole[];
  joinServer: (serverId: string) => void;
  leaveServer: (serverId: string) => void;
  joinChannel: (serverId: string, channelId: string) => void;
  leaveChannel: (serverId: string, channelId: string) => void;
  onServerJoined: (callback: (data: any) => void) => void;
  onChannelJoined: (callback: (data: any) => void) => void;
  onMemberJoined: (callback: (data: any) => void) => void;
  onMemberLeft: (callback: (data: any) => void) => void;
}

export const useServerChannel = (): UseServerChannelReturn => {
  const [currentServer, setCurrentServer] = useState<string | undefined>();
  const [currentChannel, setCurrentChannel] = useState<{ serverId: string; channelId: string } | undefined>();
  const [serverRoles, setServerRoles] = useState<ServerRole[]>([]);

  // Server join success handler
  const handleServerJoined = useCallback((data: { serverId: string; roles: ServerRole[] }) => {
    console.log('Server joined:', data);
    setCurrentServer(data.serverId);
    setServerRoles(data.roles || []);
  }, []);

  // Channel join success handler
  const handleChannelJoined = useCallback((data: { serverId: string; channelId: string }) => {
    console.log('Channel joined:', data);
    setCurrentChannel({ serverId: data.serverId, channelId: data.channelId });
  }, []);

  // Member events handlers
  const handleServerMemberJoined = useCallback((data: any) => {
    console.log('Server member joined:', data);
  }, []);

  const handleServerMemberLeft = useCallback((data: any) => {
    console.log('Server member left:', data);
  }, []);

  const handleChannelMemberJoined = useCallback((data: any) => {
    console.log('Channel member joined:', data);
  }, []);

  const handleChannelMemberLeft = useCallback((data: any) => {
    console.log('Channel member left:', data);
  }, []);

  // Setup event listeners
  useEffect(() => {
    websocketService.on('server:joined', handleServerJoined);
    websocketService.on('channel:joined', handleChannelJoined);
    websocketService.on('server:member:joined', handleServerMemberJoined);
    websocketService.on('server:member:left', handleServerMemberLeft);
    websocketService.on('channel:member:joined', handleChannelMemberJoined);
    websocketService.on('channel:member:left', handleChannelMemberLeft);

    // Get initial state
    const connectionState = websocketService.getConnectionState();
    setCurrentServer(connectionState.currentServer);
    setCurrentChannel(connectionState.currentChannel);
    setServerRoles(connectionState.serverRoles);

    return () => {
      websocketService.off('server:joined', handleServerJoined);
      websocketService.off('channel:joined', handleChannelJoined);
      websocketService.off('server:member:joined', handleServerMemberJoined);
      websocketService.off('server:member:left', handleServerMemberLeft);
      websocketService.off('channel:member:joined', handleChannelMemberJoined);
      websocketService.off('channel:member:left', handleChannelMemberLeft);
    };
  }, [
    handleServerJoined,
    handleChannelJoined,
    handleServerMemberJoined,
    handleServerMemberLeft,
    handleChannelMemberJoined,
    handleChannelMemberLeft
  ]);

  // Server/Channel actions
  const joinServer = useCallback((serverId: string) => {
    try {
      websocketService.joinServer(serverId);
    } catch (error) {
      console.error('Failed to join server:', error);
    }
  }, []);

  const leaveServer = useCallback((serverId: string) => {
    websocketService.leaveServer(serverId);
    if (currentServer === serverId) {
      setCurrentServer(undefined);
      setCurrentChannel(undefined);
      setServerRoles([]);
    }
  }, [currentServer]);

  const joinChannel = useCallback((serverId: string, channelId: string) => {
    try {
      websocketService.joinChannel(serverId, channelId);
    } catch (error) {
      console.error('Failed to join channel:', error);
    }
  }, []);

  const leaveChannel = useCallback((serverId: string, channelId: string) => {
    websocketService.leaveChannel(serverId, channelId);
    if (currentChannel?.serverId === serverId && currentChannel?.channelId === channelId) {
      setCurrentChannel(undefined);
    }
  }, [currentChannel]);

  // Event callback setters
  const onServerJoined = useCallback((callback: (data: any) => void) => {
    websocketService.on('server:joined', callback);
    return () => websocketService.off('server:joined', callback);
  }, []);

  const onChannelJoined = useCallback((callback: (data: any) => void) => {
    websocketService.on('channel:joined', callback);
    return () => websocketService.off('channel:joined', callback);
  }, []);

  const onMemberJoined = useCallback((callback: (data: any) => void) => {
    websocketService.on('server:member:joined', callback);
    websocketService.on('channel:member:joined', callback);
    return () => {
      websocketService.off('server:member:joined', callback);
      websocketService.off('channel:member:joined', callback);
    };
  }, []);

  const onMemberLeft = useCallback((callback: (data: any) => void) => {
    websocketService.on('server:member:left', callback);
    websocketService.on('channel:member:left', callback);
    return () => {
      websocketService.off('server:member:left', callback);
      websocketService.off('channel:member:left', callback);
    };
  }, []);

  return {
    currentServer,
    currentChannel,
    serverRoles,
    joinServer,
    leaveServer,
    joinChannel,
    leaveChannel,
    onServerJoined,
    onChannelJoined,
    onMemberJoined,
    onMemberLeft
  };
};