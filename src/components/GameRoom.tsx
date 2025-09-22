'use client';

import { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { PlayerList } from './PlayerList';
import { QuestionCard } from './QuestionCard';
import { Leaderboard } from './Leaderboard';
import { AudioPlayer } from './AudioPlayer';
import { 
  Copy, 
  Play, 
  SkipForward, 
  Users, 
  Music,
  ExternalLink,
  Settings,
  LogOut
} from 'lucide-react';

interface GameRoomProps {
  roomCode: string;
  isHost?: boolean;
  hostSpotifyId?: string;
  playerName?: string;
  onLeave?: () => void;
}

export function GameRoom({ 
  roomCode, 
  isHost = false,
  hostSpotifyId,
  playerName,
  onLeave 
}: GameRoomProps) {
  const {
    gameState,
    room,
    currentPlayer,
    isLoading,
    error,
    joinRoom,
    startGame,
    submitAnswer,
    nextQuestion,
    leaveRoom,
    isConnected,
  } = useGameState(roomCode);

  const [hasAnswered, setHasAnswered] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Join room on mount if player name is provided
  useEffect(() => {
    if (playerName && !currentPlayer && isConnected) {
      joinRoom(roomCode, playerName);
    }
  }, [playerName, currentPlayer, isConnected, roomCode, joinRoom]);

  // Reset answer state when new question starts
  useEffect(() => {
    if (gameState?.currentQuestion) {
      setHasAnswered(false);
      setShowLeaderboard(false);
    }
  }, [gameState?.currentQuestion]);

  // Show leaderboard after question ends
  useEffect(() => {
    if (gameState?.timeRemaining === 0 && gameState?.currentQuestion) {
      setShowLeaderboard(true);
    }
  }, [gameState?.timeRemaining, gameState?.currentQuestion]);

  const handleAnswer = (choice: number) => {
    if (!hasAnswered) {
      submitAnswer(choice);
      setHasAnswered(true);
    }
  };

  const copyRoomLink = async () => {
    const link = `${window.location.origin}/join/${roomCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getGameStatus = () => {
    if (!gameState) return 'Waiting for game to start...';
    
    switch (gameState.status) {
      case 'waiting':
        return 'Waiting for host to start the game';
      case 'playing':
        return `Question ${gameState.questionIndex + 1} of ${gameState.totalQuestions}`;
      case 'finished':
        return 'Game finished!';
      default:
        return '';
    }
  };

  const leaderboard = gameState?.players
    .map(player => ({
      playerId: player.id,
      playerName: player.name,
      score: player.score,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 })) || [];

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto mb-4"></div>
        <p className="text-gray-600">Loading game room...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Room {roomCode}</h1>
            <p className="text-gray-600">{getGameStatus()}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomLink}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              {copySuccess ? (
                <>
                  <span className="text-green-600">✓</span>
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Share
                </>
              )}
            </button>
            
            {onLeave && (
              <button
                onClick={onLeave}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Leave
              </button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-4 text-sm">
          <div className={`flex items-center gap-2 ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          
          {room && (
            <div className="text-gray-600">
              <Music size={16} className="inline mr-1" />
              {room.playlist_name || 'No playlist selected'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Controls (Host Only) */}
          {isHost && gameState?.status === 'waiting' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Host Controls</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={startGame}
                  disabled={!room?.playlist_id || gameState.players.length === 0}
                  className="flex items-center gap-2 bg-spotify-green hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={20} />
                  Start Game
                </button>
                
                <div className="text-sm text-gray-600">
                  {!room?.playlist_id && "Please select a playlist first"}
                  {room?.playlist_id && gameState.players.length === 0 && "Waiting for players to join"}
                </div>
              </div>
            </div>
          )}

          {/* Active Question */}
          {gameState?.currentQuestion && !showLeaderboard && (
            <QuestionCard
              question={gameState.currentQuestion}
              timeRemaining={gameState.timeRemaining}
              onAnswer={handleAnswer}
              hasAnswered={hasAnswered}
            />
          )}

          {/* Round Results / Leaderboard */}
          {showLeaderboard && (
            <div className="space-y-4">
              <Leaderboard
                scores={leaderboard}
                showLastRoundPoints={true}
                isGameFinished={gameState?.status === 'finished'}
              />
              
              {isHost && gameState?.status === 'playing' && gameState?.questionIndex < gameState?.totalQuestions && (
                <div className="bg-white rounded-lg shadow-md p-4 text-center">
                  <button
                    onClick={nextQuestion}
                    className="flex items-center gap-2 bg-spotify-green hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors mx-auto"
                  >
                    <SkipForward size={20} />
                    Next Question
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Waiting State */}
          {gameState?.status === 'waiting' && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Music size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Waiting to Start
              </h3>
              <p className="text-gray-600 mb-4">
                {isHost 
                  ? "Start the game when you're ready!" 
                  : "Waiting for the host to start the game"}
              </p>
              
              <div className="max-w-sm mx-auto">
                <PlayerList 
                  players={gameState.players}
                  hostSpotifyId={hostSpotifyId}
                  currentPlayerId={currentPlayer?.id}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Players List */}
          <PlayerList 
            players={gameState?.players || []}
            hostSpotifyId={hostSpotifyId}
            currentPlayerId={currentPlayer?.id}
          />

          {/* Room Info */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Room Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Code:</span>
                <span className="font-mono">{roomCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="capitalize">{gameState?.status || 'waiting'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Players:</span>
                <span>{gameState?.players.length || 0}</span>
              </div>
              {gameState?.status === 'playing' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span>{gameState.questionIndex + 1}/{gameState.totalQuestions}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
