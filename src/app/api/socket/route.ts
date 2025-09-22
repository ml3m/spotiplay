import { NextRequest } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';
import { DatabaseService } from '@/lib/supabase';
import { 
  GameState, 
  GameQuestion, 
  PlayerAnswer, 
  PlayerScore,
  GAME_CONFIG,
  SpotifyTrack 
} from '@/lib/types';
import { SpotifyService } from '@/lib/spotify';

interface NextApiResponseServerIO extends Response {
  socket?: {
    server: NetServer & {
      io?: ServerIO;
    };
  };
}

// Game state storage (in production, use Redis or another persistent store)
const gameStates = new Map<string, GameState>();
const gameTimers = new Map<string, NodeJS.Timeout>();

// Socket.io handler
const SocketHandler = async (req: NextRequest, res: NextApiResponseServerIO) => {
  if (res.socket?.server.io) {
    console.log('Socket is already running');
    return new Response('Socket is already running', { status: 200 });
  }

  console.log('Starting Socket.IO server');
  
  const httpServer = res.socket?.server as any;
  const io = new ServerIO(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXTAUTH_URL!] 
        : ["http://localhost:3000"],
      methods: ["GET", "POST"]
    }
  });

  res.socket!.server.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join room
    socket.on('joinRoom', async (roomCode: string, playerName: string) => {
      try {
        const room = await DatabaseService.getRoomByCode(roomCode);
        if (!room) {
          socket.emit('error', 'Room not found or expired');
          return;
        }

        // Add player to database
        const player = await DatabaseService.addPlayer({
          room_code: roomCode,
          name: playerName,
        });

        // Join socket room
        socket.join(roomCode);
        
        // Get updated players list
        const players = await DatabaseService.getPlayersByRoom(roomCode);
        
        // Update game state
        if (gameStates.has(roomCode)) {
          const gameState = gameStates.get(roomCode)!;
          gameState.players = players;
          gameStates.set(roomCode, gameState);
        }

        // Notify all players in room
        io.to(roomCode).emit('playerJoined', player);
        io.to(roomCode).emit('roomUpdated', room);
        
        console.log(`Player ${playerName} joined room ${roomCode}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', error instanceof Error ? error.message : 'Failed to join room');
      }
    });

    // Start game
    socket.on('startGame', async (roomCode: string) => {
      try {
        const room = await DatabaseService.getRoomByCode(roomCode);
        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        if (room.status !== 'waiting') {
          socket.emit('error', 'Game already in progress');
          return;
        }

        if (!room.playlist_id) {
          socket.emit('error', 'No playlist selected');
          return;
        }

        // Update room status
        await DatabaseService.updateRoom(roomCode, { status: 'playing' });
        
        // Get players
        const players = await DatabaseService.getPlayersByRoom(roomCode);
        
        // Initialize game state
        const gameState: GameState = {
          roomCode,
          status: 'playing',
          questionIndex: 0,
          totalQuestions: GAME_CONFIG.QUESTIONS_PER_GAME,
          players,
          answers: [],
          timeRemaining: 0,
          playlist: undefined, // Will be set when we load tracks
        };

        gameStates.set(roomCode, gameState);
        
        // Start first question
        await startNextQuestion(roomCode, io);
        
        io.to(roomCode).emit('gameStarted', gameState);
        
        console.log(`Game started in room ${roomCode}`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', error instanceof Error ? error.message : 'Failed to start game');
      }
    });

    // Submit answer
    socket.on('submitAnswer', async (roomCode: string, playerId: string, answer: number, responseTime: number) => {
      try {
        const gameState = gameStates.get(roomCode);
        if (!gameState || !gameState.currentQuestion) {
          socket.emit('error', 'No active question');
          return;
        }

        // Check if player already answered this question
        const existingAnswer = gameState.answers.find(
          a => a.playerId === playerId && a.questionIndex === gameState.questionIndex
        );
        
        if (existingAnswer) {
          return; // Player already answered
        }

        const player = gameState.players.find(p => p.id === playerId);
        if (!player) {
          socket.emit('error', 'Player not found');
          return;
        }

        const isCorrect = answer === gameState.currentQuestion.correctAnswer;
        let pointsEarned = 0;

        if (isCorrect) {
          // Calculate points based on response time
          const maxPoints = GAME_CONFIG.POINTS.MAX_POINTS;
          const minPoints = GAME_CONFIG.POINTS.MIN_POINTS;
          const timePenalty = GAME_CONFIG.POINTS.TIME_PENALTY;
          const responseTimeSeconds = responseTime / 1000;
          
          pointsEarned = Math.max(
            minPoints,
            Math.round(maxPoints - (responseTimeSeconds * timePenalty))
          );
        }

        // Create answer record
        const playerAnswer: PlayerAnswer = {
          playerId,
          playerName: player.name,
          questionIndex: gameState.questionIndex,
          selectedChoice: answer,
          isCorrect,
          responseTime,
          pointsEarned,
          timestamp: Date.now(),
        };

        gameState.answers.push(playerAnswer);

        // Update player score
        player.score += pointsEarned;
        await DatabaseService.updatePlayerScore(playerId, player.score);

        console.log(`Player ${player.name} answered question ${gameState.questionIndex + 1}: ${isCorrect ? 'correct' : 'wrong'} (+${pointsEarned} points)`);
      } catch (error) {
        console.error('Error submitting answer:', error);
        socket.emit('error', error instanceof Error ? error.message : 'Failed to submit answer');
      }
    });

    // Next question
    socket.on('nextQuestion', async (roomCode: string) => {
      try {
        await startNextQuestion(roomCode, io);
      } catch (error) {
        console.error('Error starting next question:', error);
        socket.emit('error', error instanceof Error ? error.message : 'Failed to start next question');
      }
    });

    // Leave room
    socket.on('leaveRoom', async (roomCode: string, playerId: string) => {
      try {
        await DatabaseService.removePlayer(playerId);
        socket.leave(roomCode);
        
        // Update game state
        if (gameStates.has(roomCode)) {
          const gameState = gameStates.get(roomCode)!;
          gameState.players = gameState.players.filter(p => p.id !== playerId);
          gameStates.set(roomCode, gameState);
        }

        io.to(roomCode).emit('playerLeft', playerId);
        
        console.log(`Player left room ${roomCode}`);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Helper function to start next question
  async function startNextQuestion(roomCode: string, io: ServerIO) {
    const gameState = gameStates.get(roomCode);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Clear existing timer
    if (gameTimers.has(roomCode)) {
      clearTimeout(gameTimers.get(roomCode)!);
      gameTimers.delete(roomCode);
    }

    // Check if game is finished
    if (gameState.questionIndex >= gameState.totalQuestions) {
      await endGame(roomCode, io);
      return;
    }

    // Get playlist tracks (this should be cached in a real implementation)
    const room = await DatabaseService.getRoomByCode(roomCode);
    if (!room || !room.playlist_id) {
      throw new Error('Playlist not found');
    }

    // For now, we'll simulate tracks - in real implementation, use Spotify API
    const mockTracks: SpotifyTrack[] = Array.from({ length: 20 }, (_, i) => ({
      id: `track_${i}`,
      name: `Track ${i + 1}`,
      artists: [{ id: `artist_${i}`, name: `Artist ${i + 1}` }],
      album: {
        id: `album_${i}`,
        name: `Album ${i + 1}`,
        images: [{ url: '', height: 300, width: 300 }],
      },
      preview_url: `https://example.com/preview_${i}.mp3`,
      duration_ms: 180000,
    }));

    // Generate question
    const correctTrack = mockTracks[gameState.questionIndex % mockTracks.length];
    const wrongAnswers = mockTracks
      .filter(t => t.id !== correctTrack.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const choices = [correctTrack, ...wrongAnswers].sort(() => Math.random() - 0.5);
    const correctAnswer = choices.findIndex(track => track.id === correctTrack.id);

    const question: GameQuestion = {
      track: correctTrack,
      choices,
      correctAnswer,
      startTime: Date.now(),
      duration: GAME_CONFIG.QUESTION_DURATION,
    };

    gameState.currentQuestion = question;
    gameState.timeRemaining = GAME_CONFIG.QUESTION_DURATION;
    gameStates.set(roomCode, gameState);

    // Emit question to all players
    io.to(roomCode).emit('questionStarted', question, GAME_CONFIG.QUESTION_DURATION);

    // Start countdown timer
    const timer = setInterval(() => {
      gameState.timeRemaining--;
      io.to(roomCode).emit('timerUpdate', gameState.timeRemaining);

      if (gameState.timeRemaining <= 0) {
        clearInterval(timer);
        endQuestion(roomCode, io);
      }
    }, 1000);

    gameTimers.set(roomCode, timer as any);
  }

  // Helper function to end current question
  async function endQuestion(roomCode: string, io: ServerIO) {
    const gameState = gameStates.get(roomCode);
    if (!gameState) return;

    // Get answers for current question
    const questionAnswers = gameState.answers.filter(
      a => a.questionIndex === gameState.questionIndex
    );

    // Calculate leaderboard
    const leaderboard: PlayerScore[] = gameState.players
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        score: player.score,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // Emit question results
    io.to(roomCode).emit('questionEnded', questionAnswers, leaderboard);

    // Move to next question
    gameState.questionIndex++;
    gameState.currentQuestion = undefined;
    gameStates.set(roomCode, gameState);

    // Auto-start next question after delay
    setTimeout(() => {
      if (gameState.questionIndex < gameState.totalQuestions) {
        startNextQuestion(roomCode, io).catch(console.error);
      } else {
        endGame(roomCode, io).catch(console.error);
      }
    }, 3000);
  }

  // Helper function to end game
  async function endGame(roomCode: string, io: ServerIO) {
    const gameState = gameStates.get(roomCode);
    if (!gameState) return;

    // Update room status
    await DatabaseService.updateRoom(roomCode, { status: 'finished' });

    // Calculate final scores
    const finalScores: PlayerScore[] = gameState.players
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        score: player.score,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // Emit game finished
    io.to(roomCode).emit('gameFinished', finalScores);

    // Clean up
    gameStates.delete(roomCode);
    if (gameTimers.has(roomCode)) {
      clearTimeout(gameTimers.get(roomCode)!);
      gameTimers.delete(roomCode);
    }

    console.log(`Game finished in room ${roomCode}`);
  }

  return new Response('Socket.IO server initialized', { status: 200 });
};

export { SocketHandler as GET, SocketHandler as POST };
