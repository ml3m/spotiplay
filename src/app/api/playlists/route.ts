import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SpotifyService } from '@/lib/spotify';

// GET /api/playlists - Get user's playlists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.error === "RefreshAccessTokenError") {
      return NextResponse.json(
        { success: false, error: 'Token expired. Please sign in again.' },
        { status: 401 }
      );
    }

    const playlists = await SpotifyService.getUserPlaylists(session.accessToken);

    // Filter playlists that have enough tracks for a game
    const validPlaylists = [];
    for (const playlist of playlists) {
      try {
        const tracks = await SpotifyService.getPlaylistTracks(session.accessToken, playlist.id);
        const { validTracks } = SpotifyService.validateTracksForGame(tracks);
        
        if (validTracks.length >= 10) {
          validPlaylists.push({
            ...playlist,
            validTrackCount: validTracks.length,
          });
        }
      } catch (error) {
        console.error(`Error validating playlist ${playlist.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: validPlaylists,
    });
  } catch (error) {
    console.error('Error getting playlists:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get playlists' 
      },
      { status: 500 }
    );
  }
}
