import React, { useState } from 'react';
import {
  Sparkles,
  Bell,
  PlusCircle,
  Search,
  LogOut,
  User as UserIcon,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, extra?: unknown) => void;
  unreadCount?: number;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab: _currentTab,
  onNavigate,
  unreadCount = 0,
}) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Slogan */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('discover')}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl font-display tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
                PlanMate
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-indigo-600 ml-1.5 px-1.5 py-0.5 bg-indigo-50 rounded-md border border-indigo-100/80">
                Gen-Z
              </span>
            </div>
          </button>
        </div>

        {/* Center: Search trigger & Real-time connection indicator */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="w-full flex items-center gap-2.5 px-4 py-2 bg-slate-100/90 hover:bg-slate-200/70 text-slate-500 rounded-2xl text-xs font-medium transition-colors cursor-pointer border border-slate-200/50"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search movies, cafés, turf, trips...</span>
            <kbd className="ml-auto text-[10px] bg-white text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-200 font-mono shadow-2xs">
              Explore
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Create Plan CTA */}
          <button
            type="button"
            id="nav-create-plan-btn"
            onClick={() => onNavigate('create')}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden xs:inline">Create Plan</span>
            <span className="xs:hidden">Create</span>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            id="nav-notifications-btn"
            onClick={() => onNavigate('notifications')}
            className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile dropdown */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                id="user-profile-menu-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-2xl hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-xl object-cover"
                  />
                  {isConnected && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">+{user.phone}</p>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" /> My Profile & Stats
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-slate-400" /> Settings & Safety
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
