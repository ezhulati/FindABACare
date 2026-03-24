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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
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
      setError('Failed to update favorite. Please try again.');
      setTimeout(() => setError(null), 3000);
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

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </>
  );
}
