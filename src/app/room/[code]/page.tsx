'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GameRoom } from '@/components/GameRoom';

export default function RoomPage() {
  const params = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const roomCode = params.code as string;

  const handleLeave = () => {
    router.push('/dashboard');
  };

  if (!session) {
    router.push('/');
    return null;
  }

  return (
    <GameRoom
      roomCode={roomCode}
      isHost={true}
      hostSpotifyId={session.user.id}
      playerName={session.user.name || 'Host'}
      onLeave={handleLeave}
    />
  );
}
