import React, { useState } from 'react';
import { Plan } from '../../types/index.js';
import { CategoryBadge } from '../common/CategoryBadge.js';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Wallet,
  Car,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { JoinRequestModal } from './JoinRequestModal.js';
import { useAuth } from '../../context/AuthContext.js';

interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan) => void;
  onRequestSuccess?: () => void;
  onOpenUser?: (userId: string) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onSelect,
  onRequestSuccess,
  onOpenUser,
}) => {
  const { user } = useAuth();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);

  const isCreator = user && plan.creatorId === user.id;
  const isMember = user && plan.members?.some((m) => (typeof m === 'string' ? m === user.id : m.id === user.id));
  const remainingSlots = Math.max(0, plan.maxPeople - plan.joinedCount);
  const isFull = remainingSlots === 0;

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsJoinModalOpen(true);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (plan.creatorId && onOpenUser) {
      onOpenUser(plan.creatorId);
    }
  };

  return (
    <>
      <div
        onClick={() => onSelect(plan)}
        className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
      >
        {/* Card Image Banner */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
          <img
            src={plan.image || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80'}
            alt={plan.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Category Badge overlay */}
          <div className="absolute top-3 left-3">
            <CategoryBadge category={plan.category} size="md" className="backdrop-blur-md bg-white/90 shadow-sm" />
          </div>

          {/* Slots Pill overlay */}
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                isFull
                  ? 'bg-rose-500/90 text-white'
                  : remainingSlots <= 2
                  ? 'bg-amber-500/90 text-white'
                  : 'bg-slate-900/80 text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              {isFull ? 'Squad Full' : `${remainingSlots} spot${remainingSlots === 1 ? '' : 's'} left`}
            </span>
          </div>

          {/* Host overlay at bottom of image */}
          {plan.creator && (
            <div
              onClick={handleAvatarClick}
              className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={plan.creator.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={plan.creator.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
                />
                <div>
                  <p className="text-xs font-semibold leading-tight drop-shadow-sm flex items-center gap-1">
                    {plan.creator.name}
                    {plan.creator.age ? <span className="opacity-80">({plan.creator.age})</span> : null}
                  </p>
                  <p className="text-[10px] text-slate-200 drop-shadow-sm truncate max-w-[160px]">
                    {plan.creator.location || 'Bengaluru'}
                  </p>
                </div>
              </div>

              {isCreator && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-md shadow-xs">
                  Your Plan
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-indigo-600 transition-colors line-clamp-1 font-display">
              {plan.title}
            </h3>

            {plan.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {plan.description}
              </p>
            )}

            {/* Key Information Badges */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/80">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate font-medium">{plan.date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/80">
                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate font-medium">{plan.time}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/80 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate font-medium">{plan.location}</span>
              </div>
            </div>

            {/* Micro Tags: Budget & Travel */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              {plan.budget && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                  <Wallet className="w-3 h-3" /> {plan.budget}
                </span>
              )}
              {plan.travelPreference && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                  <Car className="w-3 h-3" /> {plan.travelPreference}
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {plan.joinedCount} of {plan.maxPeople} joined
              </span>
            </div>

            {isCreator ? (
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-0.5">
                Manage Squad <ChevronRight className="w-4 h-4" />
              </span>
            ) : isMember ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5" /> Joined
              </span>
            ) : (
              <button
                type="button"
                id={`join-plan-btn-${plan.id}`}
                disabled={isFull}
                onClick={handleJoinClick}
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl transition-all shadow-xs hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isFull ? 'Full' : 'Join Squad'}
              </button>
            )}
          </div>
        </div>
      </div>

      <JoinRequestModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        plan={plan}
        onSuccess={() => {
          if (onRequestSuccess) onRequestSuccess();
        }}
      />
    </>
  );
};
