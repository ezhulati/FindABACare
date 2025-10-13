/**
 * Venue Review Form Component
 *
 * Comprehensive review form with:
 * - 3 star ratings (predictability, sensory_level, staff_knowledge)
 * - Text review
 * - Best time to visit
 * - Trigger warnings
 * - Auth gate
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db';

interface VenueReviewFormProps {
  venueId: string;
  venueName: string;
  onSuccess?: () => void;
}

export default function VenueReviewForm({
  venueId,
  venueName,
  onSuccess,
}: VenueReviewFormProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  // Form state
  const [predictability, setPredictability] = useState(0);
  const [sensoryLevel, setSensoryLevel] = useState(0);
  const [staffKnowledge, setStaffKnowledge] = useState(0);
  const [content, setContent] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [triggers, setTriggers] = useState<string[]>([]);

  // Available trigger options
  const triggerOptions = [
    'loud_music',
    'hand_dryers',
    'strong_scents',
    'crowded',
    'bright_lights',
    'sudden_noises',
    'open_water',
    'long_wait_times',
  ];

  useEffect(() => {
    checkAuthAndExistingReview();
  }, [venueId]);

  const checkAuthAndExistingReview = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session) {
      // Check if user already reviewed this venue
      const { data } = await supabase
        .from('reviews')
        .select('id')
        .eq('venue_id', venueId)
        .eq('profile_id', session.user.id)
        .single();

      setHasExistingReview(!!data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    // Validation
    if (predictability === 0 || sensoryLevel === 0 || staffKnowledge === 0) {
      alert('Please provide all three ratings');
      return;
    }

    if (!content.trim()) {
      alert('Please write a review');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase.from('reviews').insert({
        venue_id: venueId,
        profile_id: session.user.id,
        predictability,
        sensory_level: sensoryLevel,
        staff_knowledge: staffKnowledge,
        content: content.trim(),
        best_time: bestTime.trim() || null,
        triggers: triggers.length > 0 ? triggers : null,
        status: 'pending', // Awaiting admin approval
      });

      if (error) throw error;

      alert('Thank you! Your review has been submitted and will be published after admin approval.');

      // Reset form
      setShowForm(false);
      setPredictability(0);
      setSensoryLevel(0);
      setStaffKnowledge(0);
      setContent('');
      setBestTime('');
      setTriggers([]);
      setHasExistingReview(true);

      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Review submission error:', error);
      alert(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTrigger = (trigger: string) => {
    setTriggers(prev =>
      prev.includes(trigger)
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const StarRating = ({ value, onChange, label, description }: any) => (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-900 mb-1">
        {label}
      </label>
      <p className="text-xs text-gray-600 mb-2">{description}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill={star <= value ? '#F59E0B' : 'none'}
              stroke={star <= value ? '#F59E0B' : '#D1D5DB'}
              strokeWidth="2"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 self-center">
          {value === 0 ? 'Select rating' : `${value}/5`}
        </span>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sign in to leave a review
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Share your experience to help other families
        </p>
        <a
          href="/login"
          className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Sign in
        </a>
      </div>
    );
  }

  if (hasExistingReview) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Thank you for your review!
        </h3>
        <p className="text-sm text-green-700">
          You've already reviewed this venue. Your feedback helps the community.
        </p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
      >
        Write a Review
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Review {venueName}
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Predictability Rating */}
        <StarRating
          value={predictability}
          onChange={setPredictability}
          label="Predictability"
          description="How predictable and structured is the environment?"
        />

        {/* Sensory Level Rating */}
        <StarRating
          value={sensoryLevel}
          onChange={setSensoryLevel}
          label="Sensory-Friendliness"
          description="How sensory-friendly is this venue? (1=overwhelming, 5=calm)"
        />

        {/* Staff Knowledge Rating */}
        <StarRating
          value={staffKnowledge}
          onChange={setStaffKnowledge}
          label="Staff Knowledge"
          description="How understanding and accommodating is the staff?"
        />

        {/* Review Text */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Your Review *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your experience... What went well? What should other families know?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={5}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length}/1000 characters
          </p>
        </div>

        {/* Best Time to Visit */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Best Time to Visit
          </label>
          <input
            type="text"
            value={bestTime}
            onChange={(e) => setBestTime(e.target.value)}
            placeholder="e.g., Weekday mornings, Sundays after 2pm"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Trigger Warnings */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Sensory Triggers Present
          </label>
          <div className="grid grid-cols-2 gap-2">
            {triggerOptions.map(trigger => (
              <label
                key={trigger}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={triggers.includes(trigger)}
                  onChange={() => toggleTrigger(trigger)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {trigger.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Your review will be published after admin approval to ensure quality and accuracy.
        </p>
      </form>
    </div>
  );
}
