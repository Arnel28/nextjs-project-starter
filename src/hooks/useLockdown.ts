'use client';

import { useEffect, useState } from 'react';
import { enableLockdown, disableLockdown, getLockdownState, requestFullscreen, exitFullscreen, isFullscreen } from '@/lib/security/lockdown';

export interface UseLockdownReturn {
  isLockdownActive: boolean;
  violations: string[];
  isFullscreen: boolean;
  enableLockdownMode: () => Promise<boolean>;
  disableLockdownMode: () => boolean;
  enterFullscreen: () => Promise<boolean>;
  exitFullscreenMode: () => Promise<boolean>;
  clearViolations: () => void;
}

/**
 * Custom hook for managing lockdown security features
 */
export function useLockdown(): UseLockdownReturn {
  const [isLockdownActive, setIsLockdownActive] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  // Update state from lockdown system
  const updateState = () => {
    const state = getLockdownState();
    setIsLockdownActive(state.isActive);
    setViolations([...state.violations]);
    setIsFullscreenMode(isFullscreen());
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenMode(isFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Periodic state updates to catch violations
  useEffect(() => {
    if (isLockdownActive) {
      const interval = setInterval(updateState, 1000);
      return () => clearInterval(interval);
    }
  }, [isLockdownActive]);

  const enableLockdownMode = async (): Promise<boolean> => {
    try {
      const success = enableLockdown();
      if (success) {
        // Also try to enter fullscreen
        await requestFullscreen();
        updateState();
      }
      return success;
    } catch (error) {
      console.error('Failed to enable lockdown mode:', error);
      return false;
    }
  };

  const disableLockdownMode = (): boolean => {
    try {
      const success = disableLockdown();
      if (success) {
        updateState();
      }
      return success;
    } catch (error) {
      console.error('Failed to disable lockdown mode:', error);
      return false;
    }
  };

  const enterFullscreen = async (): Promise<boolean> => {
    try {
      const success = await requestFullscreen();
      setIsFullscreenMode(isFullscreen());
      return success;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      return false;
    }
  };

  const exitFullscreenMode = async (): Promise<boolean> => {
    try {
      const success = await exitFullscreen();
      setIsFullscreenMode(isFullscreen());
      return success;
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      return false;
    }
  };

  const clearViolations = () => {
    // Import and use the clearViolations function from lockdown
    import('@/lib/security/lockdown').then(({ clearViolations: clearLockdownViolations }) => {
      clearLockdownViolations();
      updateState();
    });
  };

  return {
    isLockdownActive,
    violations,
    isFullscreen: isFullscreenMode,
    enableLockdownMode,
    disableLockdownMode,
    enterFullscreen,
    exitFullscreenMode,
    clearViolations,
  };
}
