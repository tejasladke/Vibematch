import React, { useState, useEffect, useCallback } from 'react';
import { Plan } from '../types/index.js';
import { api } from '../services/api.js';
import { CategoryBadge } from '../components/common/CategoryBadge.js';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Wallet,
  Car,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { JoinRequestModal } from '../components/plans/JoinRequestModal.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/common/Toast.js';

interface PlanDetailsPageProps {
  planId: string;
  onBack: () => void;
  onNavigate: (tab: string, extra?: unknown) => void;
  onOpenUser?: (userId: string) => void;
}

export const PlanDetailsPage: React.FC<PlanDetailsPageProps> = ({
  planId,
  onBack,
  onNavigate,
  onOpenUser,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [plan, setPlan] = useState<
    | (Plan & {
        remainingSlots: number;
        userRelation?: {
          isCreator: boolean;
          isMember: boolean;
          hasPendingRequest: boolean;
          joinRequestId: string | null;
          connectionId: string | null;
        };
      })
    | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getPlanById(planId);
      if (res.success && res.data) {
        setPlan(res.data);
      }
    } catch (e) {
      console.error('Error fetching plan details', e);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-64 rounded-3xl bg-slate-200" />
        <div className="h-32 rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Plan not found</h2>
        <p className="text-sm text-slate-500 mt-1">This plan may have been deleted or expired.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold cursor-pointer"
        >
          Back to Discover
        </button>
      </div>
    );
  }

  const isCreator = user && plan.creatorId === user.id;
  const isMember = plan.userRelation?.isMember;
  const hasPendingRequest = plan.userRelation?.hasPendingRequest;
  const connectionId = plan.userRelation?.connectionId;
  const remainingSlots = Math.max(0, plan.maxPeople - plan.joinedCount);
  const isFull = remainingSlots === 0;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast({ title: 'Link copied!', message: 'Share this plan with your friends.', type: 'info' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Share Plan</span>
        </button>
      </div>

      {/* Main Image Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-xl border border-slate-200">
        <div className="relative h-64 sm:h-80 w-full">
          <img
            src={plan.image || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80'}
            alt={plan.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Badges on banner */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <CategoryBadge category={plan.category} size="lg" className="backdrop-blur-md bg-white/95" />
          </div>

          <div className="absolute top-4 right-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md ${
                isFull
                  ? 'bg-rose-500/90 text-white'
                  : 'bg-emerald-500/90 text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {isFull ? 'Squad Full' : `${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} available`}
            </span>
          </div>

          {/* Title & Location at bottom of banner */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display drop-shadow-sm">
              {plan.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{plan.location}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Quick Facts Grid */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Date</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5 truncate">{plan.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Time</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5 truncate">{plan.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Budget</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5 truncate">{plan.budget || 'Split evenly'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Car className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Travel</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5 truncate">{plan.travelPreference || 'Flexible'}</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
              About This Activity
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {plan.description ||
                'The host has not added additional notes. Join the squad to connect and plan out the full hangout!'}
            </p>
          </div>

          {/* Current Squad Members Roster */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
                  Confirmed Squad ({plan.joinedCount}/{plan.maxPeople})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Host and verified members who are attending
                </p>
              </div>
              <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (plan.joinedCount / plan.maxPeople) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Creator Card in Squad */}
              {plan.creator && (
                <div
                  onClick={() => plan.creatorId && onOpenUser && onOpenUser(plan.creatorId)}
                  className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={plan.creator.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={plan.creator.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                        {plan.creator.name}
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      </p>
                      <p className="text-[10px] text-indigo-700 font-medium">Activity Host</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Members */}
              {plan.members?.map((member) => {
                if (typeof member === 'string') return null;
                if (member.id === plan.creatorId) return null; // Already shown above
                return (
                  <div
                    key={member.id}
                    onClick={() => onOpenUser && onOpenUser(member.id)}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{member.name}</p>
                        <p className="text-[10px] text-slate-500">{member.location || 'Squad Member'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Joined
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Host Profile & Primary Action Box */}
        <div className="space-y-6">
          {/* Host Profile Spotlight */}
          {plan.creator && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-3">
              <div className="relative inline-block mx-auto">
                <img
                  src={plan.creator.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={plan.creator.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-slate-50 shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center border-2 border-white text-[10px]">
                  ★
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base font-display">
                  {plan.creator.name} {plan.creator.age ? `(${plan.creator.age})` : ''}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{plan.creator.location || 'Bengaluru, India'}</p>
              </div>

              {plan.creator.bio && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  &ldquo;{plan.creator.bio}&rdquo;
                </p>
              )}

              {plan.creator.interests && plan.creator.interests.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {plan.creator.interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => plan.creatorId && onOpenUser && onOpenUser(plan.creatorId)}
                className="w-full mt-2 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/60 rounded-xl transition-colors cursor-pointer"
              >
                View Host Profile
              </button>
            </div>
          )}

          {/* Action Box */}
          <div className="bg-slate-950 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Squad Status</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isFull ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {isFull ? 'Full' : `${remainingSlots} slots remaining`}
              </span>
            </div>

            {isCreator ? (
              <div className="space-y-2.5">
                <div className="p-3 bg-white/10 rounded-2xl text-xs text-slate-300 leading-relaxed">
                  👑 You are the host of this plan. You can review applicants in the Join Requests tab.
                </div>
                <button
                  type="button"
                  id="manage-requests-cta"
                  onClick={() => onNavigate('requests')}
                  className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Join Requests</span>
                </button>
              </div>
            ) : isMember ? (
              <div className="space-y-2.5">
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>You are a confirmed squad member!</span>
                </div>
                <button
                  type="button"
                  id="open-chat-cta"
                  onClick={() => {
                    if (connectionId) {
                      onNavigate('chat', { connectionId });
                    } else {
                      onNavigate('chat');
                    }
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open Private Chat</span>
                </button>
              </div>
            ) : hasPendingRequest ? (
              <div className="p-4 bg-amber-950/80 border border-amber-500/30 rounded-2xl text-center space-y-1">
                <p className="text-xs font-bold text-amber-300">Join Request Pending ⏳</p>
                <p className="text-[11px] text-slate-300">
                  The host has received your request and will review it shortly.
                </p>
              </div>
            ) : (
              <button
                type="button"
                id="request-to-join-cta"
                disabled={isFull}
                onClick={() => setIsJoinModalOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFull ? 'Squad is Full' : 'Request to Join Squad'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <JoinRequestModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        plan={plan}
        onSuccess={fetchDetails}
      />
    </div>
  );
};
