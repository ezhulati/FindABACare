import { useState } from 'react';
import { authedFetch, getCurrentUser } from '../lib/auth';

interface Props {
  eventId: string;
  currentCount?: number;
  capacity?: number;
}

export default function RSVPButtonIsland({ eventId, currentCount = 0, capacity = 12 }: Props) {
  const [loading, setLoading] = useState(false);
  const [rsvped, setRsvped] = useState(false);
  const [count, setCount] = useState(currentCount);
  const [error, setError] = useState('');

  const handleRSVP = async () => {
    setLoading(true);
    setError('');

    try {
      // Check if user is authenticated
      const user = await getCurrentUser();
      if (!user) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      // Check capacity using local count
      if (count >= capacity) {
        setError('This event is full');
        setLoading(false);
        return;
      }

      // Re-fetch the current RSVP count from the server to prevent race conditions
      const countRes = await fetch(`/api/rsvps?event_id=${eventId}`);
      if (countRes.ok) {
        const countData = await countRes.json();
        const freshCount = countData.count ?? count;
        setCount(freshCount);
        if (freshCount >= capacity) {
          setError('This event just filled up. Please try again later.');
          setLoading(false);
          return;
        }
      }

      const res = await authedFetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to RSVP');
      }

      setRsvped(true);
      setCount(count + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to RSVP');
    } finally {
      setLoading(false);
    }
  };

  const percentage = Math.min(100, Math.round((count / capacity) * 100));

  return (
    <div className="space-y-3">
      {/* Capacity Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600">
            {count} / {capacity} spots filled
          </span>
          <span className="text-gray-500">{percentage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* RSVP Button */}
      {rsvped ? (
        <div className="flex items-center justify-center gap-2 px-6 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">You're confirmed!</span>
        </div>
      ) : (
        <button
          onClick={handleRSVP}
          disabled={loading || count >= capacity}
          className="w-full px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'RSVPing...' : count >= capacity ? 'Event Full' : 'RSVP'}
        </button>
      )}

      {count >= capacity && !rsvped && (
        <p className="text-sm text-gray-500 text-center">
          This event has reached capacity. Check back later or <a href="/events" className="text-blue-600 hover:text-blue-700 underline">browse other events</a>.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
