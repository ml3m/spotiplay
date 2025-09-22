# 🎵 Spotify Song Guessing Game

A real-time multiplayer music guessing game powered by Spotify. Test your music knowledge with friends by guessing songs from your favorite playlists!

## ✨ Features

- **Spotify Integration**: Connect with your Spotify account to access your playlists
- **Real-time Multiplayer**: Up to 50 players can join a room simultaneously
- **Multiple Choice Questions**: 4 answer choices with 10-second timer
- **Smart Scoring**: Points awarded based on response speed (1000 max, decreasing over time)
- **Live Leaderboard**: Real-time scoring and rankings after each round
- **Mobile Responsive**: Play on any device with a modern web browser
- **Shareable Rooms**: Easy 6-character room codes for inviting friends
- **Audio Preview**: 30-second Spotify track previews with volume control

## 🎮 How to Play

1. **Host creates room**: Connect Spotify account and select a playlist
2. **Players join**: Share the room code - no Spotify account needed for players
3. **Listen & Guess**: 30-second song preview with 4 multiple choice answers
4. **Score points**: Faster correct answers earn more points (1000 max)
5. **Compete**: Live leaderboard updates after each of the 10 rounds
6. **Win**: Highest total score wins!

## 🛠 Tech Stack

- **Framework**: Next.js 14 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom Spotify-themed design
- **Real-time**: Socket.io for multiplayer synchronization
- **Database**: Supabase (PostgreSQL) for room and player management
- **Authentication**: NextAuth.js with Spotify OAuth
- **Audio**: Web Audio API with custom player controls
- **Deployment**: Vercel-ready with optimized configuration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Spotify Developer Account
- Supabase Account

### 1. Clone Repository

```bash
git clone <repository-url>
cd spotify-song-guessing-game
npm install
```

### 2. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add these redirect URIs:
   - `http://localhost:3000/api/auth/callback/spotify` (development)
   - `https://your-domain.com/api/auth/callback/spotify` (production)
4. Note your **Client ID** and **Client Secret**

### 3. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Go to SQL Editor and run this schema:

```sql
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
```

3. Get your project URL and API keys from Settings > API

### 4. Environment Variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here

# Spotify OAuth (from Spotify Developer Dashboard)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Supabase Configuration (from Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start playing!

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**: Commit your code to a GitHub repository

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect Next.js

3. **Configure Environment Variables**:
   Add all the environment variables from `.env.local` to Vercel:
   ```
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret
   SPOTIFY_CLIENT_ID=your-spotify-id
   SPOTIFY_CLIENT_SECRET=your-spotify-secret
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
   ```

4. **Update Spotify Redirect URI**:
   Add your Vercel domain to Spotify app settings:
   `https://your-app.vercel.app/api/auth/callback/spotify`

5. **Deploy**: Vercel will automatically deploy your app

### Manual Deployment

```bash
npm run build
npm start
```

## 📋 Game Rules

### Scoring System
- **Maximum Points**: 1000 points per correct answer
- **Minimum Points**: 100 points per correct answer
- **Time Penalty**: 90 points deducted per second of response time
- **Wrong Answer**: 0 points

### Game Flow
1. **Lobby**: Players join using 6-character room code
2. **Question Phase**: 30-second audio preview with 4 choices
3. **Answer Phase**: 10-second timer for responses
4. **Results Phase**: Show correct answer and round scores
5. **Repeat**: Continue for 10 total questions
6. **Final Results**: Show winner and final leaderboard

### Room Management
- **Expiration**: Rooms automatically expire after 24 hours
- **Cleanup**: Automatic cleanup of expired rooms and players
- **Capacity**: Maximum 50 players per room
- **Host Controls**: Only host can start game and advance questions

## 🎯 Game Requirements

### For Hosts (Spotify Account Required)
- Valid Spotify account (Free or Premium)
- At least one playlist with 10+ songs that have preview URLs
- Songs must have 30-second preview clips available

### For Players (No Account Needed)
- Modern web browser with JavaScript enabled
- Internet connection for real-time gameplay
- Audio capability to hear song previews

## 🔧 Configuration

### Game Settings (src/lib/types.ts)
```typescript
export const GAME_CONFIG = {
  QUESTIONS_PER_GAME: 10,      // Number of questions per game
  QUESTION_DURATION: 10,       // Seconds to answer each question
  PREVIEW_DURATION: 30,        // Seconds of song preview
  MAX_PLAYERS: 50,             // Maximum players per room
  ROOM_EXPIRY_HOURS: 24,       // Hours before room expires
  POINTS: {
    MAX_POINTS: 1000,          // Maximum points per question
    MIN_POINTS: 100,           // Minimum points for correct answer
    TIME_PENALTY: 90,          // Points deducted per second
  },
};
```

### Database Configuration
- **Automatic Cleanup**: Expired rooms are cleaned up automatically
- **Row Level Security**: Enabled for data protection
- **Indexes**: Optimized for performance with proper indexing

## 🐛 Troubleshooting

### Common Issues

**"No playlists found"**
- Ensure playlists have at least 10 songs with preview URLs
- Some older tracks may not have preview clips available
- Try creating a new playlist with recent popular songs

**"Room not found"**
- Room codes expire after 24 hours
- Check for typos in the 6-character code
- Host may have deleted the room

**"Audio not playing"**
- Check browser permissions for audio playback
- Some browsers require user interaction before audio plays
- Ensure Spotify preview URLs are available for tracks

**Socket connection issues**
- Check internet connection
- Firewall may be blocking WebSocket connections
- Try refreshing the page

### Performance Optimization

**For better audio performance:**
- Use headphones to avoid audio feedback
- Close unnecessary browser tabs
- Ensure stable internet connection

**For large groups:**
- Test with smaller groups first
- Monitor network performance
- Consider using a CDN for static assets

## 📈 Monitoring

### Built-in Analytics
- Player join/leave events logged
- Game completion tracking
- Error logging for debugging

### Recommended Monitoring
- Vercel Analytics for performance
- Supabase monitoring for database health
- Socket.io connection metrics

## 🔒 Security

### Data Protection
- No sensitive Spotify data stored
- Temporary room codes expire automatically
- Row Level Security enabled on database
- Environment variables properly secured

### Privacy
- Only basic profile and playlist access requested
- No user data shared between players
- Automatic cleanup of expired game data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spotify Web API** for music data and previews
- **Socket.io** for real-time multiplayer functionality
- **Supabase** for database and authentication
- **Vercel** for hosting and deployment
- **Next.js** team for the amazing framework

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing GitHub issues
3. Create a new issue with detailed description
4. Include browser console logs if applicable

---

**🎵 Ready to test your music knowledge? Let the games begin! 🎵**
# spotiplay
