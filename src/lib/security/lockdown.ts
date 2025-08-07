/**
 * Lockdown security functions to prevent cheating
 */

export interface LockdownState {
  isActive: boolean;
  violations: string[];
  startTime: number;
}

let lockdownState: LockdownState = {
  isActive: false,
  violations: [],
  startTime: 0
};

/**
 * Disable right-click context menu
 */
function disableContextMenu(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

/**
 * Disable keyboard shortcuts that could be used for cheating
 */
function disableKeyboardShortcuts(event: KeyboardEvent) {
  const forbiddenKeys = [
    'F12', // Developer tools
    'F11', // Fullscreen toggle
    'F5',  // Refresh
    'F1',  // Help
  ];

  const forbiddenCombinations = [
    { ctrl: true, key: 'u' },      // View source
    { ctrl: true, key: 'U' },      // View source
    { ctrl: true, key: 's' },      // Save page
    { ctrl: true, key: 'S' },      // Save page
    { ctrl: true, key: 'a' },      // Select all
    { ctrl: true, key: 'A' },      // Select all
    { ctrl: true, key: 'c' },      // Copy
    { ctrl: true, key: 'C' },      // Copy
    { ctrl: true, key: 'v' },      // Paste
    { ctrl: true, key: 'V' },      // Paste
    { ctrl: true, key: 'x' },      // Cut
    { ctrl: true, key: 'X' },      // Cut
    { ctrl: true, key: 'z' },      // Undo
    { ctrl: true, key: 'Z' },      // Undo
    { ctrl: true, key: 'y' },      // Redo
    { ctrl: true, key: 'Y' },      // Redo
    { ctrl: true, key: 'f' },      // Find
    { ctrl: true, key: 'F' },      // Find
    { ctrl: true, key: 'h' },      // Replace
    { ctrl: true, key: 'H' },      // Replace
    { ctrl: true, key: 'r' },      // Refresh
    { ctrl: true, key: 'R' },      // Refresh
    { ctrl: true, key: 't' },      // New tab
    { ctrl: true, key: 'T' },      // New tab
    { ctrl: true, key: 'n' },      // New window
    { ctrl: true, key: 'N' },      // New window
    { ctrl: true, key: 'w' },      // Close tab
    { ctrl: true, key: 'W' },      // Close tab
    { ctrl: true, key: 'j' },      // Downloads
    { ctrl: true, key: 'J' },      // Downloads
    { ctrl: true, shift: true, key: 'i' }, // Developer tools
    { ctrl: true, shift: true, key: 'I' }, // Developer tools
    { ctrl: true, shift: true, key: 'j' }, // Console
    { ctrl: true, shift: true, key: 'J' }, // Console
    { ctrl: true, shift: true, key: 'c' }, // Inspector
    { ctrl: true, shift: true, key: 'C' }, // Inspector
    { alt: true, key: 'Tab' },     // Alt+Tab
    { alt: true, key: 'F4' },      // Alt+F4
  ];

  // Check forbidden single keys
  if (forbiddenKeys.includes(event.key)) {
    event.preventDefault();
    event.stopPropagation();
    logViolation(`Attempted to use forbidden key: ${event.key}`);
    return false;
  }

  // Check forbidden key combinations
  for (const combo of forbiddenCombinations) {
    const ctrlMatch = combo.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
    const altMatch = combo.alt ? event.altKey : !event.altKey;
    const shiftMatch = combo.shift ? event.shiftKey : !event.shiftKey;
    const keyMatch = combo.key.toLowerCase() === event.key.toLowerCase();

    if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
      event.preventDefault();
      event.stopPropagation();
      logViolation(`Attempted forbidden key combination: ${JSON.stringify(combo)}`);
      return false;
    }
  }

  return true;
}

/**
 * Disable text selection
 */
function disableTextSelection(event: Event) {
  event.preventDefault();
  return false;
}

/**
 * Disable drag and drop
 */
function disableDragDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

/**
 * Log security violations
 */
function logViolation(violation: string) {
  const timestamp = new Date().toISOString();
  const violationEntry = `${timestamp}: ${violation}`;
  lockdownState.violations.push(violationEntry);
  console.warn('Security violation:', violationEntry);
}

/**
 * Enable lockdown mode
 */
export function enableLockdown(): boolean {
  try {
    if (lockdownState.isActive) {
      return true;
    }

    // Add event listeners
    document.addEventListener('contextmenu', disableContextMenu, { passive: false });
    document.addEventListener('keydown', disableKeyboardShortcuts, { passive: false });
    document.addEventListener('selectstart', disableTextSelection, { passive: false });
    document.addEventListener('dragstart', disableDragDrop, { passive: false });
    document.addEventListener('drop', disableDragDrop, { passive: false });

    // Disable text selection via CSS
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).mozUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';

    // Disable drag
    (document.body.style as any).webkitUserDrag = 'none';

    lockdownState.isActive = true;
    lockdownState.startTime = Date.now();
    
    console.log('Lockdown mode enabled');
    return true;
  } catch (error) {
    console.error('Failed to enable lockdown mode:', error);
    return false;
  }
}

/**
 * Disable lockdown mode
 */
export function disableLockdown(): boolean {
  try {
    if (!lockdownState.isActive) {
      return true;
    }

    // Remove event listeners
    document.removeEventListener('contextmenu', disableContextMenu);
    document.removeEventListener('keydown', disableKeyboardShortcuts);
    document.removeEventListener('selectstart', disableTextSelection);
    document.removeEventListener('dragstart', disableDragDrop);
    document.removeEventListener('drop', disableDragDrop);

    // Restore text selection
    document.body.style.userSelect = '';
    (document.body.style as any).webkitUserSelect = '';
    (document.body.style as any).mozUserSelect = '';
    (document.body.style as any).msUserSelect = '';

    // Restore drag
    (document.body.style as any).webkitUserDrag = '';

    lockdownState.isActive = false;
    
    console.log('Lockdown mode disabled');
    return true;
  } catch (error) {
    console.error('Failed to disable lockdown mode:', error);
    return false;
  }
}

/**
 * Get current lockdown state
 */
export function getLockdownState(): LockdownState {
  return { ...lockdownState };
}

/**
 * Clear violation history
 */
export function clearViolations(): void {
  lockdownState.violations = [];
}

/**
 * Request fullscreen mode
 */
export function requestFullscreen(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        element.requestFullscreen()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
        resolve(true);
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen();
        resolve(true);
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error('Failed to request fullscreen:', error);
      resolve(false);
    }
  });
}

/**
 * Exit fullscreen mode
 */
export function exitFullscreen(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        resolve(true);
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
        resolve(true);
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      resolve(false);
    }
  });
}

/**
 * Check if currently in fullscreen
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}
