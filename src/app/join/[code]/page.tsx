'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameRoom } from '@/components/GameRoom';
import { Room } from '@/lib/types';
import { Users, Music, AlertCircle } from 'lucide-react';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;
  
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/rooms?code=${roomCode}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setRoom(result.data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Room not found');
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    // Check if room exists
    fetchRoomInfo();
  }, [roomCode, fetchRoomInfo]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (playerName.trim().length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }
    
    setHasJoined(true);
  };

  const handleLeave = () => {
    setHasJoined(false);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto mb-4"></div>
          <p className="text-gray-600">Checking room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Room Not Found</h2>
            <p className="text-red-600 mb-4">
              {error || 'The room code you entered is invalid or the room has expired.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasJoined) {
    return (
      <GameRoom
        roomCode={roomCode}
        isHost={false}
        hostSpotifyId={room.host_spotify_id}
        playerName={playerName}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-spotify-green to-green-600 flex items-center justify-center">
              <Music size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Join Game Room
            </h1>
            <p className="text-gray-600">
              Room: <span className="font-mono font-semibold">{roomCode}</span>
            </p>
          </div>

          {/* Room Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Users size={20} className="text-gray-600" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {room.host_name}&apos;s Room
                </h3>
                <p className="text-sm text-gray-600">
                  Status: <span className="capitalize">{room.status}</span>
                </p>
              </div>
            </div>
            
            {room.playlist_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Music size={16} />
                <span>Playlist: {room.playlist_name}</span>
              </div>
            )}
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spotify-green focus:border-transparent"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 20 characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!playerName.trim()}
              className="w-full bg-spotify-green hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Game
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800 text-sm underline"
            >
              Create your own room instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
