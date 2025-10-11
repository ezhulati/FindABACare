import { useState } from 'react';

interface Props {
  onFilterChange?: (filters: Record<string, any>) => void;
}

export default function VenueFiltersIsland({ onFilterChange }: Props) {
  const [filters, setFilters] = useState({
    quietRoom: false,
    noDryers: false,
    sensoryHours: false,
    visualSupports: false,
  });

  const handleToggle = (key: keyof typeof filters) => {
    const newFilters = { ...filters, [key]: !filters[key] };
    setFilters(newFilters);

    // Convert to API format
    const apiFilters: Record<string, any> = {};
    if (newFilters.quietRoom) apiFilters['amenities.quiet_room'] = true;
    if (newFilters.noDryers) apiFilters['amenities.hand_dryer'] = false;
    if (newFilters.sensoryHours) apiFilters['has_sensory_hours'] = true;
    if (newFilters.visualSupports) apiFilters['amenities.visual_supports'] = true;

    // Dispatch custom event for Astro page to listen to
    window.dispatchEvent(new CustomEvent('venueFiltersChanged', { detail: apiFilters }));

    // Also call callback if provided (for backward compatibility)
    onFilterChange?.(apiFilters);
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {activeCount > 0 && (
          <button
            onClick={() => {
              setFilters({
                quietRoom: false,
                noDryers: false,
                sensoryHours: false,
                visualSupports: false,
              });
              // Dispatch custom event for clearing filters
              window.dispatchEvent(new CustomEvent('venueFiltersChanged', { detail: {} }));
              // Also call callback if provided
              onFilterChange?.({});
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Quiet Room */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={filters.quietRoom}
              onChange={() => handleToggle('quietRoom')}
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 group-hover:text-black">
              Quiet room
            </span>
            <p className="text-xs text-gray-500">Has a dedicated quiet space</p>
          </div>
        </label>

        {/* No Hand Dryers */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={filters.noDryers}
              onChange={() => handleToggle('noDryers')}
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 group-hover:text-black">
              No hand dryers
            </span>
            <p className="text-xs text-gray-500">Paper towels only</p>
          </div>
        </label>

        {/* Sensory Hours */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={filters.sensoryHours}
              onChange={() => handleToggle('sensoryHours')}
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 group-hover:text-black">
              Sensory hours
            </span>
            <p className="text-xs text-gray-500">Designated quiet times</p>
          </div>
        </label>

        {/* Visual Supports */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={filters.visualSupports}
              onChange={() => handleToggle('visualSupports')}
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 group-hover:text-black">
              Visual supports
            </span>
            <p className="text-xs text-gray-500">Visual schedules & guides</p>
          </div>
        </label>
      </div>
    </div>
  );
}
