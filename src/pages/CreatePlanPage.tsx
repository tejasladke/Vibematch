import React, { useState, useMemo } from 'react';
import { Plan, PlanCategory, TravelPreference } from '../types/index.js';
import { CategoryBadge } from '../components/common/CategoryBadge.js';
import {
  ALL_NAVI_MUMBAI_PLACES,
  NAVI_MUMBAI_MALLS,
  NAVI_MUMBAI_CAFES,
  NAVI_MUMBAI_TURFS,
  NAVI_MUMBAI_GAMING_CAFES,
  NaviMumbaiPlace,
} from '../data/naviMumbaiPlaces.js';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Wallet,
  Car,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Search,
  Building2,
  Coffee,
  Trophy,
  Gamepad2,
  Check,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../components/common/Toast.js';
import { Modal } from '../components/common/Modal.js';
import { NaviMumbaiPlacesExplorer } from '../components/plans/NaviMumbaiPlacesExplorer.js';

interface CreatePlanPageProps {
  onPlanCreated?: (plan: Plan) => void;
  onSuccess?: (planId: string) => void;
  onNavigate?: (tab: string) => void;
  initialLocation?: string;
  initialCategory?: PlanCategory;
  initialTitle?: string;
}

const CATEGORIES: PlanCategory[] = [
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

const TRAVEL_OPTIONS: TravelPreference[] = [
  'Own Vehicle',
  'Metro/Public',
  'Carpool',
  'Cab Split',
  'Flexible',
];

const DEFAULT_CATEGORY_IMAGES: Record<PlanCategory, string> = {
  Movie: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  Café: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
  Turf: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  Trip: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
  Trekking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
  Concert: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  Festival: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  Study: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
  Food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  Gaming: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
  Sports: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
  Other: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
};

export const CreatePlanPage: React.FC<CreatePlanPageProps> = ({
  onPlanCreated,
  onSuccess,
  onNavigate: _onNavigate,
  initialLocation,
  initialCategory,
  initialTitle,
}) => {
  const [category, setCategory] = useState<PlanCategory>(initialCategory || 'Café');
  const [title, setTitle] = useState<string>(initialTitle || '');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [location, setLocation] = useState<string>(initialLocation || '');
  const [maxPeople, setMaxPeople] = useState<number>(4);
  const [budget, setBudget] = useState<string>('Split evenly (~₹300)');
  const [travelPreference, setTravelPreference] = useState<TravelPreference>('Flexible');
  const [description, setDescription] = useState<string>('');
  const [customImage, setCustomImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isNaviMumbaiModalOpen, setIsNaviMumbaiModalOpen] = useState<boolean>(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);

  const { showToast } = useToast();

  const activeImage = customImage || DEFAULT_CATEGORY_IMAGES[category];

  // Category specific venue recommendations
  const categoryVenues = useMemo(() => {
    switch (category) {
      case 'Café':
      case 'Study':
        return NAVI_MUMBAI_CAFES.slice(0, 8);
      case 'Turf':
      case 'Sports':
        return NAVI_MUMBAI_TURFS.slice(0, 8);
      case 'Gaming':
        return NAVI_MUMBAI_GAMING_CAFES.slice(0, 8);
      case 'Movie':
      case 'Food':
        return NAVI_MUMBAI_MALLS;
      default:
        return ALL_NAVI_MUMBAI_PLACES.slice(0, 8).map((p) => p.name);
    }
  }, [category]);

  // Autocomplete matching list based on typed location
  const autocompleteSuggestions = useMemo(() => {
    if (!location || location.trim().length < 2) return [];
    const q = location.toLowerCase().trim();
    return ALL_NAVI_MUMBAI_PLACES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [location]);

  const handleSelectVenue = (venueName: string) => {
    setLocation(venueName);
    setShowLocationDropdown(false);

    // If title is blank, generate a smart title
    if (!title) {
      if (category === 'Café') setTitle(`Coffee & Chill @ ${venueName} ☕`);
      else if (category === 'Turf') setTitle(`Friendly Box Football Match @ ${venueName} ⚽`);
      else if (category === 'Gaming') setTitle(`Squad Gaming & LAN Session @ ${venueName} 🎮`);
      else if (category === 'Movie') setTitle(`Movie & Food Court Hangout @ ${venueName} 🍿`);
      else setTitle(`Meetup & Squad Vibe @ ${venueName} ✨`);
    }
  };

  const handleSelectFromExplorer = (place: NaviMumbaiPlace) => {
    setLocation(`${place.name}, ${place.area}`);
    setCategory(place.matchedPlanCategory);
    setIsNaviMumbaiModalOpen(false);

    if (!title) {
      if (place.category === 'CAFES') setTitle(`Coffee & Hangout @ ${place.name} ☕`);
      else if (place.category === 'TURFS') setTitle(`7v7 Turf Clash @ ${place.name} ⚽`);
      else if (place.category === 'GAMING CAFES') setTitle(`Gaming & PS5 Session @ ${place.name} 🎮`);
      else setTitle(`Shopping & Movie Screening @ ${place.name} 🍿`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast({ title: 'Title required', message: 'Please provide a clear title for your plan.', type: 'error' });
      return;
    }
    if (!date) {
      showToast({ title: 'Date required', message: 'Please select what day this plan happens.', type: 'error' });
      return;
    }
    if (!time) {
      showToast({ title: 'Time required', message: 'Please specify the meetup time.', type: 'error' });
      return;
    }
    if (!location.trim()) {
      showToast({ title: 'Location required', message: 'Please enter a venue or meeting spot.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createPlan({
        title: title.trim(),
        category,
        date,
        time,
        location: location.trim(),
        maxPeople,
        budget: budget.trim(),
        travelPreference,
        description: description.trim(),
        image: activeImage,
      });

      if (res.success && res.data) {
        showToast({
          title: 'Plan Published! 🎉',
          message: `"${res.data.title}" is now live! Others can request to join.`,
          type: 'success',
        });
        if (onPlanCreated) {
          onPlanCreated(res.data);
        } else if (onSuccess) {
          onSuccess(res.data.id);
        }
      } else {
        showToast({
          title: 'Error',
          message: res.error || 'Failed to create plan.',
          type: 'error',
        });
      }
    } catch {
      showToast({ title: 'Error', message: 'Could not create plan.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Host Activity
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-display">
            Create a New Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pick an activity, select popular Navi Mumbai venues, and meet awesome people.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNaviMumbaiModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Navi Mumbai Places Directory</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Category Selection */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Select Plan Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setCustomImage('');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <CategoryBadge category={cat} size="sm" showIcon={true} />
                  <span className="text-xs font-bold text-slate-800">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Core Plan Details */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. Basic Details <span className="text-rose-500">*</span>
          </label>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plan Title / Activity Headline
            </label>
            <input
              type="text"
              id="plan-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dune 2 IMAX screening, 7v7 Box Football, Speciality Brews catchup"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-hidden bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Date
              </label>
              <input
                type="date"
                id="plan-date-input"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-500 outline-hidden bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Time
              </label>
              <input
                type="time"
                id="plan-time-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-500 outline-hidden bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Location & Quick Navi Mumbai Venue Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Venue / Meeting Spot
              </label>
              <button
                type="button"
                onClick={() => setIsNaviMumbaiModalOpen(true)}
                className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Browse All 60+ Navi Mumbai Places</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Venue Recommendation Chips for current category */}
            <div className="mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Popular Navi Mumbai {category} Venues:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {categoryVenues.map((vName) => {
                  const isMatch = location.toLowerCase().includes(vName.toLowerCase());
                  return (
                    <button
                      type="button"
                      key={vName}
                      onClick={() => handleSelectVenue(vName)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                        isMatch
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isMatch && <Check className="w-3 h-3 text-white" />}
                      <span>{vName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Location input with live autocomplete */}
            <div className="relative">
              <input
                type="text"
                id="plan-location-input"
                value={location}
                onFocus={() => setShowLocationDropdown(true)}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowLocationDropdown(true);
                }}
                placeholder="Type or select a venue (e.g. Nexus Seawoods, Third Wave Vashi, Terna Turf)..."
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 outline-hidden bg-slate-50 focus:bg-white"
              />

              {/* Autocomplete dropdown */}
              {showLocationDropdown && autocompleteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-lg z-30 overflow-hidden py-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    Matching Navi Mumbai Venues
                  </div>
                  {autocompleteSuggestions.map((place) => (
                    <button
                      type="button"
                      key={place.id}
                      onClick={() => {
                        handleSelectVenue(`${place.name}, ${place.area}`);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-indigo-50/70 flex items-center justify-between gap-2 border-b border-slate-50 last:border-0 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {place.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {place.area} • {place.tag}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                        {place.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Squad Limits & Logistics */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. Squad Limit & Logistics
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Squad Size Counter */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-indigo-600" /> Max Squad Size
                </label>
                <p className="text-[11px] text-slate-500">Including yourself as host</p>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setMaxPeople((prev) => Math.max(2, prev - 1))}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  -
                </button>
                <span className="text-xl font-extrabold text-slate-900 w-8 text-center font-display">
                  {maxPeople}
                </span>
                <button
                  type="button"
                  onClick={() => setMaxPeople((prev) => Math.min(20, prev + 1))}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Wallet className="w-4 h-4 text-emerald-600" /> Budget Expectation
                </label>
                <p className="text-[11px] text-slate-500">Cost split per person</p>
              </div>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₹500/person, Dutch split, Free"
                className="w-full mt-3 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-indigo-500 outline-hidden"
              />
            </div>

            {/* Travel Preference */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Car className="w-4 h-4 text-blue-600" /> Travel Mode
                </label>
                <p className="text-[11px] text-slate-500">How squad travels</p>
              </div>
              <select
                value={travelPreference}
                onChange={(e) => setTravelPreference(e.target.value as TravelPreference)}
                className="w-full mt-3 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-indigo-500 outline-hidden"
              >
                {TRAVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Squad Vibe (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others what you're hyped about, what to bring, or who you're looking to meet..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-hidden resize-none bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* 4. Cover Photo Selector */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" /> 4. Plan Visual Cover
          </label>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:w-48 h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              <img
                src={activeImage}
                alt="Cover preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                Active Cover
              </span>
            </div>

            <div className="flex-1 space-y-2 w-full">
              <p className="text-xs text-slate-500 leading-relaxed">
                Default high-resolution photo selected for <span className="font-semibold text-slate-800">{category}</span>. Or paste your custom image URL below:
              </p>
              <input
                type="url"
                value={customImage}
                onChange={(e) => setCustomImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-indigo-500 outline-hidden bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            id="publish-plan-btn"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              'Publishing Plan...'
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Publish & Find Squad</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Navi Mumbai Places Modal */}
      <Modal
        isOpen={isNaviMumbaiModalOpen}
        onClose={() => setIsNaviMumbaiModalOpen(false)}
        maxWidth="3xl"
      >
        <NaviMumbaiPlacesExplorer
          variant="modal"
          onSelectPlaceForPlan={handleSelectFromExplorer}
          selectedPlaceName={location}
        />
      </Modal>
    </div>
  );
};
