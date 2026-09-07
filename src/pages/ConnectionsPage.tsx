import React, { useState, useEffect, useCallback } from 'react';
import { Connection, User } from '../types/index.js';
import { api } from '../services/api.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { CategoryBadge } from '../components/common/CategoryBadge.js';
import {
  Users,
  Search,
  MessageSquare,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';

interface ConnectionsPageProps {
  onNavigate: (tab: string, extra?: unknown) => void;
  onOpenUser?: (userId: string) => void;
}

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({
  onNavigate,
  onOpenUser,
}) => {
  const { user } = useAuth();
  const { onlineUserIds } = useSocket();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getConnections();
      if (res.success && res.data) {
        setConnections(res.data);
      }
    } catch (e) {
      console.error('Failed to load connections', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const getOtherUser = (connection: Connection): User | null => {
    if (!user || !connection.users) return null;
    return connection.users.find((u) => u.id !== user.id) || null;
  };

  const filteredConnections = connections.filter((conn) => {
    const otherUser = getOtherUser(conn);
    if (!otherUser) return false;
    const q = search.toLowerCase();
    return (
      otherUser.name.toLowerCase().includes(q) ||
      (conn.plan?.title && conn.plan.title.toLowerCase().includes(q)) ||
      (otherUser.location && otherUser.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Social Circle
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-display">
            My Squad & Connections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            People you&apos;ve connected with through confirmed activities.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:border-indigo-500 outline-hidden shadow-2xs"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredConnections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredConnections.map((conn) => {
            const otherUser = getOtherUser(conn);
            if (!otherUser) return null;
            const isOnline = onlineUserIds.includes(otherUser.id);

            return (
              <div
                key={conn.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={otherUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={otherUser.name}
                      referrerPolicy="no-referrer"
                      onClick={() => onOpenUser && onOpenUser(otherUser.id)}
                      className="w-13 h-13 rounded-2xl object-cover cursor-pointer border border-slate-100"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      title={isOnline ? 'Online now' : 'Offline'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onOpenUser && onOpenUser(otherUser.id)}
                        className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors text-left truncate cursor-pointer"
                      >
                        {otherUser.name} {otherUser.age ? `(${otherUser.age})` : ''}
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isOnline ? 'Active' : 'Offline'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {otherUser.location || 'Bengaluru, India'}
                    </p>

                    {/* Connected Plan Context */}
                    {conn.plan && (
                      <div className="mt-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-1.5 truncate">
                        <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="text-slate-500 text-[11px]">Met at:</span>
                        <span className="font-semibold text-slate-800 text-[11px] truncate">
                          {conn.plan.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {conn.plan?.category ? (
                    <CategoryBadge category={conn.plan.category} size="sm" />
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenUser && onOpenUser(otherUser.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      id={`chat-conn-${conn.id}`}
                      onClick={() => onNavigate('chat', { connectionId: conn.id })}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No squad connections yet"
          description="When you host an activity and accept requests, or when another host accepts your join request, your private connection will appear here!"
          actionText="Find Activities"
          onAction={() => onNavigate('discover')}
        />
      )}
    </div>
  );
};
