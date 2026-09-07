import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Plan } from '../../types/index.js';
import { CategoryBadge } from '../common/CategoryBadge.js';
import { Send, MapPin, Calendar, Users } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../common/Toast.js';

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  onSuccess: () => void;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) => {
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.createJoinRequest(plan.id, message.trim());
      if (res.success) {
        showToast({
          title: 'Request Sent! 🚀',
          message: `Your request to join "${plan.title}" has been sent to ${plan.creator?.name || 'the host'}.`,
          type: 'success',
        });
        onSuccess();
        onClose();
      } else {
        showToast({
          title: 'Unable to Send',
          message: res.error || 'Failed to submit request.',
          type: 'error',
        });
      }
    } catch {
      showToast({ title: 'Error', message: 'Something went wrong.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request to Join" maxWidth="md">
      <div className="space-y-4">
        {/* Plan summary */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
          {plan.image && (
            <img
              src={plan.image}
              alt={plan.title}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <CategoryBadge category={plan.category} size="sm" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm truncate">{plan.title}</h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {plan.date}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {plan.location.split(',')[0]}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {plan.joinedCount}/{plan.maxPeople}
              </span>
            </div>
          </div>
        </div>

        {/* Note from creator */}
        <div className="text-xs text-slate-600 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
          💡 <span className="font-semibold text-indigo-950">Host note:</span> When accepted, you&apos;ll be added to the squad and private chat will unlock automatically!
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Say Hi to {plan.creator?.name || 'the host'} (Optional)
            </label>
            <textarea
              rows={3}
              id="join-request-message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Hey! Big fan of this movie, would love to tag along and split the popcorn!"
              className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-hidden resize-none"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-join-request-btn"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
