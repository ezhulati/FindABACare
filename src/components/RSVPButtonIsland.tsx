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
        alert('Please sign in to RSVP');
        setLoading(false);
        return;
      }

      // Check capacity
      if (count >= capacity) {
        setError('This event is full');
        setLoading(false);
        return;
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

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
