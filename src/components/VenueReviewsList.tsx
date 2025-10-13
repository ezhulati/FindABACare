/**
 * Venue Reviews List Component
 *
 * Displays:
 * - Aggregate statistics (average ratings, vote score, review count)
 * - List of published reviews
 * - Individual review cards with ratings and content
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db';

interface Review {
  id: string;
  predictability: number;
  sensory_level: number;
  staff_knowledge: number;
  content: string;
  best_time: string | null;
  triggers: string[] | null;
  created_at: string;
  profiles: {
    display_name: string | null;
  };
}

interface AggregateStats {
  avgPredictability: number;
  avgSensoryLevel: number;
  avgStaffKnowledge: number;
  totalReviews: number;
}

interface VenueReviewsListProps {
  venueId: string;
  upvotes?: number;
  downvotes?: number;
  voteScore?: number;
}

export default function VenueReviewsList({
  venueId,
  upvotes = 0,
  downvotes = 0,
  voteScore = 0,
}: VenueReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [venueId]);

  const loadReviews = async () => {
    setIsLoading(true);

    try {
      // Load published reviews with profile info
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            display_name
          )
        `)
        .eq('venue_id', venueId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      // Calculate aggregate statistics
      if (data && data.length > 0) {
        const avgPredictability =
          data.reduce((sum, r) => sum + r.predictability, 0) / data.length;
        const avgSensoryLevel =
          data.reduce((sum, r) => sum + r.sensory_level, 0) / data.length;
        const avgStaffKnowledge =
          data.reduce((sum, r) => sum + r.staff_knowledge, 0) / data.length;

        setStats({
          avgPredictability,
          avgSensoryLevel,
          avgStaffKnowledge,
          totalReviews: data.length,
        });
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={star <= rating ? '#F59E0B' : 'none'}
          stroke={star <= rating ? '#F59E0B' : '#D1D5DB'}
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Aggregate Statistics */}
      {stats && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Community Feedback
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Vote Score */}
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${
                  voteScore > 0
                    ? 'text-green-600'
                    : voteScore < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {voteScore > 0 ? `+${voteScore}` : voteScore}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Vote Score
              </div>
              <div className="text-xs text-gray-500">
                ({upvotes} up, {downvotes} down)
              </div>
            </div>

            {/* Predictability */}
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.avgPredictability.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Predictability
              </div>
              <StarDisplay rating={Math.round(stats.avgPredictability)} />
            </div>

            {/* Sensory-Friendliness */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.avgSensoryLevel.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Sensory-Friendly
              </div>
              <StarDisplay rating={Math.round(stats.avgSensoryLevel)} />
            </div>

            {/* Staff Knowledge */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.avgStaffKnowledge.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Staff Knowledge
              </div>
              <StarDisplay rating={Math.round(stats.avgStaffKnowledge)} />
            </div>
          </div>

          <p className="text-xs text-gray-600 text-center">
            Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Reviews ({reviews.length})
          </h3>

          {reviews.map(review => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              {/* Author & Date */}
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-gray-900">
                  {review.profiles?.display_name || 'Anonymous Parent'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Predictability</div>
                  <StarDisplay rating={review.predictability} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Sensory-Friendly</div>
                  <StarDisplay rating={review.sensory_level} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Staff Knowledge</div>
                  <StarDisplay rating={review.staff_knowledge} />
                </div>
              </div>

              {/* Review Content */}
              <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">
                {review.content}
              </p>

              {/* Best Time */}
              {review.best_time && (
                <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-2">
                  <span className="text-xs font-semibold text-blue-900">
                    Best time to visit:
                  </span>{' '}
                  <span className="text-xs text-blue-700">{review.best_time}</span>
                </div>
              )}

              {/* Triggers */}
              {review.triggers && review.triggers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  <span className="text-xs font-semibold text-amber-900">
                    Sensory triggers:
                  </span>{' '}
                  <span className="text-xs text-amber-700">
                    {review.triggers.map(t => t.replace(/_/g, ' ')).join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
