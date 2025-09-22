'use client';

import { PlayerScore } from '@/lib/types';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface LeaderboardProps {
  scores: PlayerScore[];
  showLastRoundPoints?: boolean;
  isGameFinished?: boolean;
  className?: string;
}

export function Leaderboard({ 
  scores, 
  showLastRoundPoints = false,
  isGameFinished = false,
  className = '' 
}: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={24} className="text-yellow-500" />;
      case 2:
        return <Medal size={24} className="text-gray-400" />;
      case 3:
        return <Award size={24} className="text-orange-500" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
            {rank}
          </div>
        );
    }
  };

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  if (scores.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No scores yet</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-gray-600" />
          <h3 className="text-xl font-bold text-gray-900">
            {isGameFinished ? 'Final Results' : 'Leaderboard'}
          </h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {scores.map((score) => (
          <div 
            key={score.playerId}
            className={`p-4 border-l-4 ${getRankStyles(score.rank)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getRankIcon(score.rank)}
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-lg">
                      {score.playerName}
                    </span>
                    {score.rank === 1 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                        Winner!
                      </span>
                    )}
                  </div>
                  
                  {showLastRoundPoints && 'lastRoundPoints' in score && (
                    <p className="text-sm text-gray-600">
                      Last round: +{(score as any).lastRoundPoints} points
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  score.rank === 1 ? 'text-yellow-600' :
                  score.rank === 2 ? 'text-gray-600' :
                  score.rank === 3 ? 'text-orange-600' :
                  'text-gray-700'
                }`}>
                  {score.score.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  points
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 text-center">
        {isGameFinished ? (
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">
              🎉 Game Complete! 🎉
            </p>
            <p className="text-sm text-gray-600">
              Thanks for playing! Share this game with more friends.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Keep playing to climb the leaderboard!
          </p>
        )}
      </div>
    </div>
  );
}
