/**
 * Security monitoring functions to detect cheating attempts
 */

export interface SecurityViolation {
  type: 'focus_lost' | 'tab_switch' | 'visibility_change' | 'fullscreen_exit' | 'window_resize';
  timestamp: number;
  details: string;
}

export interface MonitorState {
  isActive: boolean;
  violations: SecurityViolation[];
  callbacks: ((violation: SecurityViolation) => void)[];
  startTime: number;
}

let monitorState: MonitorState = {
  isActive: false,
  violations: [],
  callbacks: [],
  startTime: 0
};

/**
 * Handle window focus loss
 */
function handleFocusLoss() {
  if (!monitorState.isActive) return;
  
  const violation: SecurityViolation = {
    type: 'focus_lost',
    timestamp: Date.now(),
    details: 'Window lost focus - possible tab switching or external application access'
  };
  
  logViolation(violation);
}

/**
 * Handle window focus gain
 */
function handleFocusGain() {
  if (!monitorState.isActive) return;
  
  console.log('Window regained focus');
}

/**
 * Handle visibility change (tab switching)
 */
function handleVisibilityChange() {
  if (!monitorState.isActive) return;
  
  if (document.hidden) {
    const violation: SecurityViolation = {
      type: 'tab_switch',
      timestamp: Date.now(),
      details: 'Page became hidden - possible tab switching detected'
    };
    
    logViolation(violation);
  } else {
    console.log('Page became visible again');
  }
}

/**
 * Handle fullscreen change
 */
function handleFullscreenChange() {
  if (!monitorState.isActive) return;
  
  const isFullscreen = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
  
  if (!isFullscreen) {
    const violation: SecurityViolation = {
      type: 'fullscreen_exit',
      timestamp: Date.now(),
      details: 'Exited fullscreen mode - security breach detected'
    };
    
    logViolation(violation);
  }
}

/**
 * Handle window resize (potential multi-monitor detection)
 */
function handleWindowResize() {
  if (!monitorState.isActive) return;
  
  // Detect if window is being moved to another monitor or resized suspiciously
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Check if window dimensions suggest multi-monitor setup
  if (windowWidth > screenWidth || windowHeight > screenHeight) {
    const violation: SecurityViolation = {
      type: 'window_resize',
      timestamp: Date.now(),
      details: `Suspicious window resize detected - Window: ${windowWidth}x${windowHeight}, Screen: ${screenWidth}x${screenHeight}`
    };
    
    logViolation(violation);
  }
}

/**
 * Log a security violation
 */
function logViolation(violation: SecurityViolation) {
  monitorState.violations.push(violation);
  console.warn('Security violation detected:', violation);
  
  // Notify all registered callbacks
  monitorState.callbacks.forEach(callback => {
    try {
      callback(violation);
    } catch (error) {
      console.error('Error in violation callback:', error);
    }
  });
}

/**
 * Initialize security monitoring
 */
export function initMonitor(): boolean {
  try {
    if (monitorState.isActive) {
      return true;
    }
    
    // Add event listeners
    window.addEventListener('blur', handleFocusLoss);
    window.addEventListener('focus', handleFocusGain);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('resize', handleWindowResize);
    
    monitorState.isActive = true;
    monitorState.startTime = Date.now();
    
    console.log('Security monitoring initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize security monitoring:', error);
    return false;
  }
}

/**
 * Stop security monitoring
 */
export function stopMonitor(): boolean {
  try {
    if (!monitorState.isActive) {
      return true;
    }
    
    // Remove event listeners
    window.removeEventListener('blur', handleFocusLoss);
    window.removeEventListener('focus', handleFocusGain);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    window.removeEventListener('resize', handleWindowResize);
    
    monitorState.isActive = false;
    
    console.log('Security monitoring stopped');
    return true;
  } catch (error) {
    console.error('Failed to stop security monitoring:', error);
    return false;
  }
}

/**
 * Register a callback for security violations
 */
export function onViolation(callback: (violation: SecurityViolation) => void): () => void {
  monitorState.callbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = monitorState.callbacks.indexOf(callback);
    if (index > -1) {
      monitorState.callbacks.splice(index, 1);
    }
  };
}

/**
 * Get current monitor state
 */
export function getMonitorState(): MonitorState {
  return {
    ...monitorState,
    violations: [...monitorState.violations],
    callbacks: [...monitorState.callbacks]
  };
}

/**
 * Clear violation history
 */
export function clearViolations(): void {
  monitorState.violations = [];
}

/**
 * Get violation count by type
 */
export function getViolationCount(type?: SecurityViolation['type']): number {
  if (type) {
    return monitorState.violations.filter(v => v.type === type).length;
  }
  return monitorState.violations.length;
}

/**
 * Check if monitoring is active
 */
export function isMonitoringActive(): boolean {
  return monitorState.isActive;
}

/**
 * Get violations within a time range
 */
export function getViolationsInRange(startTime: number, endTime: number): SecurityViolation[] {
  return monitorState.violations.filter(
    violation => violation.timestamp >= startTime && violation.timestamp <= endTime
  );
}

/**
 * Get the most recent violation
 */
export function getLastViolation(): SecurityViolation | null {
  return monitorState.violations.length > 0 
    ? monitorState.violations[monitorState.violations.length - 1]
    : null;
}
