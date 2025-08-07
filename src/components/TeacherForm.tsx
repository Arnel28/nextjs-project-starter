'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isValidQuizURL, generateSessionId, ValidationResult } from '@/lib/security/validator';

interface TeacherFormProps {
  onQuizCreated?: (sessionId: string, quizUrl: string) => void;
}

export function TeacherForm({ onQuizCreated }: TeacherFormProps) {
  const [quizUrl, setQuizUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [generatedSession, setGeneratedSession] = useState<{
    sessionId: string;
    secureUrl: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidation(null);

    try {
      // Validate the quiz URL
      const validationResult = isValidQuizURL(quizUrl);
      setValidation(validationResult);

      if (validationResult.isValid && validationResult.normalizedUrl) {
        // Generate session ID
        const sessionId = generateSessionId();
        
        // Store quiz data (in a real app, this would be saved to a database)
        const quizData = {
          sessionId,
          quizUrl: validationResult.normalizedUrl,
          createdAt: new Date().toISOString(),
          teacherId: 'temp-teacher-id', // In a real app, get from auth
        };

        // Store in localStorage for demo purposes
        localStorage.setItem(`quiz_${sessionId}`, JSON.stringify(quizData));

        // Generate secure URL
        const baseUrl = window.location.origin;
        const secureUrl = `${baseUrl}/quiz/${sessionId}`;

        setGeneratedSession({
          sessionId,
          secureUrl,
        });

        // Call callback if provided
        if (onQuizCreated) {
          onQuizCreated(sessionId, validationResult.normalizedUrl);
        }
      }
    } catch (error) {
      console.error('Error creating quiz session:', error);
      setValidation({
        isValid: false,
        error: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuizUrl('');
    setValidation(null);
    setGeneratedSession(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (generatedSession) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">Quiz Session Created Successfully!</CardTitle>
          <CardDescription>
            Share the secure link below with your students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="session-id">Session ID</Label>
            <div className="flex gap-2">
              <Input
                id="session-id"
                value={generatedSession.sessionId}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(generatedSession.sessionId)}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secure-url">Secure Quiz URL</Label>
            <div className="flex gap-2">
              <Input
                id="secure-url"
                value={generatedSession.secureUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(generatedSession.secureUrl)}
              >
                Copy
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Important:</strong> Students must use this exact URL to access the quiz in secure mode. 
              The quiz will automatically enable anti-cheating measures including fullscreen mode and keyboard restrictions.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Create Another Quiz
            </Button>
            <Button
              onClick={() => window.open(generatedSession.secureUrl, '_blank')}
              className="flex-1"
            >
              Test Quiz Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Secure Quiz Session</CardTitle>
        <CardDescription>
          Enter a Google Forms quiz URL to create a secure, anti-cheating quiz environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="quiz-url">Google Quiz URL</Label>
            <Input
              id="quiz-url"
              type="url"
              placeholder="https://docs.google.com/forms/d/..."
              value={quizUrl}
              onChange={(e) => setQuizUrl(e.target.value)}
              required
              className={validation && !validation.isValid ? 'border-red-500' : ''}
            />
            <p className="text-sm text-gray-600">
              Supported formats: Google Forms (docs.google.com/forms), forms.gle, forms.google.com
            </p>
          </div>

          {validation && !validation.isValid && (
            <Alert variant="destructive">
              <AlertDescription>{validation.error}</AlertDescription>
            </Alert>
          )}

          {validation && validation.isValid && (
            <Alert>
              <AlertDescription className="text-green-600">
                ✓ Valid Google Forms URL detected
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Security Features Enabled:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fullscreen mode enforcement</li>
                <li>• Keyboard shortcut blocking (F12, Ctrl+T, etc.)</li>
                <li>• Right-click and context menu disabled</li>
                <li>• Tab switching detection</li>
                <li>• Window focus monitoring</li>
                <li>• Copy/paste restrictions</li>
              </ul>
            </div>

            <Button type="submit" disabled={isLoading || !quizUrl.trim()} className="w-full">
              {isLoading ? 'Creating Secure Session...' : 'Create Secure Quiz Session'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
