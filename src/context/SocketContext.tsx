import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
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
  typingUsers: { [connectionId: string]: string | null };
  latestMessage: Message | null;
  latestNotification: Notification | null;
  joinRoom: (connectionId: string) => void;
  leaveRoom: (connectionId: string) => void;
  emitTypingStart: (connectionId: string) => void;
  emitTypingStop: (connectionId: string) => void;
  emitSendMessage: (
    connectionId: string,
    content?: string,
    imageUrl?: string
  ) => void;
  emitMarkRead: (connectionId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Your deployed Render backend
const SOCKET_URL = 'https://vibematch-301t.onrender.com';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, user } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{
    [connectionId: string]: string | null;
  }>({});
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // If user is logged out, disconnect socket
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setSocket(null);
      setIsConnected(false);
      setOnlineUserIds([]);
      setTypingUsers({});
      return;
    }

    console.log('[Socket] Connecting to Render backend...');

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socketInstance;

    // Connected
    socketInstance.on('connect', () => {
      setIsConnected(true);

      console.log(
        '[Socket Connected]',
        socketInstance.id,
        '→',
        SOCKET_URL
      );
    });

    // Connection error
    socketInstance.on('connect_error', (error) => {
      setIsConnected(false);

      console.error('[Socket Connection Error]', error.message);
    });

    // Disconnected
    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);

      console.log('[Socket Disconnected]', reason);
    });

    // Online users
    socketInstance.on('online_users', (userIds: string[]) => {
      setOnlineUserIds(userIds || []);
    });

    // New message
    socketInstance.on('new_message', (message: Message) => {
      console.log('[Socket] New message received:', message);

      setLatestMessage(message);
    });

    // New notification
    socketInstance.on('new_notification', (notif: Notification) => {
      console.log('[Socket] New notification:', notif);

      setLatestNotification(notif);
    });

    // Typing indicator
    socketInstance.on(
      'user_typing',
      ({ connectionId, name, isTyping }: TypingInfo) => {
        setTypingUsers((prev) => ({
          ...prev,
          [connectionId]: isTyping ? name || 'Someone' : null,
        }));
      }
    );

    // Socket error from backend
    socketInstance.on('error', (error) => {
      console.error('[Socket Server Error]', error);
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      console.log('[Socket] Cleaning up connection...');

      socketInstance.removeAllListeners();
      socketInstance.disconnect();

      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }

      setIsConnected(false);
    };
  }, [token, user]);

  // Join private chat room
  const joinRoom = useCallback((connectionId: string) => {
    if (socketRef.current?.connected) {
      console.log('[Socket] Joining room:', connectionId);

      socketRef.current.emit('join_connection', {
        connectionId,
      });
    } else {
      console.warn('[Socket] Cannot join room - socket not connected');
    }
  }, []);

  // Leave private chat room
  const leaveRoom = useCallback((connectionId: string) => {
    if (socketRef.current?.connected) {
      console.log('[Socket] Leaving room:', connectionId);

      socketRef.current.emit('leave_connection', {
        connectionId,
      });
    }
  }, []);

  // Start typing
  const emitTypingStart = useCallback((connectionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_start', {
        connectionId,
      });
    }
  }, []);

  // Stop typing
  const emitTypingStop = useCallback((connectionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_stop', {
        connectionId,
      });
    }
  }, []);

  // Send message
  const emitSendMessage = useCallback(
    (connectionId: string, content?: string, imageUrl?: string) => {
      if (socketRef.current?.connected) {
        console.log('[Socket] Sending message');

        socketRef.current.emit('send_message', {
          connectionId,
          content,
          imageUrl,
        });
      } else {
        console.warn(
          '[Socket] Cannot send message - socket not connected'
        );
      }
    },
    []
  );

  // Mark messages as read
  const emitMarkRead = useCallback((connectionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark_read', {
        connectionId,
      });
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
    throw new Error(
      'useSocket must be used within a SocketProvider'
    );
  }

  return context;
};