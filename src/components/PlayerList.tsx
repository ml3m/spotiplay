'use client';

import { Player } from '@/lib/types';
import { Users, Crown } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  hostSpotifyId?: string;
  currentPlayerId?: string;
  className?: string;
}

export function PlayerList({ 
  players, 
  hostSpotifyId, 
  currentPlayerId, 
  className = '' 
}: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  if (players.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Users size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No players yet</p>
        <p className="text-sm text-gray-400">Share the room code to invite friends!</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">
            Players ({players.length})
          </h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {sortedPlayers.map((player, index) => {
          const isHost = hostSpotifyId && player.id === hostSpotifyId;
          const isCurrentPlayer = player.id === currentPlayerId;
          const rank = index + 1;
          
          return (
            <div 
              key={player.id}
              className={`p-4 flex items-center justify-between ${
                isCurrentPlayer ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                  rank === 2 ? 'bg-gray-100 text-gray-700' :
                  rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {rank}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      isCurrentPlayer ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {player.name}
                    </span>
                    {isHost && (
                      <span title="Host">
                        <Crown size={16} className="text-yellow-500" />
                      </span>
                    )}
                    {isCurrentPlayer && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Joined {new Date(player.joined_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className={`font-semibold ${
                  rank === 1 ? 'text-yellow-600' :
                  rank === 2 ? 'text-gray-600' :
                  rank === 3 ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {player.score.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 text-center">
        <p className="text-sm text-gray-600">
          Total: {players.length} player{players.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
