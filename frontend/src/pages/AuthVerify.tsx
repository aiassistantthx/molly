import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeMagicLinkSignIn } from '../lib/firebase';

export const AuthVerify = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const user = await completeMagicLinkSignIn();
        if (user) {
          navigate('/');
        } else {
          setError('Invalid or expired link');
        }
      } catch (err: any) {
        setError(err.message || 'Verification failed');
      }
    };
    verify();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-danger mb-4">{error}</p>
          <a href="/login" className="text-gold hover:underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray">Verifying...</p>
      </div>
    </div>
  );
};
