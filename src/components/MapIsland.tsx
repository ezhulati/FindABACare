import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Venue {
  id: string;
  name: string;
  slug?: string;
  lat?: number;
  lng?: number;
  type?: string;
  meter?: string;
}

interface Props {
  venues: Venue[];
  initialCenter?: [number, number];
  initialZoom?: number;
}

export default function MapIsland({
  venues,
  initialCenter = [-96.7970, 32.7767], // Dallas default
  initialZoom = 11
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState('');

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = import.meta.env.PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }), 'top-right');

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Failed to load map');
      });
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [initialCenter, initialZoom]);

  // Update markers when venues change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    const validVenues = venues.filter(v => v.lat && v.lng);

    if (validVenues.length === 0) return;

    validVenues.forEach(venue => {
      if (!venue.lat || !venue.lng) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'venue-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

      // Color based on meter
      const meterColors = {
        'Quiet': '#10b981',
        'Moderate': '#f59e0b',
        'Busy': '#ef4444',
      };
      el.style.backgroundColor = meterColors[venue.meter as keyof typeof meterColors] || meterColors.Moderate;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">${venue.name}</h3>
          ${venue.type ? `<p style="font-size: 12px; color: #666; margin: 0 0 8px 0;">${venue.type}</p>` : ''}
          ${venue.meter ? `<span style="display: inline-block; padding: 4px 8px; background: ${meterColors[venue.meter as keyof typeof meterColors] || meterColors.Moderate}; color: white; border-radius: 12px; font-size: 11px; font-weight: 500;">${venue.meter}</span>` : ''}
          <a href="/venue/${venue.slug || venue.id}" style="display: block; margin-top: 8px; color: #2563eb; font-size: 12px; text-decoration: none;">View details →</a>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([venue.lng, venue.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (validVenues.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      validVenues.forEach(venue => {
        if (venue.lat && venue.lng) {
          bounds.extend([venue.lng, venue.lat]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    } else if (validVenues.length === 1 && validVenues[0].lat && validVenues[0].lng) {
      map.current.flyTo({
        center: [validVenues[0].lng, validVenues[0].lat],
        zoom: 14,
      });
    }
  }, [venues, mapLoaded]);

  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={mapContainer}
        className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-200"
        style={{ minHeight: '400px' }}
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
