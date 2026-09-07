import React, { useState, useEffect, useCallback } from 'react';
import { Plan } from '../types/index.js';
import { api } from '../services/api.js';
import { PlanCard } from '../components/plans/PlanCard.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Calendar, Plus, Compass } from 'lucide-react';

interface MyPlansPageProps {
  onSelectPlan: (plan: Plan) => void;
  onNavigate: (tab: string) => void;
  onOpenUser?: (userId: string) => void;
}

export const MyPlansPage: React.FC<MyPlansPageProps> = ({
  onSelectPlan,
  onNavigate,
  onOpenUser,
}) => {
  const [createdPlans, setCreatedPlans] = useState<Plan[]>([]);
  const [joinedPlans, setJoinedPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState<'hosting' | 'joined'>('hosting');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMyPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const [createdRes, joinedRes] = await Promise.all([
        api.getMyCreatedPlans(),
        api.getMyJoinedPlans(),
      ]);
      if (createdRes.success) setCreatedPlans(createdRes.data || []);
      if (joinedRes.success) setJoinedPlans(joinedRes.data || []);
    } catch (e) {
      console.error('Failed to load my plans', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPlans();
  }, [fetchMyPlans]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            My Schedule
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-display">
            My Activity Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Keep track of activities you are hosting and squad hangouts you are attending.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('create')}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Host New Plan</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          id="tab-my-hosting"
          onClick={() => setActiveTab('hosting')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'hosting'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Hosting ({createdPlans.length})</span>
        </button>

        <button
          type="button"
          id="tab-my-joined"
          onClick={() => setActiveTab('joined')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'joined'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Attending Squads ({joinedPlans.length})</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'hosting' ? (
        createdPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {createdPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={onSelectPlan}
                onRequestSuccess={fetchMyPlans}
                onOpenUser={onOpenUser}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="You haven't hosted any plans yet"
            description="Have a movie in mind, want to check out a new café, or need players for turf football? Create your first plan now!"
            actionText="Host an Activity"
            onAction={() => onNavigate('create')}
          />
        )
      ) : joinedPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {joinedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={onSelectPlan}
              onRequestSuccess={fetchMyPlans}
              onOpenUser={onOpenUser}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="You're not attending any upcoming squads"
          description="Browse the Discover feed and send requests to join exciting activities happening in your city."
          actionText="Discover Plans"
          onAction={() => onNavigate('discover')}
        />
      )}
    </div>
  );
};
