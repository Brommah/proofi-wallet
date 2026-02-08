/**
 * Validation Unit Tests
 * Tests for form validation and input sanitization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══ Validation Utilities ═══

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true, value: trimmed.toLowerCase() };
}

/**
 * Validate wallet address (Substrate/Polkadot format)
 */
function validateWalletAddress(address) {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Wallet address is required' };
  }
  
  const trimmed = address.trim();
  
  // Substrate addresses start with 1-9 or a-z (base58)
  // Standard length is 48 characters for SS58
  if (trimmed.length < 45 || trimmed.length > 50) {
    return { valid: false, error: 'Invalid address length' };
  }
  
  // Check for valid base58 characters (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(trimmed)) {
    return { valid: false, error: 'Invalid address characters' };
  }
  
  return { valid: true, value: trimmed };
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required', strength: 0 };
  }
  
  const errors = [];
  let strength = 0;
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else {
    strength += 1;
  }
  
  if (password.length >= 12) strength += 1;
  if (password.length >= 16) strength += 1;
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  } else {
    strength += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  } else {
    strength += 1;
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers');
  } else {
    strength += 1;
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password should contain special characters');
  } else {
    strength += 1;
  }
  
  // Normalize strength to 0-4 scale
  const normalizedStrength = Math.min(4, Math.floor(strength / 2));
  
  return {
    valid: errors.length === 0 || (errors.length === 1 && errors[0].includes('should')),
    error: errors.length > 0 ? errors[0] : null,
    errors,
    strength: normalizedStrength,
    strengthLabel: ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'][normalizedStrength]
  };
}

/**
 * Validate recovery phrase (12 or 24 words)
 */
function validateRecoveryPhrase(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return { valid: false, error: 'Recovery phrase is required' };
  }
  
  const words = phrase.trim().toLowerCase().split(/\s+/);
  
  if (words.length !== 12 && words.length !== 24) {
    return { valid: false, error: `Recovery phrase must be 12 or 24 words (got ${words.length})` };
  }
  
  // Check for suspicious patterns
  if (new Set(words).size < words.length / 2) {
    return { valid: false, error: 'Too many repeated words' };
  }
  
  // Check each word is lowercase letters only
  for (const word of words) {
    if (!/^[a-z]+$/.test(word)) {
      return { valid: false, error: 'Invalid word in recovery phrase' };
    }
    if (word.length < 3 || word.length > 8) {
      return { valid: false, error: 'Invalid word length in recovery phrase' };
    }
  }
  
  return { valid: true, value: words.join(' '), wordCount: words.length };
}

/**
 * Validate price input
 */
function validatePrice(price) {
  if (price === null || price === undefined || price === '') {
    return { valid: false, error: 'Price is required' };
  }
  
  const num = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(num)) {
    return { valid: false, error: 'Invalid price format' };
  }
  
  if (num < 0) {
    return { valid: false, error: 'Price cannot be negative' };
  }
  
  if (num > 1000000) {
    return { valid: false, error: 'Price exceeds maximum' };
  }
  
  // Round to 4 decimal places for crypto
  const rounded = Math.round(num * 10000) / 10000;
  
  return { valid: true, value: rounded };
}

