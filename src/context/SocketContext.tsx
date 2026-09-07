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

// Render backend
const SOCKET_URL = 'https://vibematch-301t.onrender.com';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, user } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{
    [connectionId: string]: string | null;
  }>({});
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // No login = no socket connection
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setSocket(null);
      setIsConnected(false);
      setOnlineUserIds([]);
      setTypingUsers({});
      setLatestMessage(null);
      setLatestNotification(null);

      return;
    }

    console.log('[Socket] Connecting to:', SOCKET_URL);

    const socketInstance: Socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socketInstance;

    // -----------------------------
    // CONNECT
    // -----------------------------

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
      setIsConnected(true);
    });

    // -----------------------------
    // CONNECTION ERROR
    // -----------------------------

    socketInstance.on('connect_error', (error: Error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    // -----------------------------
    // DISCONNECT
    // -----------------------------

    socketInstance.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    // -----------------------------
    // ONLINE USERS
    // -----------------------------

    socketInstance.on('online_users', (userIds: string[]) => {
      setOnlineUserIds(Array.isArray(userIds) ? userIds : []);
    });

    // -----------------------------
    // NEW MESSAGE
    // -----------------------------

    socketInstance.on('new_message', (message: Message) => {
      console.log('[Socket] New message:', message);
      setLatestMessage(message);
    });

    // -----------------------------
    // NEW NOTIFICATION
    // -----------------------------

    socketInstance.on('new_notification', (notification: Notification) => {
      console.log('[Socket] New notification:', notification);
      setLatestNotification(notification);
    });

    // -----------------------------
    // TYPING
    // -----------------------------

    socketInstance.on(
      'user_typing',
      (data: TypingInfo) => {
        const {
          connectionId,
          name,
          isTyping,
        } = data;

        setTypingUsers((previous) => ({
          ...previous,
          [connectionId]: isTyping
            ? name || 'Someone'
            : null,
        }));
      }
    );

    // -----------------------------
    // SERVER ERROR
    // -----------------------------

    socketInstance.on('error', (error: { message?: string } | Error) => {
      if (error instanceof Error) {
        console.error('[Socket] Server error:', error.message);
      } else {
        console.error(
          '[Socket] Server error:',
          error?.message || error
        );
      }
    });

    setSocket(socketInstance);

    // -----------------------------
    // CLEANUP
    // -----------------------------

    return () => {
      console.log('[Socket] Cleaning up');

      socketInstance.removeAllListeners();
      socketInstance.disconnect();

      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }

      setIsConnected(false);
    };
  }, [token, user]);

  // -----------------------------
  // JOIN CHAT ROOM
  // -----------------------------

  const joinRoom = useCallback((connectionId: string) => {
    const currentSocket = socketRef.current;

    if (!currentSocket || !currentSocket.connected) {
      console.warn(
        '[Socket] Cannot join room - socket not connected'
      );
      return;
    }

    console.log(
      '[Socket] Joining connection:',
      connectionId
    );

    currentSocket.emit('join_connection', {
      connectionId,
    });
  }, []);

  // -----------------------------
  // LEAVE CHAT ROOM
  // -----------------------------

  const leaveRoom = useCallback((connectionId: string) => {
    const currentSocket = socketRef.current;

    if (!currentSocket || !currentSocket.connected) {
      return;
    }

    console.log(
      '[Socket] Leaving connection:',
      connectionId
    );

    currentSocket.emit('leave_connection', {
      connectionId,
    });
  }, []);

  // -----------------------------
  // TYPING START
  // -----------------------------

  const emitTypingStart = useCallback(
    (connectionId: string) => {
      const currentSocket = socketRef.current;

      if (!currentSocket || !currentSocket.connected) {
        return;
      }

      currentSocket.emit('typing_start', {
        connectionId,
      });
    },
    []
  );

  // -----------------------------
  // TYPING STOP
  // -----------------------------

  const emitTypingStop = useCallback(
    (connectionId: string) => {
      const currentSocket = socketRef.current;

      if (!currentSocket || !currentSocket.connected) {
        return;
      }

      currentSocket.emit('typing_stop', {
        connectionId,
      });
    },
    []
  );

  // -----------------------------
  // SEND MESSAGE
  // -----------------------------

  const emitSendMessage = useCallback(
    (
      connectionId: string,
      content?: string,
      imageUrl?: string
    ) => {
      const currentSocket = socketRef.current;

      if (!currentSocket || !currentSocket.connected) {
        console.warn(
          '[Socket] Cannot send message - socket not connected'
        );
        return;
      }

      console.log(
        '[Socket] Sending message to:',
        connectionId
      );

      currentSocket.emit('send_message', {
        connectionId,
        content,
        imageUrl,
      });
    },
    []
  );

  // -----------------------------
  // MARK READ
  // -----------------------------

  const emitMarkRead = useCallback(
    (connectionId: string) => {
      const currentSocket = socketRef.current;

      if (!currentSocket || !currentSocket.connected) {
        return;
      }

      currentSocket.emit('mark_read', {
        connectionId,
      });
    },
    []
  );

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

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      'useSocket must be used within a SocketProvider'
    );
  }

  return context;
};