/**
 * URL validation utilities for Google Quiz links
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validates if a URL is a legitimate Google Forms/Quiz URL
 */
export function isValidQuizURL(url: string): ValidationResult {
  try {
    // Remove whitespace and ensure URL has protocol
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { isValid: false, error: 'URL cannot be empty' };
    }

    // Add https if no protocol is provided
    const urlWithProtocol = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    
    const parsedUrl = new URL(urlWithProtocol);
    
    // Check if it's a Google domain
    const validDomains = [
      'docs.google.com',
      'forms.gle',
      'forms.google.com'
    ];
    
    const isGoogleDomain = validDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
    
    if (!isGoogleDomain) {
      return { 
        isValid: false, 
        error: 'Only Google Forms URLs are allowed (docs.google.com/forms, forms.gle, forms.google.com)' 
      };
    }
    
    // Additional validation for Google Forms structure
    if (parsedUrl.hostname === 'docs.google.com') {
      if (!parsedUrl.pathname.includes('/forms/')) {
        return { 
          isValid: false, 
          error: 'Invalid Google Forms URL structure' 
        };
      }
    }
    
    // Ensure HTTPS for security
    if (parsedUrl.protocol !== 'https:') {
      parsedUrl.protocol = 'https:';
    }
    
    return { 
      isValid: true, 
      normalizedUrl: parsedUrl.toString() 
    };
    
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Invalid URL format' 
    };
  }
}

/**
 * Generates a secure session ID for quiz access
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `quiz_${timestamp}_${randomPart}`;
}

/**
 * Validates session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  const sessionPattern = /^quiz_[a-z0-9]+_[a-z0-9]+$/;
  return sessionPattern.test(sessionId);
}

/**
 * Extracts quiz parameters from Google Forms URL for embedding
 */
export function prepareQuizForEmbed(url: string): string {
  try {
    const parsedUrl = new URL(url);
    
    // For Google Forms, ensure we get the embed version
    if (parsedUrl.hostname === 'docs.google.com' && parsedUrl.pathname.includes('/forms/')) {
      // Convert to embed format if not already
      if (!parsedUrl.pathname.includes('/viewform')) {
        // Handle different Google Forms URL formats
        const pathParts = parsedUrl.pathname.split('/');
        const formIndex = pathParts.indexOf('forms');
        if (formIndex !== -1 && pathParts[formIndex + 2]) {
          const formId = pathParts[formIndex + 2];
          return `https://docs.google.com/forms/d/${formId}/viewform?embedded=true`;
        }
      } else {
        // Add embedded parameter if not present
        if (!parsedUrl.searchParams.has('embedded')) {
          parsedUrl.searchParams.set('embedded', 'true');
        }
        return parsedUrl.toString();
      }
    }
    
    // For forms.gle, return as-is (they typically work in iframes)
    return url;
    
  } catch (error) {
    console.error('Error preparing quiz for embed:', error);
    return url;
  }
}
