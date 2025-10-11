import { useState, useEffect, useRef } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export default function AuthButton() {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Initialize Supabase client only on the client side
    if (!supabaseRef.current) {
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase environment variables are not set');
        setLoading(false);
        return;
      }

      supabaseRef.current = createClient(supabaseUrl, supabaseAnonKey);
    }

    const supabase = supabaseRef.current;

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseRef.current) return;

    setSending(true);
    setMessage('');

    try {
      const { error } = await supabaseRef.current.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setMessage('Check your email for the magic link!');
      setEmail('');
      setTimeout(() => {
        setShowEmailInput(false);
        setMessage('');
      }, 3000);
    } catch (error: any) {
      setMessage(error.message || 'Error sending magic link');
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabaseRef.current) return;
    await supabaseRef.current.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return <div className="h-9 w-20 bg-gray-100 rounded animate-pulse"></div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:inline">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (showEmailInput) {
    return (
      <form onSubmit={handleSignIn} className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send link'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowEmailInput(false);
            setMessage('');
          }}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
        {message && (
          <p className="absolute top-full mt-2 text-sm text-gray-600 bg-white border border-gray-200 rounded px-3 py-2 shadow-sm">
            {message}
          </p>
        )}
      </form>
    );
  }

  return (
    <button
      onClick={() => setShowEmailInput(true)}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Sign in
    </button>
  );
}
