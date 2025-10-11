import { useState } from 'react';

interface ReviewFormProps {
  venueId: string;
  venueName: string;
}

const commonTriggers = [
  'Loud music',
  'Bright lights',
  'Crowds',
  'Hand dryers',
  'Strong smells',
  'Unpredictable noises',
  'Long wait times',
];

export default function ReviewForm({ venueId, venueName }: ReviewFormProps) {
  const [formData, setFormData] = useState({
    predictability: 3,
    sensory_level: 3,
    staff_knowledge: 3,
    content: '',
    best_time: '',
    triggers: [] as string[],
  });

  const [customTrigger, setCustomTrigger] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venue_id: venueId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      // Reset form
      setFormData({
        predictability: 3,
        sensory_level: 3,
        staff_knowledge: 3,
        content: '',
        best_time: '',
        triggers: [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter(t => t !== trigger)
        : [...prev.triggers, trigger],
    }));
  };

  const addCustomTrigger = () => {
    if (customTrigger.trim() && !formData.triggers.includes(customTrigger.trim())) {
      setFormData(prev => ({
        ...prev,
        triggers: [...prev.triggers, customTrigger.trim()],
      }));
      setCustomTrigger('');
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank you for your review!</h3>
        <p className="text-gray-600 mb-6">
          Your review has been submitted and will be published after moderation.
        </p>
        <a
          href={`/venue/${window.location.pathname.split('/')[2]}`}
          className="inline-block px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to venue
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Rating Sliders */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Predictability (1 = Very unpredictable, 5 = Very predictable)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="5"
              value={formData.predictability}
              onChange={(e) => setFormData({ ...formData, predictability: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-2xl font-bold text-gray-900 w-8 text-center">
              {formData.predictability}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            How predictable was the environment? (routines, layout, expectations)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Sensory Level (1 = Very calm, 5 = Very stimulating)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="5"
              value={formData.sensory_level}
              onChange={(e) => setFormData({ ...formData, sensory_level: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-2xl font-bold text-gray-900 w-8 text-center">
              {formData.sensory_level}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Overall sensory input (sounds, lights, smells, crowds)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Staff Knowledge (1 = Not helpful, 5 = Very knowledgeable)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="5"
              value={formData.staff_knowledge}
              onChange={(e) => setFormData({ ...formData, staff_knowledge: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <span className="text-2xl font-bold text-gray-900 w-8 text-center">
              {formData.staff_knowledge}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            How understanding and helpful was the staff?
          </p>
        </div>
      </div>

      {/* Review Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-900 mb-2">
          Your Review (Optional)
        </label>
        <textarea
          id="content"
          rows={4}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Share your experience to help other families..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={1000}
        />
        <p className="text-xs text-gray-600 mt-1">
          {formData.content.length}/1000 characters
        </p>
      </div>

      {/* Best Time */}
      <div>
        <label htmlFor="best_time" className="block text-sm font-medium text-gray-900 mb-2">
          Best Time to Visit (Optional)
        </label>
        <input
          type="text"
          id="best_time"
          value={formData.best_time}
          onChange={(e) => setFormData({ ...formData, best_time: e.target.value })}
          placeholder="e.g., Weekday mornings, after 7pm"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={200}
        />
      </div>

      {/* Triggers */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Potential Triggers (Optional)
        </label>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {commonTriggers.map((trigger) => (
              <button
                key={trigger}
                type="button"
                onClick={() => toggleTrigger(trigger)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  formData.triggers.includes(trigger)
                    ? 'bg-red-100 text-red-800 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                {trigger}
              </button>
            ))}
          </div>

          {formData.triggers.filter(t => !commonTriggers.includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.triggers.filter(t => !commonTriggers.includes(t)).map((trigger) => (
                <span
                  key={trigger}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-800 border-2 border-red-300 rounded-full flex items-center gap-2"
                >
                  {trigger}
                  <button
                    type="button"
                    onClick={() => toggleTrigger(trigger)}
                    className="hover:text-red-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={customTrigger}
              onChange={(e) => setCustomTrigger(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTrigger())}
              placeholder="Add custom trigger..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={addCustomTrigger}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        <a
          href={`/venue/${window.location.pathname.split('/')[2]}`}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
