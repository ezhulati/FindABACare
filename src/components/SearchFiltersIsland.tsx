import { useState, useEffect } from 'react';

interface Venue {
  id: string;
  name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  google_rating: number | null;
  google_review_count: number | null;
  verification_status: string;
  photo_keys: string[] | null;
  slug: string;
}

interface SearchFiltersIslandProps {
  venues: Venue[];
  onUpdateVenues: (filtered: Venue[]) => void;
}

type SortOption = 'distance' | 'rating' | 'name';

const VENUE_TYPES = [
  'Museum', 'Park', 'Library', 'Aquarium', 'Zoo', 'Playground',
  'Movie Theater', 'Bowling Alley', 'Art Gallery', 'Science Museum',
  "Children's Museum", 'Nature Center', 'Planetarium', 'Tourist Attraction',
  'Amusement Park'
];

export default function SearchFiltersIsland({ venues, onUpdateVenues }: SearchFiltersIslandProps) {
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Get actual max distance from venues
  const actualMaxDistance = Math.ceil(Math.max(...venues.map(v => v.distance)));

  useEffect(() => {
    let filtered = [...venues];

    // Filter by venue type
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(v => selectedTypes.has(v.type));
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(v => v.google_rating && v.google_rating >= minRating);
    }

    // Filter by distance
    filtered = filtered.filter(v => v.distance <= maxDistance);

    // Filter by verification status
    if (verifiedOnly) {
      filtered = filtered.filter(v => v.verification_status === 'admin_verified');
    }

    // Sort results
    switch (sortBy) {
      case 'distance':
        filtered.sort((a, b) => a.distance - b.distance);
        break;
      case 'rating':
        filtered.sort((a, b) => {
          const ratingA = a.google_rating || 0;
          const ratingB = b.google_rating || 0;
          return ratingB - ratingA;
        });
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    onUpdateVenues(filtered);
  }, [sortBy, selectedTypes, minRating, maxDistance, verifiedOnly, venues]);

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const clearAllFilters = () => {
    setSelectedTypes(new Set());
    setMinRating(0);
    setMaxDistance(actualMaxDistance);
    setVerifiedOnly(false);
  };

  const activeFilterCount =
    selectedTypes.size +
    (minRating > 0 ? 1 : 0) +
    (maxDistance < actualMaxDistance ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Filter & Sort</h3>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="distance">Closest First</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Distance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-900">
              Max Distance
            </label>
            <span className="text-sm text-gray-600">{maxDistance.toFixed(1)} mi</span>
          </div>
          <input
            type="range"
            min="1"
            max={actualMaxDistance}
            step="0.5"
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 mi</span>
            <span>{actualMaxDistance} mi</span>
          </div>
        </div>

        {/* Minimum Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Minimum Rating
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[0, 3, 3.5, 4, 4.5].map((rating) => (
              <button
                key={rating}
                onClick={() => setMinRating(rating)}
                className={`px-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                  minRating === rating
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating === 0 ? 'Any' : `${rating}+`}
              </button>
            ))}
          </div>
        </div>

        {/* Venue Types */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Venue Type
          </label>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {VENUE_TYPES.map((type) => {
              const count = venues.filter(v => v.type === type).length;
              if (count === 0) return null;

              return (
                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(type)}
                    onChange={() => toggleType(type)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {type} ({count})
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Verified Only */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900">
              Verified venues only
            </span>
          </label>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
