import React, { useMemo, useState } from 'react';
import {
  ALL_NAVI_MUMBAI_PLACES,
  NAVI_MUMBAI_AREAS,
  NaviMumbaiPlace,
} from '../../data/naviMumbaiPlaces.js';
import {
  MapPin,
  Search,
  Building2,
  Coffee,
  Trophy,
  Gamepad2,
  Plus,
  Compass,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface NaviMumbaiPlacesExplorerProps {
  onSelectPlaceForSearch?: (placeName: string) => void;
  onSelectPlaceForPlan?: (place: NaviMumbaiPlace) => void;
  selectedPlaceName?: string;
  variant?: 'bento' | 'modal' | 'compact';
}

type Category = 'ALL' | 'MALLS' | 'CAFES' | 'TURFS' | 'GAMING CAFES';

const INITIAL_VISIBLE = 12;

export const NaviMumbaiPlacesExplorer: React.FC<NaviMumbaiPlacesExplorerProps> = ({
  onSelectPlaceForSearch,
  onSelectPlaceForPlan,
  selectedPlaceName,
  variant = 'bento',
}) => {
  const [activeCategory, setActiveCategory] = useState<Category>('ALL');
  const [selectedArea, setSelectedArea] = useState('All Mumbai & Navi Mumbai');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_NAVI_MUMBAI_PLACES.filter((place) => {
      if (activeCategory !== 'ALL' && place.category !== activeCategory) return false;
      if (selectedArea !== 'All Mumbai & Navi Mumbai' && place.area !== selectedArea) return false;
      if (q && ![place.name, place.area, place.tag].some((value) => value.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });
  }, [activeCategory, selectedArea, searchQuery]);

  const categoryCounts = useMemo(
    () => ({
      ALL: ALL_NAVI_MUMBAI_PLACES.length,
      MALLS: ALL_NAVI_MUMBAI_PLACES.filter((p) => p.category === 'MALLS').length,
      CAFES: ALL_NAVI_MUMBAI_PLACES.filter((p) => p.category === 'CAFES').length,
      TURFS: ALL_NAVI_MUMBAI_PLACES.filter((p) => p.category === 'TURFS').length,
      'GAMING CAFES': ALL_NAVI_MUMBAI_PLACES.filter((p) => p.category === 'GAMING CAFES').length,
    }),
    [],
  );

  const visiblePlaces = showAll || searchQuery.trim() ? filteredPlaces : filteredPlaces.slice(0, INITIAL_VISIBLE);
  const hasMore = !searchQuery.trim() && filteredPlaces.length > INITIAL_VISIBLE;

  const resetFilters = () => {
    setActiveCategory('ALL');
    setSelectedArea('All Mumbai & Navi Mumbai');
    setSearchQuery('');
    setShowAll(false);
  };

  const categoryIcon = (category: NaviMumbaiPlace['category']) => {
    if (category === 'MALLS') return <Building2 className="w-3.5 h-3.5" />;
    if (category === 'CAFES') return <Coffee className="w-3.5 h-3.5" />;
    if (category === 'TURFS') return <Trophy className="w-3.5 h-3.5" />;
    return <Gamepad2 className="w-3.5 h-3.5" />;
  };

  const categoryLabel = (category: NaviMumbaiPlace['category']) =>
    category === 'GAMING CAFES' ? 'Gaming' : category === 'MALLS' ? 'Mall' : category === 'CAFES' ? 'Cafe' : 'Turf';

  return (
    <div
      className={`rounded-3xl border transition-all ${
        variant === 'bento'
          ? 'bg-white p-5 sm:p-7 border-slate-200/90 shadow-xs'
          : variant === 'modal'
            ? 'bg-white p-4 sm:p-6'
            : 'bg-slate-50 p-4 border-slate-200 rounded-2xl'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              <MapPin className="w-3.5 h-3.5" /> Mumbai & Navi Mumbai
            </span>
            <span className="text-xs text-slate-400 font-semibold">{categoryCounts.ALL} places</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-display">
            Explore places to hang out
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Malls, cafés, sports, gaming and easy Gen-Z hangout spots — all in one clean list.
          </p>
        </div>

        <div className="relative w-full lg:w-[300px] shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowAll(false);
            }}
            placeholder="Search a mall, café, area..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden transition-all placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            ['ALL', 'All places', categoryCounts.ALL, <Sparkles className="w-3.5 h-3.5 text-amber-400" />],
            ['MALLS', 'Malls & Cinema', categoryCounts.MALLS, <Building2 className="w-3.5 h-3.5" />],
            ['CAFES', 'Cafés & Chill', categoryCounts.CAFES, <Coffee className="w-3.5 h-3.5" />],
            ['TURFS', 'Sports Turfs', categoryCounts.TURFS, <Trophy className="w-3.5 h-3.5" />],
            ['GAMING CAFES', 'Gaming Cafés', categoryCounts['GAMING CAFES'], <Gamepad2 className="w-3.5 h-3.5" />],
          ] as const
        ).map(([key, label, count, icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActiveCategory(key as Category);
              setShowAll(false);
            }}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeCategory === key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {icon}
            <span>{label}</span>
            <span className="opacity-60">{count}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {NAVI_MUMBAI_AREAS.map((area) => (
          <button
            type="button"
            key={area}
            onClick={() => {
              setSelectedArea(area);
              setShowAll(false);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              selectedArea === area
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-5 mb-2">
        <p className="text-xs font-bold text-slate-700">
          {searchQuery.trim() || selectedArea !== 'All Mumbai & Navi Mumbai' || activeCategory !== 'ALL'
            ? `${filteredPlaces.length} matches`
            : 'Popular picks'}
        </p>
        {(searchQuery || selectedArea !== 'All Mumbai & Navi Mumbai' || activeCategory !== 'ALL') && (
          <button type="button" onClick={resetFilters} className="text-xs font-bold text-indigo-600 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {filteredPlaces.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-600">No places found</p>
          <p className="text-xs text-slate-400 mt-1">Try another area, category or search term.</p>
          <button type="button" onClick={resetFilters} className="mt-3 text-xs font-bold text-indigo-600 hover:underline">
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visiblePlaces.map((place) => {
              const isHighlighted = Boolean(
                selectedPlaceName &&
                  (selectedPlaceName.toLowerCase().includes(place.name.toLowerCase()) ||
                    place.name.toLowerCase().includes(selectedPlaceName.toLowerCase())),
              );

              return (
                <div
                  key={place.id}
                  className={`rounded-2xl border p-4 transition-all bg-white ${
                    isHighlighted
                      ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                      : 'border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        place.category === 'MALLS'
                          ? 'bg-indigo-50 text-indigo-600'
                          : place.category === 'CAFES'
                            ? 'bg-amber-50 text-amber-600'
                            : place.category === 'TURFS'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-violet-50 text-violet-600'
                      }`}>
                        {categoryIcon(place.category)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{place.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{place.tag}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                      {place.area}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{categoryLabel(place.category)}</span>
                    <div className="flex-1" />
                    {onSelectPlaceForSearch && (
                      <button
                        type="button"
                        onClick={() => onSelectPlaceForSearch(place.name)}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-[10px] font-bold text-slate-700 border border-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Compass className="w-3 h-3 text-indigo-600" /> Find plans
                      </button>
                    )}
                    {onSelectPlaceForPlan && (
                      <button
                        type="button"
                        onClick={() => onSelectPlaceForPlan(place)}
                        className="py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Host
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-5">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Show all {filteredPlaces.length} places
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
