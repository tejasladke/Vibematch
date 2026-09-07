import React from 'react';
import {
  Film,
  Coffee,
  Trophy,
  Plane,
  Mountain,
  Music,
  Sparkles,
  BookOpen,
  Utensils,
  Gamepad2,
  Activity,
  Zap,
} from 'lucide-react';
import { PlanCategory } from '../../types/index.js';

interface CategoryBadgeProps {
  category: PlanCategory | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Movie':
      return { bg: 'bg-violet-100 text-violet-700 border-violet-200', icon: Film, hex: '#8b5cf6' };
    case 'Café':
      return { bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Coffee, hex: '#f59e0b' };
    case 'Turf':
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Trophy, hex: '#10b981' };
    case 'Trip':
      return { bg: 'bg-sky-100 text-sky-800 border-sky-200', icon: Plane, hex: '#0284c7' };
    case 'Trekking':
      return { bg: 'bg-orange-100 text-orange-800 border-orange-200', icon: Mountain, hex: '#f97316' };
    case 'Concert':
      return { bg: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200', icon: Music, hex: '#d946ef' };
    case 'Festival':
      return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Sparkles, hex: '#6366f1' };
    case 'Study':
      return { bg: 'bg-teal-100 text-teal-800 border-teal-200', icon: BookOpen, hex: '#14b8a6' };
    case 'Food':
      return { bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: Utensils, hex: '#f43f5e' };
    case 'Gaming':
      return { bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: Gamepad2, hex: '#a855f7' };
    case 'Sports':
      return { bg: 'bg-lime-100 text-lime-800 border-lime-200', icon: Activity, hex: '#84cc16' };
    default:
      return { bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: Zap, hex: '#64748b' };
  }
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = getCategoryColor(category);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide whitespace-nowrap shadow-xs ${config.bg} ${sizeClasses} ${className}`}
    >
      {showIcon && <IconComponent className={`${iconSizes} shrink-0`} />}
      <span>{category}</span>
    </span>
  );
};
