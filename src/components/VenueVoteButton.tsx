/**
 * Venue Vote Button Component
 *
 * Displays up/down voting buttons with auth gate
 * Shows vote counts and user's current vote state
 * Prompts login if not authenticated
 */

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

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

  const supabase = getSupabaseBrowserClient();

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

      {/* Enticing Login Prompt Modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Vote Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 19V6M5 12l7-7 7 7" />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Help Our Community
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-6 text-center leading-relaxed">
              Your vote helps other families discover the best autism-friendly venues in your area
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-6 bg-purple-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">Vote on unlimited venues</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">Save your favorite places</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">Leave reviews to help others</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <a
                href="/auth/login"
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl text-center font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create Free Account
              </a>
            </div>

            <button
              onClick={() => setShowLoginPrompt(false)}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
