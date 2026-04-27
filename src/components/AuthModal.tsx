'use client';

import { useState, useEffect } from 'react';
import { supabase, CANONICAL_PUBLIC_ORIGIN } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logActivity } from '@/lib/activity';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => setIsClosing(true);

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (user && isOpen) onClose();
  }, [user, isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        await logActivity({
          type: 'user_edit', // or signup if we add it
          message: `New user signup: ${displayName || email}`,
          user_name: displayName || email
        });
        setCheckEmail(true);
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      }
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setError('');
    const currentPath = `${window.location.pathname}${window.location.search}` || '/';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectBase = isLocalhost ? window.location.origin : CANONICAL_PUBLIC_ORIGIN;
    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${redirectBase}/auth/callback?next=${encodeURIComponent(currentPath)}`,
      },
    });
    if (oAuthError) setError(oAuthError.message);
  };

  if (checkEmail) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? 'animate-fade-out' : ''}`}>
        <div className="absolute inset-0 bg-noctvm-black/70 backdrop-blur-md" onClick={handleClose} />
        <div
          className={`relative w-full max-w-md frosted-glass rounded-2xl p-8 shadow-2xl shadow-black/50 corner-smooth ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
          onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-noctvm-emerald/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-noctvm-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">Check your email</h2>
            <p className="text-sm text-noctvm-silver">
              We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>
            </p>
            <p className="text-xs text-noctvm-silver/60 mt-2">Click the link to activate your account.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-lg bg-noctvm-surface border border-noctvm-border text-sm text-noctvm-silver hover:text-foreground transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-noctvm-black/70 backdrop-blur-md backdrop-enter" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md frosted-glass rounded-2xl p-8 shadow-2xl shadow-black/50 animate-scale-in corner-smooth">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-noctvm-surface/80 border border-noctvm-border flex items-center justify-center text-noctvm-silver hover:text-foreground transition-all"
          title="Close Modal"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {mode === 'login' ? 'Welcome back' : 'Join NOCTVM'}
          </h2>
          <p className="text-sm text-noctvm-silver mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your nightlife profile'}
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-2 mb-5">
          <button
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg bg-noctvm-midnight border border-noctvm-border hover:border-noctvm-violet/30 transition-colors text-sm font-medium text-foreground"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-noctvm-border"></div>
          <span className="text-noctvm-caption text-noctvm-silver uppercase tracking-wider">or continue with email</span>
          <div className="flex-1 h-px bg-noctvm-border"></div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-noctvm-midnight border border-noctvm-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-noctvm-silver/40 focus:outline-none focus:border-noctvm-violet/50 transition-colors"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-noctvm-midnight border border-noctvm-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-noctvm-silver/40 focus:outline-none focus:border-noctvm-violet/50 transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-noctvm-midnight border border-noctvm-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-noctvm-silver/40 focus:outline-none focus:border-noctvm-violet/50 transition-colors"
            required
            minLength={6}
          />

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-noctvm-violet text-foreground text-sm font-medium hover:bg-noctvm-violet/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/></svg>
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-xs text-noctvm-silver mt-4">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); }} className="text-noctvm-violet font-medium hover:text-noctvm-violet/80 transition-colors">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="text-noctvm-violet font-medium hover:text-noctvm-violet/80 transition-colors">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
