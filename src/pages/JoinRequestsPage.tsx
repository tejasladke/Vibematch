import React, { useState, useEffect, useCallback } from 'react';
import { JoinRequest } from '../types/index.js';
import { api } from '../services/api.js';
import { CategoryBadge } from '../components/common/CategoryBadge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import {
  Check,
  X,
  MessageSquare,
  Clock,
  MapPin,
  Calendar,
  Send,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../components/common/Toast.js';

interface JoinRequestsPageProps {
  onNavigate: (tab: string, extra?: unknown) => void;
  onOpenUser?: (userId: string) => void;
}

export const JoinRequestsPage: React.FC<JoinRequestsPageProps> = ({
  onNavigate,
  onOpenUser,
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<JoinRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { showToast } = useToast();

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [incRes, sentRes] = await Promise.all([
        api.getIncomingRequests(),
        api.getMySentRequests(),
      ]);
      if (incRes.success) setIncomingRequests(incRes.data || []);
      if (sentRes.success) setSentRequests(sentRes.data || []);
    } catch (e) {
      console.error('Failed to load join requests', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (request: JoinRequest) => {
    setActionLoadingId(request.id);
    try {
      const res = await api.acceptRequest(request.id);
      if (res.success) {
        showToast({
          title: 'Squad Member Accepted! 🎉',
          message: `${request.requester?.name || 'User'} has been added to your squad. Private chat is unlocked!`,
          type: 'success',
        });
        fetchRequests();
      } else {
        showToast({ title: 'Error', message: 'Failed to accept request.', type: 'error' });
      }
    } catch {
      showToast({ title: 'Error', message: 'Something went wrong.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await api.rejectRequest(requestId);
      if (res.success) {
        showToast({ title: 'Request Declined', message: 'Request has been rejected.', type: 'info' });
        fetchRequests();
      }
    } catch {
      showToast({ title: 'Error', message: 'Failed to reject request.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingIncomingCount = incomingRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
          Squad Requests
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-display">
          Join Requests & Approvals
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review who wants to join your hosted activities and check your sent applications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          id="tab-incoming-requests"
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'incoming'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Incoming Requests</span>
          {pendingIncomingCount > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {pendingIncomingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-sent-requests"
          onClick={() => setActiveTab('sent')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sent'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>My Sent Requests</span>
          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {sentRequests.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-36 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'incoming' ? (
        incomingRequests.length > 0 ? (
          <div className="space-y-4">
            {incomingRequests.map((req) => {
              const isPending = req.status === 'pending';
              const isAccepted = req.status === 'accepted';
              const isRejected = req.status === 'rejected';

              return (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Requester Profile Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <img
                      src={req.requester?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={req.requester?.name || 'Applicant'}
                      referrerPolicy="no-referrer"
                      onClick={() => req.requesterId && onOpenUser && onOpenUser(req.requesterId)}
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 cursor-pointer border border-slate-100 shadow-2xs"
                    />

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => req.requesterId && onOpenUser && onOpenUser(req.requesterId)}
                          className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors text-left"
                        >
                          {req.requester?.name} {req.requester?.age ? `(${req.requester.age})` : ''}
                        </button>

                        <span className="text-[11px] text-slate-500">
                          {req.requester?.location || 'Bengaluru'}
                        </span>
                      </div>

                      {/* Plan badge */}
                      {req.plan && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span>Wants to join:</span>
                          <span className="font-bold text-slate-900 truncate">&ldquo;{req.plan.title}&rdquo;</span>
                          <CategoryBadge category={req.plan.category} size="sm" />
                        </div>
                      )}

                      {/* Personalized note from applicant */}
                      {req.message && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 italic">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}

                      {/* Requester Interests */}
                      {req.requester?.interests && req.requester.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {req.requester.interests.map((int) => (
                            <span
                              key={int}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              {int}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          id={`reject-request-${req.id}`}
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleReject(req.id)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5 text-slate-400" />
                          <span>Decline</span>
                        </button>
                        <button
                          type="button"
                          id={`accept-request-${req.id}`}
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleAccept(req)}
                          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept to Squad</span>
                        </button>
                      </>
                    ) : isAccepted ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          Accepted & Added
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate('chat')}
                          className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          title="Open chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        Declined
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No incoming requests yet"
            description="When users discover your plans and request to join, you'll review and approve them here."
          />
        )
      ) : sentRequests.length > 0 ? (
        <div className="space-y-4">
          {sentRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isAccepted = req.status === 'accepted';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{req.plan?.title || 'Activity Plan'}</h4>
                    {req.plan?.category && <CategoryBadge category={req.plan.category} size="sm" />}
                  </div>

                  {req.plan && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> {req.plan.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> {req.plan.location}
                      </span>
                    </div>
                  )}

                  {req.message && (
                    <p className="text-xs text-slate-500 italic mt-1">&ldquo;{req.message}&rdquo;</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  )}
                  {isAccepted && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        <Sparkles className="w-3 h-3" /> Accepted!
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('chat')}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-indigo-700 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    </div>
                  )}
                  {isRejected && (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      Not Accepted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="You haven't requested to join any plans"
          description="Browse open spontaneous plans and request to join activities happening around you!"
          actionText="Discover Plans"
          onAction={() => onNavigate('discover')}
        />
      )}
    </div>
  );
};
