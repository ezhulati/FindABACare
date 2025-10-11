import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import SearchFilters from './SearchFilters';

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

interface SearchResultsProps {
  venues: Venue[];
  centerLat: number;
  centerLng: number;
  googleMapsApiKey: string;
}

export function SearchResults({ venues, centerLat, centerLng, googleMapsApiKey }: SearchResultsProps) {
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>(venues);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    const mapElement = document.getElementById('map');
    if (!mapElement || typeof google === 'undefined') return;

    const newMap = new google.maps.Map(mapElement, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 12,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Add user location marker
    new google.maps.Marker({
      position: { lat: centerLat, lng: centerLng },
      map: newMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
      title: 'Your Location'
    });

    setMap(newMap);
  }, [centerLat, centerLng]);

  // Update markers when filtered venues change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = filteredVenues.map((venue, index) => {
      const marker = new google.maps.Marker({
        position: { lat: venue.lat, lng: venue.lng },
        map: map,
        label: {
          text: String(index + 1),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: venue.name
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${venue.name}</h3>
            <p class="text-sm text-gray-600">${venue.type} · ${venue.distance.toFixed(1)} mi</p>
            ${venue.google_rating ? `<p class="text-sm text-gray-600">⭐ ${venue.google_rating.toFixed(1)}</p>` : ''}
            <a href="/venue/${venue.slug}" class="text-sm text-blue-600 hover:text-blue-700 font-medium">View Details →</a>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [filteredVenues, map]);

  const handleFilterChange = (filtered: Venue[]) => {
    setFilteredVenues(filtered);
  };

  return (
    <>
      {/* Render filters */}
      <div id="filters-desktop-container">
        <SearchFilters venues={venues} onFilterChange={handleFilterChange} />
      </div>

      {/* Render venue list */}
      <VenueList venues={filteredVenues} markers={markers} map={map} />
    </>
  );
}

interface VenueListProps {
  venues: Venue[];
  markers: google.maps.Marker[];
  map: google.maps.Map | null;
}

function VenueList({ venues, markers, map }: VenueListProps) {
  if (venues.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No venues match your filters</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or expanding your search radius.
        </p>
      </div>
    );
  }

  const handleCardHover = (index: number, isHover: boolean) => {
    if (!markers[index]) return;

    markers[index].setIcon({
      path: google.maps.SymbolPath.CIRCLE,
      scale: isHover ? 25 : 20,
      fillColor: isHover ? '#3B82F6' : '#10B981',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: isHover ? 3 : 2,
    });
  };

  return (
    <>
      {venues.map((venue, index) => (
        <a
          key={venue.id}
          href={`/venue/${venue.slug}`}
          className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-200"
          onMouseEnter={() => handleCardHover(index, true)}
          onMouseLeave={() => handleCardHover(index, false)}
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {venue.name}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {venue.type} · {venue.distance.toFixed(1)} miles away
                </p>

                {venue.google_rating && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.round(venue.google_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {venue.google_rating.toFixed(1)} ({venue.google_review_count || 0} reviews)
                    </span>
                  </div>
                )}

                <p className="text-sm text-gray-600 line-clamp-2">
                  {venue.address}
                </p>

                {venue.verification_status === 'admin_verified' && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>

              {venue.photo_keys && venue.photo_keys.length > 0 && (
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={venue.photo_keys[0]}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        </a>
      ))}
    </>
  );
}

// Initialize the component
export function initSearchResults(props: SearchResultsProps) {
  const filtersDesktop = document.getElementById('filters-desktop');
  const venueList = document.getElementById('venue-list');

  if (filtersDesktop && venueList) {
    const root = createRoot(document.createElement('div'));
    root.render(<SearchResults {...props} />);
  }
}
