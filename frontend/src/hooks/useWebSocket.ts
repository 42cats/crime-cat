import { useEffect, useCallback, useRef } from 'react';
import websocketService, { ConnectionState } from '../services/websocketService';
import { useAppStore } from '../store/useAppStore';

export interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  console.log('🪝 useWebSocket hook initialized');
  console.log('🔍 WebSocket service instance:', websocketService);
  console.log('🔍 WebSocket service type:', typeof websocketService);
  console.log('🔍 WebSocket service methods:', Object.getOwnPropertyNames(websocketService));
  
  const { setConnected } = useAppStore();
  const connectionStateRef = useRef<ConnectionState>({ isConnected: false, serverRoles: [] });

  // Connection status handler
  const handleConnectionStatus = useCallback((data: { connected: boolean; reason?: string }) => {
    setConnected(data.connected);
    connectionStateRef.current = {
      ...connectionStateRef.current,
      isConnected: data.connected
    };
    
    if (!data.connected && data.reason) {
      console.warn('WebSocket disconnected:', data.reason);
    }
  }, [setConnected]);

  // Connection error handler
  const handleConnectionError = useCallback((error: any) => {
    console.error('WebSocket connection error:', error);
    setConnected(false);
  }, [setConnected]);

  // Setup event listeners
  useEffect(() => {
    console.log('🔗 Setting up WebSocket event listeners');
    websocketService.on('connection:status', handleConnectionStatus);
    websocketService.on('connection:error', handleConnectionError);

    // Initial connection state
    const initialState = websocketService.getConnectionState();
    console.log('📊 Initial WebSocket state:', initialState);
    connectionStateRef.current = initialState;
    setConnected(initialState.isConnected);

    return () => {
      websocketService.off('connection:status', handleConnectionStatus);
      websocketService.off('connection:error', handleConnectionError);
    };
  }, [handleConnectionStatus, handleConnectionError, setConnected]);

  // Connection methods
  const connect = useCallback(() => {
    websocketService.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    websocketService.reconnect();
  }, []);

  return {
    isConnected: websocketService.isConnected(),
    connectionState: connectionStateRef.current,
    connect,
    disconnect,
    reconnect
  };
};