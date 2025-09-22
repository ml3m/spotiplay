'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Music } from 'lucide-react';

interface SpotifyLoginProps {
  onSuccess?: () => void;
}

export function SpotifyLogin({ onSuccess }: SpotifyLoginProps) {
  const { data: session, status } = useSession();

  const handleSignIn = async () => {
    try {
      await signIn('spotify', { 
        callbackUrl: '/dashboard',
        redirect: true 
      });
      onSuccess?.();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-spotify-green to-green-600 flex items-center justify-center">
            {session.user.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'User'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Music size={32} className="text-white" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome, {session.user.name || 'Spotify User'}!
          </h2>
          <p className="text-gray-600 mt-1">
            Connected to Spotify
          </p>
        </div>
        
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-spotify-green to-green-600 flex items-center justify-center">
          <Music size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Spotify Song Guessing Game
        </h1>
        <p className="text-gray-600 text-lg max-w-md mx-auto">
          Test your music knowledge with friends! Connect your Spotify account to create a room and start guessing songs from your playlists.
        </p>
      </div>

      <button
        onClick={handleSignIn}
        className="inline-flex items-center gap-3 bg-spotify-green hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-full transition-colors text-lg"
      >
        <Music size={24} />
        Connect with Spotify
      </button>

      <div className="mt-8 text-sm text-gray-500">
        <p>We&apos;ll only access your playlists and basic profile info.</p>
        <p>No data is stored or shared.</p>
      </div>
    </div>
  );
}
