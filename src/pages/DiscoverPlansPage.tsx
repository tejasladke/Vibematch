import React, { useState, useEffect, useCallback } from 'react';
import { Plan, PlanCategory } from '../types/index.js';
import { api } from '../services/api.js';
import { PlanCard } from '../components/plans/PlanCard.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { NAVI_MUMBAI_AREAS } from '../data/naviMumbaiPlaces.js';
import {
  Search,
  MapPin,
  Calendar,
  X,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  Sparkles,
} from 'lucide-react';
import { CategoryBadge } from '../components/common/CategoryBadge.js';

interface DiscoverPlansPageProps {
  onSelectPlan: (plan: Plan) => void;
  onNavigate: (tab: string, extra?: unknown) => void;
  onOpenUser?: (userId: string) => void;
}

const CATEGORIES: (PlanCategory | 'All')[] = [
  'All',
  'Movie',
  'Café',
  'Turf',
  'Trip',
  'Trekking',
  'Concert',
  'Festival',
  'Study',
  'Food',
  'Gaming',
  'Sports',
  'Other',
];

export const DiscoverPlansPage: React.FC<DiscoverPlansPageProps> = ({
  onSelectPlan,
  onNavigate,
  onOpenUser,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getPlans({
        search: searchQuery,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        location: selectedLocation,
        date: selectedDate,
        status: 'open',
      });
      if (res.success && res.data) {
        setPlans(res.data);
      }
    } catch (e) {
      console.error('Failed to load plans', e);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLocation, selectedDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlans();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchPlans]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('');
    setSelectedDate('');
  };


  const hasActiveFilters =
    searchQuery || selectedCategory !== 'All' || selectedLocation || selectedDate;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-900 to-violet-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-900/60 px-3 py-1 rounded-full border border-indigo-700/50 mb-3">
            ✨ Find Your Vibe, Make Real Plans
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display leading-tight">
            Stop waiting on group chats. <br />
            <span className="bg-gradient-to-r from-indigo-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
              Hang out with people who actually show up.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 max-w-lg leading-relaxed">
            From late-night movie premieres at Nexus Seawoods to turf football in Nerul and gaming lounges in Kharghar & Vashi. Join verified plans or host your own squad.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              id="hero-create-plan-btn"
              onClick={() => onNavigate('create')}
              className="px-5 py-2.5 rounded-2xl bg-white text-slate-950 text-xs sm:text-sm font-bold hover:bg-slate-100 shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Host an Activity</span>
            </button>
            <button
              onClick={() => {
                setSelectedDate(new Date().toISOString().split('T')[0]);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs sm:text-sm font-semibold border border-white/15 transition-all cursor-pointer"
            >
              Plans Today ⚡
            </button>
            <button
              onClick={() => {
                setSelectedLocation('Navi Mumbai');
                setShowFilters(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs sm:text-sm font-semibold border border-indigo-400/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-300" />
              <span>Navi Mumbai Plans</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Home Discovery Section */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">Discover your next plan</span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              What are you in the mood for?
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Pick a vibe and jump straight to matching plans — no giant wall of place cards.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('create')}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create a plan
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Coffee & Chill', emoji: '☕', category: 'Café', note: 'Catch-ups & café plans' },
            { label: 'Food Runs', emoji: '🍜', category: 'Food', note: 'Street food to dinner' },
            { label: 'Movies & Fun', emoji: '🎬', category: 'Movie', note: 'Cinema & casual plans' },
            { label: 'Games & Sports', emoji: '🎮', category: 'Gaming', note: 'Gaming, turf & more' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setSelectedCategory(item.category);
                document.getElementById('plans-feed-anchor')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="text-2xl">{item.emoji}</div>
              <div className="mt-3 text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">{item.label}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{item.note}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick areas</span>
          {['Navi Mumbai', 'Vashi', 'Nerul', 'Kharghar', 'Mumbai'].map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => {
                setSelectedLocation(area);
                setShowFilters(true);
                document.getElementById('plans-feed-anchor')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
              {area}
            </button>
          ))}
        </div>
      </section>

      {/* Category Pills Slider */}
      <div id="plans-feed-anchor" className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Browse by Activity
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 cursor-pointer transition-all ${
                  isSelected ? 'scale-105 shadow-md' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {cat === 'All' ? (
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                      isSelected
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    All Categories
                  </span>
                ) : (
                  <CategoryBadge
                    category={cat}
                    size="md"
                    className={isSelected ? 'ring-2 ring-indigo-500 font-bold' : ''}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-plans-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plans (e.g. Nexus, SpawnX, Third Wave, 5v5 Turf)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                showFilters || selectedLocation || selectedDate
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {(selectedLocation || selectedDate) && (
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
              )}
            </button>

            <button
              type="button"
              onClick={fetchPlans}
              title="Refresh plans"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Navi Mumbai Area Chips in Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Areas:</span>
          {NAVI_MUMBAI_AREAS.map((area) => {
            const isMatch =
              area === 'All Navi Mumbai'
                ? selectedLocation === 'Navi Mumbai'
                : selectedLocation.toLowerCase() === area.toLowerCase();
            return (
              <button
                type="button"
                key={area}
                onClick={() => {
                  if (area === 'All Navi Mumbai') {
                    setSelectedLocation(isMatch ? '' : 'Navi Mumbai');
                  } else {
                    setSelectedLocation(isMatch ? '' : area);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  isMatch
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
            {/* Location filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Location / Spot / Venue
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="filter-location-input"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  placeholder="e.g. Nexus Seawoods, Kharghar, Nerul, Vashi..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>

            {/* Date filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Specific Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  id="filter-date-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Clear Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Showing filtered results
              {selectedLocation && (
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[11px] border border-indigo-200">
                  📍 {selectedLocation}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Grid of Plans */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 rounded-3xl bg-slate-100 animate-pulse border border-slate-200/60"
            />
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={onSelectPlan}
              onRequestSuccess={fetchPlans}
              onOpenUser={onOpenUser}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No spontaneous plans found"
          description={
            hasActiveFilters
              ? `No active plans matching "${selectedLocation || searchQuery || selectedCategory}". Try another Navi Mumbai hotspot or host your own!`
              : 'Be the first person to create a plan for this category and gather a squad!'
          }
          actionText={hasActiveFilters ? 'Clear Filters' : 'Create a Plan'}
          onAction={hasActiveFilters ? clearAllFilters : () => onNavigate('create')}
        />
      )}
    </div>
  );
};
