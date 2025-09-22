import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Spotify Song Guessing Game',
  description: 'A multiplayer music guessing game powered by Spotify. Test your music knowledge with friends!',
  keywords: ['spotify', 'music', 'game', 'quiz', 'multiplayer', 'songs'],
  authors: [{ name: 'Spotify Song Game' }],
  openGraph: {
    title: 'Spotify Song Guessing Game',
    description: 'A multiplayer music guessing game powered by Spotify',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spotify Song Guessing Game',
    description: 'A multiplayer music guessing game powered by Spotify',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
