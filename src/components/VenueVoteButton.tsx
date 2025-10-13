/**
 * Venue Vote Button Component
 *
 * Displays up/down voting buttons with auth gate
 * Shows vote counts and user's current vote state
 * Prompts login if not authenticated
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db';

interface VenueVoteButtonProps {
  venueId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialVoteScore?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function VenueVoteButton({
  venueId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialVoteScore = 0,
  size = 'md',
}: VenueVoteButtonProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [voteScore, setVoteScore] = useState(initialVoteScore);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Check auth status and load user's vote
  useEffect(() => {
    checkAuthAndLoadVote();
  }, [venueId]);

  const checkAuthAndLoadVote = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session) {
      // Load user's existing vote
      const response = await fetch(`/api/venue-vote?venue_id=${venueId}`);
      if (response.ok) {
        const data = await response.json();
        setUserVote(data.user_vote);
        if (data.venue_stats) {
          setUpvotes(data.venue_stats.upvotes || 0);
          setDownvotes(data.venue_stats.downvotes || 0);
          setVoteScore(data.venue_stats.vote_score || 0);
        }
      }
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/venue-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue_id: venueId, vote_type: voteType }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      const data = await response.json();

      // Update UI based on response
      setUserVote(data.vote_type);
      if (data.venue_stats) {
        setUpvotes(data.venue_stats.upvotes || 0);
        setDownvotes(data.venue_stats.downvotes || 0);
        setVoteScore(data.venue_stats.vote_score || 0);
      }
    } catch (error) {
      console.error('Vote error:', error);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const iconSize = iconSizes[size];

  return (
    <div className="flex items-center gap-2">
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('up')}
        disabled={isLoading}
        className={`
          flex items-center gap-1 rounded-full border transition-all
          ${sizeClasses[size]}
          ${userVote === 'up'
            ? 'bg-green-100 border-green-500 text-green-700'
            : 'bg-white border-gray-300 text-gray-700 hover:border-green-500 hover:bg-green-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isAuthenticated ? 'Upvote this venue' : 'Sign in to vote'}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V6M5 12l7-7 7 7" />
        </svg>
        <span className="font-medium">{upvotes}</span>
      </button>

      {/* Vote Score */}
      <span
        className={`
          ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}
          font-semibold
          ${voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-600' : 'text-gray-500'}
        `}
      >
        {voteScore > 0 ? `+${voteScore}` : voteScore}
      </span>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('down')}
        disabled={isLoading}
        className={`
          flex items-center gap-1 rounded-full border transition-all
          ${sizeClasses[size]}
          ${userVote === 'down'
            ? 'bg-red-100 border-red-500 text-red-700'
            : 'bg-white border-gray-300 text-gray-700 hover:border-red-500 hover:bg-red-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isAuthenticated ? 'Downvote this venue' : 'Sign in to vote'}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v13M5 12l7 7 7-7" />
        </svg>
        <span className="font-medium">{downvotes}</span>
      </button>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sign in to vote
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a free account to vote on venues, leave reviews, and help other families find autism-friendly places.
            </p>
            <div className="flex gap-3">
              <a
                href="/login"
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-center font-medium hover:bg-purple-700 transition-colors"
              >
                Sign in
              </a>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
