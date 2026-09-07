import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Connection, Message, User } from '../types/index.js';
import { api } from '../services/api.js';
import { CategoryBadge } from '../components/common/CategoryBadge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import {
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  MoreVertical,
  ShieldAlert,
  ArrowLeft,
  Smile,
  Search,
  Users,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { useToast } from '../components/common/Toast.js';

interface ChatPageProps {
  initialConnectionId?: string;
  onNavigate: (tab: string, extra?: unknown) => void;
  onOpenUser?: (userId: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  initialConnectionId,
  onNavigate: _onNavigate,
  onOpenUser,
}) => {
  const { user } = useAuth();
  const {
    onlineUserIds,
    typingUsers,
    latestMessage,
    joinRoom,
    leaveRoom,
    emitTypingStart,
    emitTypingStop,
    emitSendMessage,
    emitMarkRead,
  } = useSocket();
  const { showToast } = useToast();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(initialConnectionId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [showImageInput, setShowImageInput] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSafetyMenu, setShowSafetyMenu] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quick Emoji preset list
  const EMOJIS = ['👋', '🔥', '🎉', '☕', '🍿', '⚽', '🚀', '💯', '✨', '🙌'];

  // Load all user's connections
  const fetchConnections = useCallback(async () => {
    setIsLoadingConnections(true);
    try {
      const res = await api.getConnections();
      if (res.success && res.data) {
        setConnections(res.data);
        if (!activeConnectionId && res.data.length > 0) {
          setActiveConnectionId(initialConnectionId || res.data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load chat connections', e);
    } finally {
      setIsLoadingConnections(false);
    }
  }, [activeConnectionId, initialConnectionId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Load messages for the active connection & join socket room
  const loadMessages = useCallback(async (connId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.getMessages(connId);
      if (res.success && res.data) {
        setMessages(res.data);
        emitMarkRead(connId);
      }
    } catch (e) {
      console.error('Failed to load messages', e);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [emitMarkRead]);

  useEffect(() => {
    if (activeConnectionId) {
      joinRoom(activeConnectionId);
      loadMessages(activeConnectionId);

      return () => {
        leaveRoom(activeConnectionId);
      };
    }
  }, [activeConnectionId, joinRoom, leaveRoom, loadMessages]);

  // Handle incoming real-time socket messages
  useEffect(() => {
    if (latestMessage && activeConnectionId && latestMessage.connectionId === activeConnectionId) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === latestMessage.id)) return prev;
        return [...prev, latestMessage];
      });
      emitMarkRead(activeConnectionId);
    }
  }, [latestMessage, activeConnectionId, emitMarkRead]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  const getOtherParticipant = (conn: Connection): User | null => {
    if (!user || !conn.users) return null;
    return conn.users.find((u) => u.id !== user.id) || null;
  };

  const activeOtherUser = activeConnection ? getOtherParticipant(activeConnection) : null;
  const isOtherUserOnline = activeOtherUser ? onlineUserIds.includes(activeOtherUser.id) : false;
  const isOtherUserTyping = activeConnectionId ? Boolean(typingUsers[activeConnectionId]) : false;

  // Input typing handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    if (!activeConnectionId) return;

    emitTypingStart(activeConnectionId);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitTypingStop(activeConnectionId);
    }, 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConnectionId || (!inputContent.trim() && !imageUrlInput.trim())) return;

    const content = inputContent.trim();
    const imageUrl = imageUrlInput.trim() || undefined;

    // Clear inputs immediately
    setInputContent('');
    setImageUrlInput('');
    setShowImageInput(false);
    emitTypingStop(activeConnectionId);

    try {
      // Send via real-time Socket.IO
      emitSendMessage(activeConnectionId, content, imageUrl);
      // Fallback REST call to guarantee state persistence
      await api.sendMessage(activeConnectionId, content, imageUrl);
    } catch {
      showToast({ title: 'Error', message: 'Failed to send message.', type: 'error' });
    }
  };

  const handleToggleBlock = async () => {
    if (!activeConnectionId) return;
    try {
      const res = await api.toggleBlockConnection(activeConnectionId);
      if (res.success) {
        showToast({
          title: res.data.status === 'blocked' ? 'Chat Blocked' : 'Chat Unblocked',
          message: res.data.status === 'blocked' ? 'You have blocked this conversation.' : 'Conversation is active.',
          type: 'info',
        });
        fetchConnections();
        setShowSafetyMenu(false);
      }
    } catch {
      showToast({ title: 'Error', message: 'Action failed.', type: 'error' });
    }
  };

  const handleReport = async () => {
    if (!activeOtherUser) return;
    try {
      await api.reportUser(activeOtherUser.id, 'Inappropriate behavior in chat');
      showToast({
        title: 'Report Submitted',
        message: 'Thank you. Our moderation safety team will review this user.',
        type: 'success',
      });
      setShowSafetyMenu(false);
    } catch {
      showToast({ title: 'Error', message: 'Failed to submit report.', type: 'error' });
    }
  };

  const filteredConnections = connections.filter((conn) => {
    const other = getOtherParticipant(conn);
    if (!other) return false;
    const q = searchQuery.toLowerCase();
    return other.name.toLowerCase().includes(q) || (conn.plan?.title && conn.plan.title.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-7rem)] bg-white rounded-3xl border border-slate-200/80 shadow-sm flex overflow-hidden">
      {/* 1. Conversations List Sidebar */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
          activeConnectionId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Search header */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-slate-900 text-lg font-display">Private Messages</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {connections.length} Chats
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-chats-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 border border-transparent text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 outline-hidden transition-all"
            />
          </div>
        </div>

        {/* List of chat threads */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {isLoadingConnections ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-2xl bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : filteredConnections.length > 0 ? (
            filteredConnections.map((conn) => {
              const other = getOtherParticipant(conn);
              if (!other) return null;
              const isSelected = conn.id === activeConnectionId;
              const isOnline = onlineUserIds.includes(other.id);
              const isTyping = Boolean(typingUsers[conn.id]);

              return (
                <button
                  key={conn.id}
                  id={`chat-thread-${conn.id}`}
                  onClick={() => setActiveConnectionId(conn.id)}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-100/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={other.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={other.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200/80"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{other.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {conn.lastMessageAt ? new Date(conn.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {conn.plan && (
                      <p className="text-[11px] font-semibold text-indigo-600 truncate flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> {conn.plan.title}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {isTyping ? (
                        <span className="text-indigo-600 font-semibold animate-pulse">Typing...</span>
                      ) : conn.lastMessage ? (
                        conn.lastMessage.content || '📷 Sent an image'
                      ) : (
                        'Connected! Start the conversation.'
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active conversations yet.
            </div>
          )}
        </div>
      </div>

      {/* 2. Active Chat Stream */}
      {activeConnection && activeOtherUser ? (
        <div
          className={`flex-1 flex flex-col bg-white ${
            !activeConnectionId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Chat Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveConnectionId(null)}
                className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative shrink-0">
                <img
                  src={activeOtherUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={activeOtherUser.name}
                  referrerPolicy="no-referrer"
                  onClick={() => onOpenUser && onOpenUser(activeOtherUser.id)}
                  className="w-10 h-10 rounded-2xl object-cover cursor-pointer border border-slate-200"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    isOtherUserOnline ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenUser && onOpenUser(activeOtherUser.id)}
                    className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors text-left truncate cursor-pointer"
                  >
                    {activeOtherUser.name}
                  </button>
                  {activeConnection.plan && (
                    <CategoryBadge category={activeConnection.plan.category} size="sm" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {isOtherUserOnline ? (
                    <span className="text-emerald-600 font-medium">Online now</span>
                  ) : (
                    'Offline'
                  )}
                  {activeConnection.plan && ` • Plan: ${activeConnection.plan.title}`}
                </p>
              </div>
            </div>

            {/* Actions / Safety Menu */}
            <div className="relative">
              <button
                type="button"
                id="chat-safety-menu-btn"
                onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showSafetyMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenUser) onOpenUser(activeOtherUser.id);
                      setShowSafetyMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" /> View Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleBlock}
                    className="w-full text-left px-4 py-2 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    {activeConnection.status === 'blocked' ? 'Unblock User' : 'Block User'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReport}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Report Inappropriate
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-linear-to-b from-slate-50/50 to-white">
            {/* Safe meetup notice */}
            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center max-w-md mx-auto text-xs text-indigo-950">
              🔒 <span className="font-bold">Private Plan Chat:</span> Coordinate meetup spots, timings, and travel. Keep conversations friendly and respectful.
            </div>

            {isLoadingMessages ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading conversation...</div>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const isMe = user && msg.senderId === user.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={activeOtherUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                        alt={activeOtherUser.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-xl object-cover mb-0.5"
                      />
                    )}

                    <div
                      className={`max-w-[78%] sm:max-w-md rounded-3xl p-3.5 shadow-2xs ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-100 text-slate-900 rounded-bl-xs'
                      }`}
                    >
                      {/* Optional Image attachment */}
                      {msg.imageUrl && (
                        <div className="mb-2 rounded-2xl overflow-hidden bg-slate-900/10">
                          <img
                            src={msg.imageUrl}
                            alt="Shared in chat"
                            referrerPolicy="no-referrer"
                            className="w-full max-h-60 object-cover"
                          />
                        </div>
                      )}

                      {msg.content && (
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words">
                          {msg.content}
                        </p>
                      )}

                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                          isMe ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMe &&
                          (msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-200" title="Read" />
                          ) : (
                            <Check className="w-3.5 h-3.5 opacity-80" title="Sent" />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No messages yet. Send a greeting to plan your meetup!
              </div>
            )}

            {/* Live Typing indicator */}
            {isOtherUserTyping && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>{activeOtherUser.name} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Input Box */}
          {showImageInput && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2 animate-in fade-in">
              <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Paste image URL to send (e.g. https://images.unsplash.com/...)"
                className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white outline-hidden focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowImageInput(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Emojis Drawer */}
          {showEmojiPicker && (
            <div className="p-2 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-1.5 animate-in fade-in">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputContent((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1.5 rounded-xl text-lg hover:bg-white hover:shadow-xs transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <button
              type="button"
              id="chat-image-btn"
              onClick={() => setShowImageInput(!showImageInput)}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Attach image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              id="chat-emoji-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="text"
              id="chat-message-input"
              value={inputContent}
              onChange={handleInputChange}
              placeholder={`Message ${activeOtherUser.name}...`}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 border border-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-hidden transition-all"
            />

            <button
              type="submit"
              id="chat-send-btn"
              disabled={!inputContent.trim() && !imageUrlInput.trim()}
              className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center p-8">
          <EmptyState
            icon={Users}
            title="Select a Conversation"
            description="Choose a confirmed squad connection from the left sidebar to coordinate activity details."
          />
        </div>
      )}
    </div>
  );
};
