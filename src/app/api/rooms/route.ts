import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DatabaseService } from '@/lib/supabase';

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { playlist_id, playlist_name } = body;

    // Generate unique room code
    const code = await DatabaseService.generateUniqueRoomCode();

    // Create room
    const room = await DatabaseService.createRoom({
      code,
      host_spotify_id: session.user.id,
      host_name: session.user.name || 'Unknown Host',
    });

    // Update with playlist if provided
    if (playlist_id && playlist_name) {
      await DatabaseService.updateRoom(code, {
        playlist_id,
        playlist_name,
      });
    }

    return NextResponse.json({
      success: true,
      data: { room, code },
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create room' 
      },
      { status: 500 }
    );
  }
}

// GET /api/rooms/[code] - Get room by code
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.pathname.split('/').pop();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Room code is required' },
        { status: 400 }
      );
    }

    const room = await DatabaseService.getRoomByCode(code);
    
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found or expired' },
        { status: 404 }
      );
    }

    const players = await DatabaseService.getPlayersByRoom(code);

    return NextResponse.json({
      success: true,
      data: { room, players },
    });
  } catch (error) {
    console.error('Error getting room:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get room' 
      },
      { status: 500 }
    );
  }
}
