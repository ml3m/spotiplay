#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎵 Setting up Spotify Song Guessing Game...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const exampleEnvPath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(exampleEnvPath)) {
    fs.copyFileSync(exampleEnvPath, envPath);
    console.log('✅ Created .env.local from env.example');
    console.log('⚠️  Please edit .env.local with your actual values\n');
  } else {
    console.log('⚠️  env.example not found. Please create .env.local manually\n');
  }
} else {
  console.log('✅ .env.local already exists\n');
}

// Display setup instructions
console.log('🚀 Next steps:');
console.log('1. Set up Spotify Developer Account:');
console.log('   - Go to https://developer.spotify.com/dashboard');
console.log('   - Create a new app');
console.log('   - Add redirect URI: http://localhost:3000/api/auth/callback/spotify');
console.log('   - Copy Client ID and Client Secret to .env.local\n');

console.log('2. Set up Supabase:');
console.log('   - Create project at https://supabase.com');
console.log('   - Run the SQL schema from README.md');
console.log('   - Copy project URL and keys to .env.local\n');

console.log('3. Generate a secure NextAuth secret:');
console.log('   - Run: openssl rand -base64 32');
console.log('   - Add to .env.local as NEXTAUTH_SECRET\n');

console.log('4. Start development server:');
console.log('   - Run: npm run dev');
console.log('   - Visit: http://localhost:3000\n');

console.log('📖 For detailed setup instructions, see README.md');
console.log('🎉 Happy gaming!');
