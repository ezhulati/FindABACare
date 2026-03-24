import { useState, useEffect } from 'react';

interface Props {
  onFilterChange?: (filters: Record<string, any>) => void;
  venues?: Array<{ type: string; google_rating?: number; verification_status?: string }>;
}

export default function VenueFiltersIsland({ onFilterChange, venues = [] }: Props) {
  const [filters, setFilters] = useState({
    sortBy: 'name',
    minRating: 0,
    selectedTypes: new Set<string>(),
    verifiedOnly: false,
    // Amenity filters
    quietRoom: false,
    noDryers: false,
    sensoryHours: false,
    visualSupports: false,
  });

  // Get venue types with counts
  const venueTypes = venues.reduce((acc, v) => {
    if (!v.type) return acc;
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedTypes = Object.entries(venueTypes).sort(([a], [b]) => a.localeCompare(b));

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);

    // Convert to API format
    const apiFilters: Record<string, any> = {
      sortBy: newFilters.sortBy,
      minRating: newFilters.minRating,
      selectedTypes: Array.from(newFilters.selectedTypes),
      verifiedOnly: newFilters.verifiedOnly,
    };

    if (newFilters.quietRoom) apiFilters['amenities.quiet_room'] = true;
    if (newFilters.noDryers) apiFilters['amenities.hand_dryer'] = false;
    if (newFilters.sensoryHours) apiFilters['has_sensory_hours'] = true;
    if (newFilters.visualSupports) apiFilters['amenities.visual_supports'] = true;

    // Debug log
    console.log('VenueFiltersIsland: Dispatching filter change event', apiFilters);

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('venueFiltersChanged', { detail: apiFilters }));
    onFilterChange?.(apiFilters);
  };

  const activeCount =
    (filters.minRating > 0 ? 1 : 0) +
    filters.selectedTypes.size +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.quietRoom ? 1 : 0) +
    (filters.noDryers ? 1 : 0) +
    (filters.sensoryHours ? 1 : 0) +
    (filters.visualSupports ? 1 : 0);

  const clearAllFilters = () => {
    const newFilters = {
      sortBy: 'name',
      minRating: 0,
      selectedTypes: new Set<string>(),
      verifiedOnly: false,
      quietRoom: false,
      noDryers: false,
      sensoryHours: false,
      visualSupports: false,
    };
    handleFilterChange(newFilters);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {activeCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeCount} active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-6">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Name (A-Z)</option>
            <option value="recent">Recently Verified</option>
            <option value="meter">Go Now™ Meter</option>
          </select>
        </div>

        {/* Min Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Minimum Rating</label>
          <div className="grid grid-cols-5 gap-2">
            {[0, 3, 3.5, 4, 4.5].map(rating => (
              <button
                key={rating}
                onClick={() => handleFilterChange({ ...filters, minRating: rating })}
                className={`px-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filters.minRating === rating
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
        {sortedTypes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Venue Type</label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {sortedTypes.map(([type, count]) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.selectedTypes.has(type)}
                    onChange={(e) => {
                      const newTypes = new Set(filters.selectedTypes);
                      if (e.target.checked) newTypes.add(type);
                      else newTypes.delete(type);
                      handleFilterChange({ ...filters, selectedTypes: newTypes });
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">
                    {type} ({count})
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Verified Only */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => handleFilterChange({ ...filters, verifiedOnly: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900">Verified venues only</span>
          </label>
        </div>

        {/* Amenity Filters */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Amenities</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.quietRoom}
                onChange={(e) => handleFilterChange({ ...filters, quietRoom: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Quiet Room</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.noDryers}
                onChange={(e) => handleFilterChange({ ...filters, noDryers: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">No Hand Dryers</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.sensoryHours}
                onChange={(e) => handleFilterChange({ ...filters, sensoryHours: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Sensory Hours</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.visualSupports}
                onChange={(e) => handleFilterChange({ ...filters, visualSupports: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Visual Supports</span>
            </label>
          </div>
        </div>

        {/* Clear Filters */}
        {activeCount > 0 && (
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
