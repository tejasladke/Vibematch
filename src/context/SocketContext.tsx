import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';
import { Message, Notification } from '../types/index.js';

interface TypingInfo {
  connectionId: string;
  userId: string;
  name?: string;
  isTyping: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: string[];
  typingUsers: { [connectionId: string]: string | null }; // connectionId -> name of person typing
  latestMessage: Message | null;
  latestNotification: Notification | null;
  joinRoom: (connectionId: string) => void;
  leaveRoom: (connectionId: string) => void;
  emitTypingStart: (connectionId: string) => void;
  emitTypingStop: (connectionId: string) => void;
  emitSendMessage: (connectionId: string, content?: string, imageUrl?: string) => void;
  emitMarkRead: (connectionId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [connectionId: string]: string | null }>({});
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket Connected]', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('online_users', (userIds: string[]) => {
      setOnlineUserIds(userIds || []);
    });

    socketInstance.on('new_message', (message: Message) => {
      setLatestMessage(message);
    });

    socketInstance.on('new_notification', (notif: Notification) => {
      setLatestNotification(notif);
    });

    socketInstance.on('user_typing', ({ connectionId, name, isTyping }: TypingInfo) => {
      setTypingUsers((prev) => ({
        ...prev,
        [connectionId]: isTyping ? name || 'Someone' : null,
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user]);

  const joinRoom = useCallback((connectionId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_connection', { connectionId });
    }
  }, []);

  const leaveRoom = useCallback((connectionId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_connection', { connectionId });
    }
  }, []);

  const emitTypingStart = useCallback((connectionId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing_start', { connectionId });
    }
  }, []);

  const emitTypingStop = useCallback((connectionId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing_stop', { connectionId });
    }
  }, []);

  const emitSendMessage = useCallback((connectionId: string, content?: string, imageUrl?: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', { connectionId, content, imageUrl });
    }
  }, []);

  const emitMarkRead = useCallback((connectionId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('mark_read', { connectionId });
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        typingUsers,
        latestMessage,
        latestNotification,
        joinRoom,
        leaveRoom,
        emitTypingStart,
        emitTypingStop,
        emitSendMessage,
        emitMarkRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
