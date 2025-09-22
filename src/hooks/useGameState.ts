'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { 
  GameState, 
  Room, 
  Player, 
  GameQuestion,
  PlayerAnswer,
  PlayerScore
} from '@/lib/types';

export function useGameState(initialRoomCode?: string) {
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (updatedRoom: Room) => {
      setRoom(updatedRoom);
    };

    const handlePlayerJoined = (player: Player) => {
      setGameState(prev => prev ? {
        ...prev,
        players: [...prev.players.filter(p => p.id !== player.id), player]
      } : null);
    };

    const handlePlayerLeft = (playerId: string) => {
      setGameState(prev => prev ? {
        ...prev,
        players: prev.players.filter(p => p.id !== playerId)
      } : null);
    };

    const handleGameStarted = (newGameState: GameState) => {
      setGameState(newGameState);
      setError(null);
    };

    const handleQuestionStarted = (question: GameQuestion, timeRemaining: number) => {
      setGameState(prev => prev ? {
        ...prev,
        currentQuestion: question,
        timeRemaining,
        answers: prev.answers.filter(a => a.questionIndex !== prev.questionIndex) // Clear previous answers
      } : null);
    };

    const handleQuestionEnded = (answers: PlayerAnswer[], leaderboard: PlayerScore[]) => {
      setGameState(prev => prev ? {
        ...prev,
        answers: [...prev.answers, ...answers],
        timeRemaining: 0,
      } : null);
    };

    const handleGameFinished = (finalScores: PlayerScore[]) => {
      setGameState(prev => prev ? {
        ...prev,
        status: 'finished',
        currentQuestion: undefined,
      } : null);
    };

    const handleTimerUpdate = (timeRemaining: number) => {
      setGameState(prev => prev ? {
        ...prev,
        timeRemaining,
      } : null);
    };

    const handleError = (errorMessage: string) => {
      setError(errorMessage);
      setIsLoading(false);
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('gameStarted', handleGameStarted);
    socket.on('questionStarted', handleQuestionStarted);
    socket.on('questionEnded', handleQuestionEnded);
    socket.on('gameFinished', handleGameFinished);
    socket.on('timerUpdate', handleTimerUpdate);
    socket.on('error', handleError);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('gameStarted', handleGameStarted);
      socket.off('questionStarted', handleQuestionStarted);
      socket.off('questionEnded', handleQuestionEnded);
      socket.off('gameFinished', handleGameFinished);
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('error', handleError);
    };
  }, [socket]);

  // Join room function
  const joinRoom = useCallback(async (code: string, playerName: string) => {
    if (!socket || !isConnected) {
      setError('Not connected to server');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, get room info from API
      const response = await fetch(`/api/rooms?code=${code}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setRoom(result.data.room);
      
      // Then join via socket
      socket.emit('joinRoom', code, playerName);
      
      // Find the current player (will be updated when playerJoined event fires)
      const existingPlayer = result.data.players.find((p: Player) => p.name === playerName);
      if (existingPlayer) {
        setCurrentPlayer(existingPlayer);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  }, [socket, isConnected]);

  // Start game function
  const startGame = useCallback(async () => {
    if (!socket || !room) {
      setError('Cannot start game');
      return;
    }

    setIsLoading(true);
    socket.emit('startGame', room.code);
  }, [socket, room]);

  // Submit answer function
  const submitAnswer = useCallback(async (answer: number) => {
    if (!socket || !gameState || !currentPlayer || !gameState.currentQuestion) {
      setError('Cannot submit answer');
      return;
    }

    const responseTime = Date.now() - gameState.currentQuestion.startTime;
    socket.emit('submitAnswer', gameState.roomCode, currentPlayer.id, answer, responseTime);
  }, [socket, gameState, currentPlayer]);

  // Next question function
  const nextQuestion = useCallback(async () => {
    if (!socket || !gameState) {
      setError('Cannot start next question');
      return;
    }

    socket.emit('nextQuestion', gameState.roomCode);
  }, [socket, gameState]);

  // Leave room function
  const leaveRoom = useCallback(() => {
    if (socket && gameState && currentPlayer) {
      socket.emit('leaveRoom', gameState.roomCode, currentPlayer.id);
    }
    
    // Reset state
    setGameState(null);
    setRoom(null);
    setCurrentPlayer(null);
    setError(null);
  }, [socket, gameState, currentPlayer]);

  // Auto-join room on mount if code provided
  useEffect(() => {
    if (initialRoomCode && socket && isConnected && !gameState) {
      // This will be handled by the component, not automatically
    }
  }, [initialRoomCode, socket, isConnected, gameState]);

  return {
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
  };
}
