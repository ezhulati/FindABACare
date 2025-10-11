import { useState, useRef, useEffect } from 'react';

interface AddressSearchIslandProps {
  apiKey: string;
}

export default function AddressSearchIsland({ apiKey }: AddressSearchIslandProps) {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Load Google Places Autocomplete
    if (typeof google !== 'undefined' && inputRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'us' },
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          // Redirect to search results
          window.location.href = `/search?lat=${lat}&lng=${lng}&address=${encodeURIComponent(place.formatted_address || address)}`;
        }
      });
    }
  }, []);

  const handleUseMyLocation = () => {
    setIsLoading(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat, lng } },
            (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const addr = results[0].formatted_address;
                window.location.href = `/search?lat=${lat}&lng=${lng}&address=${encodeURIComponent(addr)}`;
              } else {
                window.location.href = `/search?lat=${lat}&lng=${lng}`;
              }
            }
          );
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      return;
    }

    // Geocode the address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        window.location.href = `/search?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`;
      } else {
        alert('Address not found. Please try a different address.');
      }
    });
  };

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter city, ZIP code, or address"
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-32"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !address.trim()}
          >
            Search
          </button>
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
