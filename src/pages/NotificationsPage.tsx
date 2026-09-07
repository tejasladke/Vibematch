import React, { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types/index.js';
import { api } from '../services/api.js';
import { EmptyState } from '../components/common/EmptyState.js';
import {
  Bell,
  CheckCheck,
  UserCheck,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { useToast } from '../components/common/Toast.js';

interface NotificationsPageProps {
  onNavigate: (tab: string, extra?: unknown) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        showToast({ title: 'Success', message: 'All notifications marked as read', type: 'info' });
      }
    } catch {
      showToast({ title: 'Error', message: 'Failed to mark notifications', type: 'error' });
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      api.markNotificationRead(notif.id).catch(console.error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }

    if (notif.type === 'join_request_received') {
      onNavigate('requests');
    } else if (notif.type === 'join_request_accepted' || notif.type === 'new_message') {
      if (notif.data?.connectionId) {
        onNavigate('chat', { connectionId: notif.data.connectionId });
      } else {
        onNavigate('chat');
      }
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'join_request_received':
        return <UserCheck className="w-5 h-5 text-indigo-600" />;
      case 'join_request_accepted':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Activity Alerts
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-display">
            Notifications Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay updated on join requests, squad invites, and new direct messages.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-slate-500" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                notif.isRead ? 'hover:bg-slate-50/70' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center shrink-0">
                {getNotifIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
              </div>

              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You don't have any unread notifications. When other users interact with your activities, alerts will show up here."
        />
      )}
    </div>
  );
};
