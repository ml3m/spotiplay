import { SpotifyPlaylist, SpotifyTrack, SpotifyUser } from './types';

export class SpotifyService {
  private static readonly BASE_URL = 'https://api.spotify.com/v1';

  // Get user profile
  static async getUser(accessToken: string): Promise<SpotifyUser> {
    const response = await fetch(`${this.BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user's playlists
  static async getUserPlaylists(accessToken: string, limit = 50): Promise<SpotifyPlaylist[]> {
    const playlists: SpotifyPlaylist[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${this.BASE_URL}/me/playlists?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get playlists: ${response.statusText}`);
      }

      const data = await response.json();
      playlists.push(...data.items);

      hasMore = data.next !== null;
      offset += limit;
    }

    // Filter out playlists with no tracks or no preview URLs
    return playlists.filter(playlist => playlist.tracks.total > 0);
  }

  // Get playlist tracks
  static async getPlaylistTracks(
    accessToken: string,
    playlistId: string,
    limit = 100
  ): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${this.BASE_URL}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=items(track(id,name,artists,album,preview_url,duration_ms)),next`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get playlist tracks: ${response.statusText}`);
      }

      const data = await response.json();
      const validTracks = data.items
        .filter((item: any) => item.track && item.track.id && item.track.preview_url)
        .map((item: any) => item.track);

      tracks.push(...validTracks);

      hasMore = data.next !== null;
      offset += limit;
    }

    return tracks;
  }

  // Get a single playlist
  static async getPlaylist(accessToken: string, playlistId: string): Promise<SpotifyPlaylist> {
    const response = await fetch(`${this.BASE_URL}/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get playlist: ${response.statusText}`);
    }

    return response.json();
  }

  // Search for tracks (for additional options when generating wrong answers)
  static async searchTracks(
    accessToken: string,
    query: string,
    limit = 20
  ): Promise<SpotifyTrack[]> {
    const response = await fetch(
      `${this.BASE_URL}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search tracks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tracks.items.filter((track: SpotifyTrack) => track.preview_url);
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
  }> {
    const clientId = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    return response.json();
  }

  // Validate if tracks have preview URLs
  static validateTracksForGame(tracks: SpotifyTrack[]): {
    validTracks: SpotifyTrack[];
    invalidCount: number;
  } {
    const validTracks = tracks.filter(track => 
      track.preview_url && 
      track.id && 
      track.name && 
      track.artists.length > 0
    );

    return {
      validTracks,
      invalidCount: tracks.length - validTracks.length,
    };
  }

  // Get random tracks from a playlist for the game
  static getRandomTracksForGame(tracks: SpotifyTrack[], count: number): SpotifyTrack[] {
    const validTracks = this.validateTracksForGame(tracks).validTracks;
    
    if (validTracks.length < count) {
      throw new Error(`Not enough valid tracks in playlist. Need ${count}, but only ${validTracks.length} available.`);
    }

    const shuffled = [...validTracks].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Generate wrong answer choices from the same playlist
  static generateWrongAnswers(
    correctTrack: SpotifyTrack,
    allTracks: SpotifyTrack[],
    count = 3
  ): SpotifyTrack[] {
    const otherTracks = allTracks.filter(track => track.id !== correctTrack.id);
    
    if (otherTracks.length < count) {
      throw new Error(`Not enough tracks to generate ${count} wrong answers`);
    }

    const shuffled = [...otherTracks].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Create multiple choice question
  static createMultipleChoiceQuestion(
    correctTrack: SpotifyTrack,
    allTracks: SpotifyTrack[]
  ): {
    track: SpotifyTrack;
    choices: SpotifyTrack[];
    correctAnswer: number;
  } {
    const wrongAnswers = this.generateWrongAnswers(correctTrack, allTracks, 3);
    const choices = [correctTrack, ...wrongAnswers];
    
    // Shuffle choices
    const shuffledChoices = [...choices].sort(() => Math.random() - 0.5);
    const correctAnswer = shuffledChoices.findIndex(track => track.id === correctTrack.id);

    return {
      track: correctTrack,
      choices: shuffledChoices,
      correctAnswer,
    };
  }

  // Helper to format track display name
  static formatTrackName(track: SpotifyTrack): string {
    const artists = track.artists.map(artist => artist.name).join(', ');
    return `${track.name} - ${artists}`;
  }

  // Helper to get track duration in minutes:seconds format
  static formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Check if user has sufficient playlists for the game
  static async validateUserPlaylists(accessToken: string): Promise<{
    isValid: boolean;
    message: string;
    playlistCount: number;
  }> {
    try {
      const playlists = await this.getUserPlaylists(accessToken);
      const validPlaylists = [];

      for (const playlist of playlists) {
        const tracks = await this.getPlaylistTracks(accessToken, playlist.id);
        const { validTracks } = this.validateTracksForGame(tracks);
        
        if (validTracks.length >= 10) { // Need at least 10 tracks for a game
          validPlaylists.push(playlist);
        }
      }

      if (validPlaylists.length === 0) {
        return {
          isValid: false,
          message: 'No playlists found with enough tracks that have preview URLs. You need at least 10 tracks with previews.',
          playlistCount: 0,
        };
      }

      return {
        isValid: true,
        message: `Found ${validPlaylists.length} valid playlist(s) for the game.`,
        playlistCount: validPlaylists.length,
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Error validating playlists: ${error instanceof Error ? error.message : 'Unknown error'}`,
        playlistCount: 0,
      };
    }
  }
}
