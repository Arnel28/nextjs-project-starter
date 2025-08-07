'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { prepareQuizForEmbed } from '@/lib/security/validator';

interface QuizEmbedProps {
  quizUrl: string;
  sessionId: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

export function QuizEmbed({ quizUrl, sessionId, onError, onLoad }: QuizEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string>('');

  useEffect(() => {
    try {
      const preparedUrl = prepareQuizForEmbed(quizUrl);
      setEmbedUrl(preparedUrl);
    } catch (err) {
      const errorMessage = 'Failed to prepare quiz URL for embedding';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [quizUrl, onError]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    if (onLoad) {
      onLoad();
    }
  };

  const handleIframeError = () => {
    const errorMessage = 'Failed to load quiz. Please check the URL and try again.';
    setError(errorMessage);
    setIsLoading(false);
    if (onError) {
      onError(errorMessage);
    }
  };

  const retryLoad = () => {
    setError(null);
    setIsLoading(true);
    // Force iframe reload by changing src
    const iframe = document.getElementById('quiz-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = embedUrl;
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription className="text-center">
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={retryLoad} className="mt-4">
          Retry Loading Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading secure quiz environment...</p>
            <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
          </div>
        </div>
      )}
      
      <iframe
        id="quiz-iframe"
        src={embedUrl}
        className="w-full h-full min-h-screen border-0"
        title="Secure Quiz"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        allow="fullscreen"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
      />
      
      {/* Security indicator */}
      <div className="fixed top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium z-20">
        🔒 Secure Mode Active
      </div>
      
      {/* Session info */}
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-xs z-20">
        Session: {sessionId}
      </div>
    </div>
  );
}

/**
 * Fallback component for when quiz fails to load
 */
export function QuizEmbedFallback({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry: () => void; 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Quiz Loading Failed
        </h2>
        
        <p className="text-gray-600 mb-6">
          {error}
        </p>
        
        <div className="space-y-3">
          <Button onClick={onRetry} className="w-full">
            Try Again
          </Button>
          
          <div className="text-sm text-gray-500">
            <p>If the problem persists:</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• Check your internet connection</li>
              <li>• Verify the quiz URL is correct</li>
              <li>• Contact your teacher for assistance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
