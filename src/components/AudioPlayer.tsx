'use client';

import { useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
}

export function AudioPlayer({ src, autoPlay = false, onEnded, className = '' }: AudioPlayerProps) {
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    isLoading,
    error,
    play, 
    pause, 
    setVolume, 
    load,
    togglePlayPause,
    formatTime 
  } = useAudio();

  // Load new source when src changes
  useEffect(() => {
    if (src) {
      load(src);
    }
  }, [src, load]);

  // Auto-play when enabled
  useEffect(() => {
    if (autoPlay && src && !isLoading && !error) {
      const timer = setTimeout(() => {
        play();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, src, isLoading, error, play]);

  // Handle ended event
  useEffect(() => {
    if (currentTime > 0 && currentTime >= duration && onEnded) {
      onEnded();
    }
  }, [currentTime, duration, onEnded]);

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Audio playback error
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No audio source
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {/* Main Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="w-12 h-12 rounded-full bg-spotify-green hover:bg-green-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-1" />
          )}
        </button>

        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">
            Song Preview
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-spotify-green h-2 rounded-full transition-all duration-100"
            style={{ 
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' 
            }}
          />
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        
        <span className="text-xs text-gray-500 w-8">
          {Math.round(volume * 100)}%
        </span>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #1DB954;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #1DB954;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