/**
 * Sanitize text input (prevent XSS)
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Validate URL
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  try {
    const parsed = new URL(url.trim());
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS' };
    }
    
    return { valid: true, value: parsed.href };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// ═══ Tests ═══

describe('Validation Module', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com').valid).toBe(true);
      expect(validateEmail('user.name@domain.co.uk').valid).toBe(true);
      expect(validateEmail('user+tag@example.org').valid).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid').valid).toBe(false);
      expect(validateEmail('missing@domain').valid).toBe(false);
      expect(validateEmail('@nodomain.com').valid).toBe(false);
      expect(validateEmail('spaces in@email.com').valid).toBe(false);
    });

    it('should normalize email to lowercase', () => {
      const result = validateEmail('TEST@EXAMPLE.COM');
      expect(result.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const result = validateEmail('  test@example.com  ');
      expect(result.value).toBe('test@example.com');
    });

    it('should require email', () => {
      expect(validateEmail('').error).toBe('Email is required');
      expect(validateEmail(null).error).toBe('Email is required');
      expect(validateEmail(undefined).error).toBe('Email is required');
    });
  });

  describe('validateWalletAddress', () => {
    it('should accept valid Substrate addresses', () => {
      // Typical Polkadot address
      const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      expect(validateWalletAddress(address).valid).toBe(true);
    });

    it('should reject addresses with invalid characters', () => {
      // Contains 0 and O which are not in base58
      const invalid = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcN0HGKO';
      expect(validateWalletAddress(invalid).valid).toBe(false);
    });

    it('should reject too short addresses', () => {
      expect(validateWalletAddress('5Grwva').valid).toBe(false);
    });

    it('should reject too long addresses', () => {
      const tooLong = 'a'.repeat(55);
      expect(validateWalletAddress(tooLong).valid).toBe(false);
    });

    it('should require address', () => {
      expect(validateWalletAddress('').valid).toBe(false);
      expect(validateWalletAddress(null).valid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should require minimum 8 characters', () => {
      expect(validatePassword('short').valid).toBe(false);
      expect(validatePassword('short').error).toContain('8 characters');
    });

    it('should require lowercase letters', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.errors).toContain('Password must contain lowercase letters');
    });

    it('should require uppercase letters', () => {
      const result = validatePassword('password123!');
      expect(result.errors).toContain('Password must contain uppercase letters');
    });

    it('should require numbers', () => {
      const result = validatePassword('Password!');
      expect(result.errors).toContain('Password must contain numbers');
    });

    it('should recommend special characters', () => {
      const result = validatePassword('Password123');
      expect(result.errors).toContain('Password should contain special characters');
      // Should still be valid (it's a recommendation)
      expect(result.valid).toBe(true);
    });

    it('should accept strong passwords', () => {
      const result = validatePassword('SecureP@ss123!');
      expect(result.valid).toBe(true);
      expect(result.strength).toBeGreaterThanOrEqual(3);
    });

    it('should calculate strength correctly', () => {
      expect(validatePassword('weak').strength).toBe(0);
      expect(validatePassword('password').strength).toBeLessThanOrEqual(2);
      expect(validatePassword('Password1').strength).toBeGreaterThanOrEqual(1);
      expect(validatePassword('Password1!').strength).toBeGreaterThanOrEqual(2);
    });

    it('should provide strength labels', () => {
      const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
      const result = validatePassword('SecureP@ssword123!');
      expect(labels).toContain(result.strengthLabel);
    });
  });

  describe('validateRecoveryPhrase', () => {
    it('should accept 12-word phrase', () => {
      // Use unique words to pass the repeated words check
      const phrase = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
      const result = validateRecoveryPhrase(phrase);
      expect(result.valid).toBe(true);
      expect(result.wordCount).toBe(12);
    });

    it('should accept 24-word phrase', () => {
      // 24 unique words (all 3-8 chars, lowercase letters only)
      const uniquePhrase = 'abandon ability able about above absent absorb abstract absurd abuse access accident actor actual adapt address admit adult advice affair afford afraid again agent';
      const result = validateRecoveryPhrase(uniquePhrase);
      expect(result.valid).toBe(true);
    });

    it('should reject wrong word count', () => {
      const phrase = 'one two three four five';
      const result = validateRecoveryPhrase(phrase);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('12 or 24 words');
    });

    it('should reject too many repeated words', () => {
      const phrase = Array(12).fill('test').join(' ');
      const result = validateRecoveryPhrase(phrase);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('repeated');
    });

    it('should reject words with numbers', () => {
      const phrase = 'abandon1 abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const result = validateRecoveryPhrase(phrase);
      expect(result.valid).toBe(false);
    });

    it('should normalize to lowercase', () => {
      const phrase = 'Abandon Ability Able About Above Absent Absorb Abstract Absurd Abuse Access Accident';
      const result = validateRecoveryPhrase(phrase);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(phrase.toLowerCase());
    });
  });

  describe('validatePrice', () => {
    it('should accept valid prices', () => {
      expect(validatePrice(10.50).valid).toBe(true);
      expect(validatePrice('10.50').valid).toBe(true);
      expect(validatePrice(0).valid).toBe(true);
    });

    it('should reject negative prices', () => {
      expect(validatePrice(-10).valid).toBe(false);
      expect(validatePrice(-10).error).toContain('negative');
    });

    it('should reject too high prices', () => {
      expect(validatePrice(10000000).valid).toBe(false);
      expect(validatePrice(10000000).error).toContain('maximum');
    });

    it('should reject invalid formats', () => {
      expect(validatePrice('abc').valid).toBe(false);
      expect(validatePrice(NaN).valid).toBe(false);
    });

    it('should round to 4 decimal places', () => {
      const result = validatePrice(0.123456789);
      expect(result.value).toBe(0.1235);
    });

    it('should require price', () => {
      expect(validatePrice('').valid).toBe(false);
      expect(validatePrice(null).valid).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML entities', () => {
      expect(sanitizeInput('<script>')).toBe('&lt;script&gt;');
      expect(sanitizeInput('"quoted"')).toBe('&quot;quoted&quot;');
      expect(sanitizeInput("'single'")).toBe('&#039;single&#039;');
    });

    it('should escape ampersands', () => {
      expect(sanitizeInput('a & b')).toBe('a &amp; b');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    it('should prevent XSS attacks', () => {
      const xss = '<img src=x onerror=alert(1)>';
      const sanitized = sanitizeInput(xss);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });
  });

  describe('validateUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(validateUrl('http://example.com').valid).toBe(true);
      expect(validateUrl('https://example.com').valid).toBe(true);
    });

    it('should accept URLs with paths and params', () => {
      expect(validateUrl('https://example.com/path?query=1').valid).toBe(true);
    });

    it('should reject non-HTTP protocols', () => {
      expect(validateUrl('ftp://example.com').valid).toBe(false);
      expect(validateUrl('javascript:alert(1)').valid).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not a url').valid).toBe(false);
      expect(validateUrl('').valid).toBe(false);
    });

    it('should normalize URL', () => {
      const result = validateUrl('https://example.com/path/');
      expect(result.value).toBe('https://example.com/path/');
    });
  });
});
