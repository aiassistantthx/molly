import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';
import { signInWithGoogle, sendMagicLink } from '../lib/firebase';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 mb-4">
            <span className="text-5xl">♠</span>
          </div>
          <h1 className="text-3xl font-bold text-gold">Molly</h1>
          <p className="text-gray mt-2">Poker Home Games Manager</p>
        </div>

        <Card variant="bordered" className="p-6">
          {magicLinkSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-gray mb-4">
                We sent a magic link to <span className="text-gold">{email}</span>
              </p>
              <Button variant="ghost" onClick={() => setMagicLinkSent(false)}>
                Use different email
              </Button>
            </div>
          ) : (
            <>
              {/* Google Sign In */}
              <Button
                onClick={handleGoogleSignIn}
                loading={loading}
                variant="secondary"
                className="w-full mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gold/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-dark-card px-3 text-gray">or</span>
                </div>
              </div>

              {/* Magic Link */}
              <form onSubmit={handleMagicLink}>
                <Input
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
                <Button type="submit" loading={loading} className="w-full mt-4">
                  Send Magic Link
                </Button>
              </form>

              {error && (
                <p className="mt-4 text-sm text-danger text-center">{error}</p>
              )}
            </>
          )}
        </Card>

        <p className="text-center text-gray text-xs mt-6">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};
