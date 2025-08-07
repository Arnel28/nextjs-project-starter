'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  initMonitor, 
  stopMonitor, 
  onViolation, 
  getMonitorState, 
  clearViolations,
  getViolationCount,
  getLastViolation,
  SecurityViolation 
} from '@/lib/security/monitor';

export interface UseSecurityMonitorReturn {
  isMonitoring: boolean;
  violations: SecurityViolation[];
  violationCount: number;
  lastViolation: SecurityViolation | null;
  startMonitoring: () => boolean;
  stopMonitoring: () => boolean;
  clearViolationHistory: () => void;
  onSecurityViolation: (callback: (violation: SecurityViolation) => void) => () => void;
}

/**
 * Custom hook for managing security monitoring
 */
export function useSecurityMonitor(): UseSecurityMonitorReturn {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [violations, setViolations] = useState<SecurityViolation[]>([]);
  const [violationCount, setViolationCount] = useState(0);
  const [lastViolation, setLastViolation] = useState<SecurityViolation | null>(null);

  // Update state from monitor system
  const updateState = useCallback(() => {
    const state = getMonitorState();
    setIsMonitoring(state.isActive);
    setViolations([...state.violations]);
    setViolationCount(state.violations.length);
    setLastViolation(getLastViolation());
  }, []);

  // Initialize monitoring and set up violation listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (isMonitoring) {
      // Set up violation listener
      unsubscribe = onViolation((violation) => {
        updateState();
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isMonitoring, updateState]);

  // Periodic state updates
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(updateState, 2000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring, updateState]);

  const startMonitoring = useCallback((): boolean => {
    try {
      const success = initMonitor();
      if (success) {
        setIsMonitoring(true);
        updateState();
      }
      return success;
    } catch (error) {
      console.error('Failed to start security monitoring:', error);
      return false;
    }
  }, [updateState]);

  const stopMonitoring = useCallback((): boolean => {
    try {
      const success = stopMonitor();
      if (success) {
        setIsMonitoring(false);
        updateState();
      }
      return success;
    } catch (error) {
      console.error('Failed to stop security monitoring:', error);
      return false;
    }
  }, [updateState]);

  const clearViolationHistory = useCallback(() => {
    clearViolations();
    updateState();
  }, [updateState]);

  const onSecurityViolation = useCallback((callback: (violation: SecurityViolation) => void) => {
    return onViolation(callback);
  }, []);

  return {
    isMonitoring,
    violations,
    violationCount,
    lastViolation,
    startMonitoring,
    stopMonitoring,
    clearViolationHistory,
    onSecurityViolation,
  };
}

/**
 * Hook for monitoring specific violation types
 */
export function useViolationCounter(violationType?: SecurityViolation['type']) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setCount(getViolationCount(violationType));
    };

    // Initial count
    updateCount();

    // Set up violation listener
    const unsubscribe = onViolation(() => {
      updateCount();
    });

    return unsubscribe;
  }, [violationType]);

  return count;
}

/**
 * Hook for getting violation alerts with thresholds
 */
export function useViolationAlert(threshold: number = 3) {
  const { violationCount, lastViolation } = useSecurityMonitor();
  const [alertTriggered, setAlertTriggered] = useState(false);

  useEffect(() => {
    if (violationCount >= threshold && !alertTriggered) {
      setAlertTriggered(true);
    } else if (violationCount < threshold && alertTriggered) {
      setAlertTriggered(false);
    }
  }, [violationCount, threshold, alertTriggered]);

  return {
    shouldAlert: alertTriggered,
    violationCount,
    lastViolation,
    threshold,
  };
}
