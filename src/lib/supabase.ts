import { createClient } from '@supabase/supabase-js';
import { Room, Player } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database helper functions
export class DatabaseService {
  // Room operations
  static async createRoom(data: {
    code: string;
    host_spotify_id: string;
    host_name: string;
  }): Promise<Room> {
    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .insert({
        code: data.code,
        host_spotify_id: data.host_spotify_id,
        host_name: data.host_name,
        status: 'waiting',
        current_song: 0,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create room: ${error.message}`);
    }

    return room;
  }

  static async getRoomByCode(code: string): Promise<Room | null> {
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Room not found
      }
      throw new Error(`Failed to get room: ${error.message}`);
    }

    // Check if room has expired
    if (new Date(room.expires_at) < new Date()) {
      await this.deleteRoom(code);
      return null;
    }

    return room;
  }

  static async updateRoom(code: string, updates: Partial<Room>): Promise<Room> {
    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .update(updates)
      .eq('code', code)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update room: ${error.message}`);
    }

    return room;
  }

  static async deleteRoom(code: string): Promise<void> {
    // Delete all players first
    await supabaseAdmin
      .from('players')
      .delete()
      .eq('room_code', code);

    // Delete the room
    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('code', code);

    if (error) {
      throw new Error(`Failed to delete room: ${error.message}`);
    }
  }

  static async cleanupExpiredRooms(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to cleanup expired rooms:', error);
    }
  }

  // Player operations
  static async addPlayer(data: {
    room_code: string;
    name: string;
  }): Promise<Player> {
    // Check if player name already exists in the room
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', data.room_code)
      .eq('name', data.name)
      .single();

    if (existingPlayer) {
      throw new Error('A player with this name already exists in the room');
    }

    const { data: player, error } = await supabaseAdmin
      .from('players')
      .insert({
        room_code: data.room_code,
        name: data.name,
        score: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add player: ${error.message}`);
    }

    return player;
  }

  static async getPlayersByRoom(roomCode: string): Promise<Player[]> {
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', roomCode)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get players: ${error.message}`);
    }

    return players || [];
  }

  static async updatePlayerScore(playerId: string, score: number): Promise<Player> {
    const { data: player, error } = await supabaseAdmin
      .from('players')
      .update({ score })
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update player score: ${error.message}`);
    }

    return player;
  }

  static async removePlayer(playerId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) {
      throw new Error(`Failed to remove player: ${error.message}`);
    }
  }

  static async removePlayerByName(roomCode: string, playerName: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('players')
      .delete()
      .eq('room_code', roomCode)
      .eq('name', playerName);

    if (error) {
      throw new Error(`Failed to remove player: ${error.message}`);
    }
  }

  // Utility functions
  static generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async isRoomCodeUnique(code: string): Promise<boolean> {
    const room = await this.getRoomByCode(code);
    return room === null;
  }

  static async generateUniqueRoomCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = this.generateRoomCode();
      const isUnique = await this.isRoomCodeUnique(code);
      
      if (isUnique) {
        return code;
      }
      
      attempts++;
    }

    throw new Error('Failed to generate unique room code');
  }
}

// Database schema initialization SQL
export const DB_SCHEMA = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  code varchar(6) UNIQUE NOT NULL,
  host_spotify_id varchar NOT NULL,
  host_name varchar NOT NULL,
  playlist_id varchar,
  playlist_name varchar,
  status varchar DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_song integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code varchar(6) REFERENCES rooms(code) ON DELETE CASCADE,
  name varchar NOT NULL,
  score integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_code, name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_players_room_code ON players(room_code);

-- Row Level Security (RLS) policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY IF NOT EXISTS "Allow read access to rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access to players" ON players FOR SELECT USING (true);

-- Allow insert/update/delete only for service role
CREATE POLICY IF NOT EXISTS "Allow service role full access to rooms" ON rooms FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Allow service role full access to players" ON players FOR ALL USING (auth.role() = 'service_role');
`;
