'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SpotifyPlaylist } from '@/lib/types';
import { SpotifyLogin } from '@/components/SpotifyLogin';
import { 
  Plus, 
  Music, 
  Users, 
  ExternalLink,
  Loader2,
  RefreshCw,
  PlayCircle 
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchPlaylists();
    }
  }, [session]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/playlists');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setPlaylists(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (playlist?: SpotifyPlaylist) => {
    try {
      setCreating(true);
      setError(null);
      
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlist_id: playlist?.id,
          playlist_name: playlist?.name,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Redirect to the new room
      router.push(`/room/${result.data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <SpotifyLogin />
        </div>
      </div>
    );
  }

  if (session.error === "RefreshAccessTokenError") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Token Expired</h2>
            <p className="text-red-600 mb-4">Your Spotify session has expired. Please sign in again.</p>
            <SpotifyLogin />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Create a room and start guessing songs from your playlists!
              </p>
            </div>
            
            <div className="text-right">
              <SpotifyLogin />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchPlaylists}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Start</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => createRoom()}
              disabled={creating}
              className="flex items-center gap-2 bg-spotify-green hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Plus size={20} />
              )}
              Create Room Without Playlist
            </button>
            
            <button
              onClick={fetchPlaylists}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <RefreshCw size={20} />
              )}
              Refresh Playlists
            </button>
          </div>
        </div>

        {/* Playlists */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music size={24} className="text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Playlists
                </h2>
              </div>
              <span className="text-sm text-gray-500">
                {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 size={48} className="mx-auto text-gray-400 mb-4 animate-spin" />
              <p className="text-gray-600">Loading your playlists...</p>
            </div>
          ) : playlists.length === 0 ? (
            <div className="p-8 text-center">
              <Music size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Playlists Found</h3>
              <p className="text-gray-600 mb-4">
                You need playlists with at least 10 songs that have preview URLs to play.
              </p>
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-spotify-green hover:text-green-600 font-medium"
              >
                <ExternalLink size={16} />
                Create Playlists on Spotify
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {playlist.images?.[0] ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Music size={24} className="text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {playlist.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {playlist.tracks.total} tracks
                      </p>
                      {'validTrackCount' in playlist && (
                        <p className="text-xs text-green-600 mt-1">
                          {(playlist as any).validTrackCount} playable
                        </p>
                      )}
                    </div>
                  </div>

                  {playlist.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}

                  <button
                    onClick={() => createRoom(playlist)}
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 bg-spotify-green hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <PlayCircle size={16} />
                    )}
                    Create Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Share room codes with friends to let them join your music quiz!</p>
        </div>
      </div>
    </div>
  );
}
