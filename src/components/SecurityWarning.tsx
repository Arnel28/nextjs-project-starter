'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SecurityViolation } from '@/lib/security/monitor';

interface SecurityWarningProps {
  violation: SecurityViolation | null;
  violationCount: number;
  maxViolations?: number;
  onAcknowledge: () => void;
  onForceSubmit?: () => void;
  isOpen: boolean;
}

export function SecurityWarning({
  violation,
  violationCount,
  maxViolations = 3,
  onAcknowledge,
  onForceSubmit,
  isOpen
}: SecurityWarningProps) {
  const [timeLeft, setTimeLeft] = useState(10);
  const isLastWarning = violationCount >= maxViolations;

  useEffect(() => {
    if (isOpen && isLastWarning) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (onForceSubmit) {
              onForceSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, isLastWarning, onForceSubmit]);

  const getViolationMessage = (type: SecurityViolation['type']): string => {
    switch (type) {
      case 'focus_lost':
        return 'You switched away from the quiz window or another application gained focus.';
      case 'tab_switch':
        return 'You attempted to switch to another browser tab or window.';
      case 'visibility_change':
        return 'The quiz page was hidden or minimized.';
      case 'fullscreen_exit':
        return 'You exited fullscreen mode, which is required for secure testing.';
      case 'window_resize':
        return 'Suspicious window resizing was detected, possibly indicating multi-monitor usage.';
      default:
        return 'A security violation was detected.';
    }
  };

  const getWarningLevel = (): 'warning' | 'danger' | 'critical' => {
    if (violationCount >= maxViolations) return 'critical';
    if (violationCount >= maxViolations - 1) return 'danger';
    return 'warning';
  };

  const getWarningColor = () => {
    const level = getWarningLevel();
    switch (level) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'danger':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-yellow-600 text-white';
    }
  };

  const getWarningTitle = (): string => {
    const level = getWarningLevel();
    switch (level) {
      case 'critical':
        return '🚨 FINAL WARNING - Quiz Will Be Submitted';
      case 'danger':
        return '⚠️ SERIOUS WARNING - Last Chance';
      default:
        return '⚠️ Security Violation Detected';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={`text-center p-3 rounded-lg ${getWarningColor()}`}>
            {getWarningTitle()}
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-900">
                Violation #{violationCount} of {maxViolations}
              </div>
              
              {violation && (
                <div className="text-left bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">What happened:</p>
                  <p className="text-gray-700">{getViolationMessage(violation.type)}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Time: {new Date(violation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}

              {isLastWarning ? (
                <Alert variant="destructive">
                  <AlertDescription className="text-center">
                    <strong>MAXIMUM VIOLATIONS REACHED</strong>
                    <br />
                    Your quiz will be automatically submitted in {timeLeft} seconds.
                    <br />
                    This action cannot be undone.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription className="text-center">
                    You have <strong>{maxViolations - violationCount}</strong> warning(s) remaining.
                    <br />
                    After {maxViolations} violations, your quiz will be automatically submitted.
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <p className="font-medium text-blue-900 mb-2">To avoid violations:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Stay in fullscreen mode</li>
                  <li>• Do not switch tabs or windows</li>
                  <li>• Do not minimize the browser</li>
                  <li>• Keep focus on the quiz at all times</li>
                  <li>• Do not use keyboard shortcuts</li>
                </ul>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col space-y-2">
          {isLastWarning ? (
            <div className="space-y-2 w-full">
              <Button 
                onClick={onForceSubmit} 
                variant="destructive" 
                className="w-full"
              >
                Submit Quiz Now ({timeLeft}s)
              </Button>
              <p className="text-xs text-center text-gray-500">
                Quiz will auto-submit when timer reaches 0
              </p>
            </div>
          ) : (
            <Button onClick={onAcknowledge} className="w-full">
              I Understand - Continue Quiz
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Component for displaying violation history
 */
export function ViolationHistory({ violations }: { violations: SecurityViolation[] }) {
  if (violations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No security violations detected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900">Security Violations ({violations.length})</h3>
      <div className="max-h-40 overflow-y-auto space-y-2">
        {violations.map((violation, index) => (
          <div key={index} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium text-red-800">
                  {violation.type.replace('_', ' ').toUpperCase()}
                </span>
                <p className="text-red-700 mt-1">{violation.details}</p>
              </div>
              <span className="text-red-600 text-xs">
                {new Date(violation.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Security status indicator component
 */
export function SecurityStatus({ 
  violationCount, 
  maxViolations = 3,
  isMonitoring 
}: { 
  violationCount: number; 
  maxViolations?: number;
  isMonitoring: boolean;
}) {
  const getStatusColor = () => {
    if (!isMonitoring) return 'bg-gray-500';
    if (violationCount === 0) return 'bg-green-500';
    if (violationCount < maxViolations - 1) return 'bg-yellow-500';
    if (violationCount < maxViolations) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!isMonitoring) return 'Monitoring Inactive';
    if (violationCount === 0) return 'Secure';
    if (violationCount < maxViolations) return `${violationCount} Violation${violationCount > 1 ? 's' : ''}`;
    return 'Max Violations';
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className={`${getStatusColor()} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2`}>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span>{getStatusText()}</span>
      </div>
    </div>
  );
}
