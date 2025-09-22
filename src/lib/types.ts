// Database Types
export interface Room {
  id: string;
  code: string;
  host_spotify_id: string;
  host_name: string;
  playlist_id?: string;
  playlist_name?: string;
  status: 'waiting' | 'playing' | 'finished';
  current_song: number;
  created_at: string;
  expires_at: string;
}

export interface Player {
  id: string;
  room_code: string;
  name: string;
  score: number;
  joined_at: string;
}

// Spotify API Types
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  images: Array<{
    url: string;
    height?: number;
    width?: number;
  }>;
  tracks: {
    total: number;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height?: number;
      width?: number;
    }>;
  };
  preview_url?: string;
  duration_ms: number;
}

export interface SpotifyUser {
  id: string;
  display_name?: string;
  email?: string;
  images: Array<{
    url: string;
    height?: number;
    width?: number;
  }>;
}

// Game Types
export interface GameQuestion {
  track: SpotifyTrack;
  choices: SpotifyTrack[];
  correctAnswer: number;
  startTime: number;
  duration: number; // in seconds
}

export interface PlayerAnswer {
  playerId: string;
  playerName: string;
  questionIndex: number;
  selectedChoice: number;
  isCorrect: boolean;
  responseTime: number; // in milliseconds
  pointsEarned: number;
  timestamp: number;
}

export interface GameState {
  roomCode: string;
  status: 'waiting' | 'playing' | 'finished';
  currentQuestion?: GameQuestion;
  questionIndex: number;
  totalQuestions: number;
  players: Player[];
  answers: PlayerAnswer[];
  timeRemaining: number;
  playlist?: SpotifyPlaylist;
}

// Socket Event Types
export interface ServerToClientEvents {
  roomUpdated: (room: Room) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  gameStarted: (gameState: GameState) => void;
  questionStarted: (question: GameQuestion, timeRemaining: number) => void;
  questionEnded: (answers: PlayerAnswer[], leaderboard: PlayerScore[]) => void;
  gameFinished: (finalScores: PlayerScore[]) => void;
  error: (message: string) => void;
  timerUpdate: (timeRemaining: number) => void;
}

export interface ClientToServerEvents {
  joinRoom: (roomCode: string, playerName: string) => void;
  startGame: (roomCode: string) => void;
  submitAnswer: (roomCode: string, playerId: string, answer: number, responseTime: number) => void;
  nextQuestion: (roomCode: string) => void;
  leaveRoom: (roomCode: string, playerId: string) => void;
}

// UI Types
export interface PlayerScore {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

export interface LeaderboardEntry extends PlayerScore {
  lastRoundPoints?: number;
  avatar?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateRoomResponse {
  room: Room;
  code: string;
}

export interface JoinRoomResponse {
  room: Room;
  player: Player;
}

// Hook Types
export interface UseGameStateReturn {
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  joinRoom: (code: string, playerName: string) => Promise<void>;
  startGame: () => Promise<void>;
  submitAnswer: (answer: number) => Promise<void>;
  nextQuestion: () => Promise<void>;
  leaveRoom: () => void;
}

export interface UseSocketReturn {
  socket: any; // Socket instance
  isConnected: boolean;
  error: string | null;
}

export interface UseAudioReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  load: (url: string) => void;
}

// Constants
export const GAME_CONFIG = {
  QUESTIONS_PER_GAME: 10,
  QUESTION_DURATION: 10, // seconds
  PREVIEW_DURATION: 30, // seconds
  MAX_PLAYERS: 50,
  ROOM_EXPIRY_HOURS: 24,
  POINTS: {
    MAX_POINTS: 1000,
    MIN_POINTS: 100,
    TIME_PENALTY: 90, // points deducted per second
  },
} as const;

export const ROOM_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
} as const;
