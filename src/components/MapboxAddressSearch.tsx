import { useState, useRef, useEffect } from 'react';

interface MapboxAddressSearchProps {
  mapboxToken: string;
}

interface MapboxSuggestion {
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
}

export default function MapboxAddressSearch({ mapboxToken }: MapboxAddressSearchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced address search
  useEffect(() => {
    if (!inputValue.trim() || inputValue.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Mapbox Geocoding API - 100,000 free requests/month
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(inputValue)}.json?` +
          `access_token=${mapboxToken}&` +
          `country=US&` +
          `types=place,postcode,locality,neighborhood,address&` +
          `limit=5`
        );

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          setSuggestions(data.features);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [inputValue, mapboxToken]);

  const handleSuggestionClick = (suggestion: MapboxSuggestion) => {
    const [lng, lat] = suggestion.center;
    window.location.href = `/search?lat=${lat}&lng=${lng}&address=${encodeURIComponent(suggestion.place_name)}`;
  };

  const handleUseMyLocation = () => {
    setIsLoading(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            // Reverse geocode to get address
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
              `access_token=${mapboxToken}&` +
              `types=place,postcode,locality`
            );

            const data = await response.json();

            if (data.features && data.features[0]) {
              const addr = data.features[0].place_name;
              window.location.href = `/search?lat=${lat}&lng=${lng}&address=${encodeURIComponent(addr)}`;
            } else {
              window.location.href = `/search?lat=${lat}&lng=${lng}`;
            }
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            window.location.href = `/search?lat=${lat}&lng=${lng}`;
          }
        },
        (error) => {
          setIsLoading(false);
          alert('Unable to get your location. Please enter an address manually.');
        }
      );
    } else {
      setIsLoading(false);
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const address = inputValue.trim();
    if (!address) {
      return;
    }

    setIsLoading(true);

    try {
      // Geocode the address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=US&` +
        `limit=1`
      );

      const data = await response.json();

      if (data.features && data.features[0]) {
        const [lng, lat] = data.features[0].center;
        window.location.href = `/search?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`;
      } else {
        alert('Address not found. Please try a different address.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error searching for address. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter city, ZIP code, or address"
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-32"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Search
          </button>

          {/* Autocomplete suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-6 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">
                        {suggestion.text}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {suggestion.place_name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      <button
        onClick={handleUseMyLocation}
        disabled={isLoading}
        className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {isLoading ? 'Getting your location...' : 'Use my current location'}
      </button>
    </div>
  );
}
