/**
 * Favorite Button Component
 *
 * Beautiful heart button that entices users to create an account
 * Features:
 * - Animated heart icon
 * - Shows favorite count
 * - Attractive login modal for non-authenticated users
 * - Optimistic UI updates
 */

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

interface FavoriteButtonProps {
  venueId: string;
  venueName: string;
  initialFavoriteCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export default function FavoriteButton({
  venueId,
  venueName,
  initialFavoriteCount = 0,
  size = 'md',
  showCount = true,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    checkAuthAndLoadFavorite();
  }, [venueId]);

  const checkAuthAndLoadFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session) {
      // Check if user has favorited this venue
      const { data } = await supabase
        .from('venue_favorites')
        .select('id')
        .eq('venue_id', venueId)
        .eq('profile_id', session.user.id)
        .single();

      setIsFavorited(!!data);
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    // Prevent click from bubbling to parent elements (like <a> tags)
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      if (isFavorited) {
        // Unfavorite - optimistic update
        setIsFavorited(false);
        setFavoriteCount(prev => Math.max(0, prev - 1));

        const { error } = await supabase
          .from('venue_favorites')
          .delete()
          .eq('venue_id', venueId)
          .eq('profile_id', session.user.id);

        if (error) throw error;
      } else {
        // Favorite - optimistic update
        setIsFavorited(true);
        setFavoriteCount(prev => prev + 1);

        const { error } = await supabase
          .from('venue_favorites')
          .insert({
            venue_id: venueId,
            profile_id: session.user.id,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Favorite error:', error);
      // Revert optimistic update
      setIsFavorited(!isFavorited);
      setFavoriteCount(prev => isFavorited ? prev + 1 : prev - 1);
      alert('Failed to update favorite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 30,
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full transition-all duration-200
          ${isFavorited
            ? 'bg-red-50 hover:bg-red-100'
            : 'bg-white hover:bg-gray-50'
          }
          border-2
          ${isFavorited ? 'border-red-400' : 'border-gray-300 hover:border-red-300'}
          ${isAnimating ? 'scale-125' : 'scale-100'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          group
        `}
        title={isAuthenticated
          ? (isFavorited ? 'Remove from favorites' : 'Add to favorites')
          : 'Sign in to save favorites'
        }
      >
        <svg
          width={iconSizes[size]}
          height={iconSizes[size]}
          viewBox="0 0 24 24"
          className={`transition-all duration-200 ${isAnimating ? 'animate-pulse' : ''}`}
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            fill={isFavorited ? '#EF4444' : 'none'}
            stroke={isFavorited ? '#EF4444' : '#9CA3AF'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all duration-200 ${
              !isFavorited && 'group-hover:stroke-red-400'
            }`}
          />
        </svg>

        {showCount && favoriteCount > 0 && (
          <span className={`
            absolute -top-1 -right-1
            ${size === 'sm' ? 'text-[10px] px-1' : size === 'md' ? 'text-xs px-1.5' : 'text-sm px-2'}
            bg-red-500 text-white rounded-full font-bold
            min-w-[18px] h-[18px]
            flex items-center justify-center
          `}>
            {favoriteCount}
          </span>
        )}
      </button>

      {/* Enticing Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl transform scale-100 animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Heart Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Save Your Favorites
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-6 text-center leading-relaxed">
              Create a free account to save <span className="font-semibold text-gray-900">{venueName}</span> and other autism-friendly venues you love
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-6 bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">Save unlimited venues to your favorites</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">Share reviews to help other families</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">Upvote your favorite places</span>
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
              onClick={() => setShowLoginModal(false)}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
