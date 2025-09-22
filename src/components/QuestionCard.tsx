'use client';

import { useState, useEffect } from 'react';
import { GameQuestion } from '@/lib/types';
import { AudioPlayer } from './AudioPlayer';
import { Clock, CheckCircle } from 'lucide-react';

interface QuestionCardProps {
  question: GameQuestion;
  timeRemaining: number;
  onAnswer: (choice: number) => void;
  hasAnswered: boolean;
  correctAnswer?: number;
  className?: string;
}

export function QuestionCard({ 
  question, 
  timeRemaining, 
  onAnswer, 
  hasAnswered,
  correctAnswer,
  className = '' 
}: QuestionCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedChoice(null);
    setShowResults(false);
  }, [question]);

  // Show results when time is up or correct answer is provided
  useEffect(() => {
    if (timeRemaining <= 0 || correctAnswer !== undefined) {
      setShowResults(true);
    }
  }, [timeRemaining, correctAnswer]);

  const handleChoiceClick = (choiceIndex: number) => {
    if (hasAnswered || showResults) return;
    
    setSelectedChoice(choiceIndex);
    onAnswer(choiceIndex);
  };

  const getChoiceStyles = (choiceIndex: number) => {
    const baseStyles = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md";
    
    if (!showResults) {
      if (selectedChoice === choiceIndex) {
        return `${baseStyles} border-blue-500 bg-blue-50 text-blue-900`;
      }
      if (hasAnswered) {
        return `${baseStyles} border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed`;
      }
      return `${baseStyles} border-gray-200 hover:border-gray-300 cursor-pointer`;
    }

    // Show results
    if (correctAnswer === choiceIndex) {
      return `${baseStyles} border-green-500 bg-green-100 text-green-900`;
    }
    if (selectedChoice === choiceIndex && selectedChoice !== correctAnswer) {
      return `${baseStyles} border-red-500 bg-red-100 text-red-900`;
    }
    return `${baseStyles} border-gray-200 bg-gray-50 text-gray-600`;
  };

  const formatTime = (seconds: number) => {
    return seconds.toString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          What song is this?
        </h2>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          timeRemaining <= 3 ? 'bg-red-100 text-red-800' :
          timeRemaining <= 7 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          <Clock size={16} />
          <span className="font-semibold">
            {formatTime(timeRemaining)}s
          </span>
        </div>
      </div>

      {/* Audio Player */}
      <div className="mb-6">
        <AudioPlayer 
          src={question.track.preview_url || ''} 
          autoPlay={true}
          className="border border-gray-200"
        />
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {question.choices.map((choice, index) => (
          <button
            key={`${choice.id}-${index}`}
            onClick={() => handleChoiceClick(index)}
            disabled={hasAnswered || showResults}
            className={getChoiceStyles(index)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">
                  {choice.name}
                </div>
                <div className="text-sm opacity-75">
                  {choice.artists.map(artist => artist.name).join(', ')}
                </div>
              </div>
              
              {showResults && correctAnswer === index && (
                <CheckCircle size={24} className="text-green-600" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Status Message */}
      <div className="mt-6 text-center">
        {hasAnswered && !showResults && (
          <p className="text-green-600 font-medium">
            Answer submitted! Waiting for other players...
          </p>
        )}
        
        {showResults && (
          <div className="space-y-2">
            {selectedChoice === correctAnswer ? (
              <p className="text-green-600 font-medium text-lg">
                Correct! 🎉
              </p>
            ) : selectedChoice !== null ? (
              <p className="text-red-600 font-medium text-lg">
                Wrong answer 😔
              </p>
            ) : (
              <p className="text-gray-600 font-medium text-lg">
                Time&apos;s up! ⏰
              </p>
            )}
            
            <p className="text-sm text-gray-600">
              The correct answer was: <strong>{question.choices[correctAnswer || 0].name}</strong>
            </p>
          </div>
        )}
        
        {!hasAnswered && !showResults && (
          <p className="text-gray-600">
            Select your answer before time runs out!
          </p>
        )}
      </div>
    </div>
  );
}
