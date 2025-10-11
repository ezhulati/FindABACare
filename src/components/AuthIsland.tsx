import { useState, useEffect } from 'react';
import { signInWithEmail, signOut, onAuthStateChange, getCurrentUser } from '../lib/auth';

export default function AuthIsland() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check initial auth state
    getCurrentUser().then(setUser);

    // Listen to auth changes
    const { data: { subscription } } = onAuthStateChange((session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send sign-in link');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setSent(false);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg max-w-md">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-900">Check your email</h3>
            <p className="mt-1 text-sm text-green-700">
              We sent a sign-in link to <strong>{email}</strong>. Click the link in the email to continue.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-2 text-sm text-green-800 hover:text-green-900 font-medium"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignIn} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Sending...' : 'Sign in'}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
