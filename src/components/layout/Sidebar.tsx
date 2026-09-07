import React from 'react';
import {
  Compass,
  PlusCircle,
  CalendarCheck,
  UserCheck,
  Users,
  MessageSquare,
  Bell,
  User,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string, extra?: unknown) => void;
  incomingRequestsCount?: number;
  unreadChatsCount?: number;
  unreadNotifsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  incomingRequestsCount = 0,
  unreadChatsCount = 0,
  unreadNotifsCount = 0,
}) => {
  const { user, switchDemoUser } = useAuth();
  const { onlineUserIds } = useSocket();

  const navItems = [
    { id: 'discover', label: 'Discover Plans', icon: Compass, badge: null },
    { id: 'create', label: 'Create Plan', icon: PlusCircle, badge: 'New' },
    { id: 'my-plans', label: 'My Plans', icon: CalendarCheck, badge: null },
    {
      id: 'requests',
      label: 'Join Requests',
      icon: UserCheck,
      badge: incomingRequestsCount > 0 ? `${incomingRequestsCount}` : null,
      badgeColor: 'bg-indigo-600 text-white',
    },
    { id: 'connections', label: 'My Squad', icon: Users, badge: null },
    {
      id: 'chat',
      label: 'Private Chat',
      icon: MessageSquare,
      badge: unreadChatsCount > 0 ? `${unreadChatsCount}` : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? `${unreadNotifsCount}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'profile', label: 'My Profile', icon: User, badge: null },
    { id: 'settings', label: 'Safety & Settings', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between p-4 border-r border-slate-200/80 bg-white min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Section */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Squad Presence Card */}
        <div className="p-4 rounded-3xl bg-linear-to-br from-indigo-50/70 via-violet-50/40 to-pink-50/40 border border-indigo-100/80">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Active Live Squad</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            {onlineUserIds.length > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {onlineUserIds.length} user{onlineUserIds.length === 1 ? '' : 's'} online now
              </span>
            ) : (
              'Real-time socket active & ready'
            )}
          </p>
        </div>
      </div>

      {/* Demo Switcher Quick Bar */}
      {user && (
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Quick Account Switch
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => switchDemoUser('9876543210')}
              title="Switch to Aarav (Creator)"
              className={`p-1.5 text-center rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer ${
                user.phone === '9876543210'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Aarav
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('9876543211')}
              title="Switch to Riya (Requester)"
              className={`p-1.5 text-center rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer ${
                user.phone === '9876543211'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Riya
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('9876543212')}
              title="Switch to Kabir (Captain)"
              className={`p-1.5 text-center rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer ${
                user.phone === '9876543212'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Kabir
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
