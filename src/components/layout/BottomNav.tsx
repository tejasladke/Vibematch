import React from 'react';
import { Compass, PlusCircle, CalendarCheck, Users, MessageSquare, Bell } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  unreadChatsCount?: number;
  unreadNotifsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  unreadChatsCount = 0,
  unreadNotifsCount = 0,
}) => {
  const items = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'my-plans', label: 'My Plans', icon: CalendarCheck },
    { id: 'create', label: 'Create', icon: PlusCircle, isPrimary: true },
    { id: 'connections', label: 'Squad', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unreadChatsCount },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadNotifsCount },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                id="bottom-nav-create"
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center justify-center -mt-5 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 mt-1">Create</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl cursor-pointer transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
