/**
 * Integration tests for assessment validation in Server Actions
 * Verifies that validation functions are correctly integrated
 */

import { describe, it, expect } from 'vitest';
import {
  validatePHQ2Responses,
  validatePHQ9Responses,
  calculatePHQ2Score,
  calculatePHQ9Score,
} from './assessments';

describe('PHQ-2 Validation Integration', () => {
  it('should validate response array length', () => {
    // Too few responses
    expect(validatePHQ2Responses([1]).valid).toBe(false);
    expect(validatePHQ2Responses([1]).error).toBe('PHQ-2 requires exactly 2 responses');
    
    // Too many responses
    expect(validatePHQ2Responses([1, 2, 3]).valid).toBe(false);
    expect(validatePHQ2Responses([1, 2, 3]).error).toBe('PHQ-2 requires exactly 2 responses');
    
    // Correct length
    expect(validatePHQ2Responses([1, 2]).valid).toBe(true);
  });

  it('should validate each response is integer between 0-3', () => {
    // Negative value
    expect(validatePHQ2Responses([-1, 2]).valid).toBe(false);
    expect(validatePHQ2Responses([-1, 2]).error).toContain('must be an integer between 0 and 3');
    
    // Value > 3
    expect(validatePHQ2Responses([1, 4]).valid).toBe(false);
    expect(validatePHQ2Responses([1, 4]).error).toContain('must be an integer between 0 and 3');
    
    // Non-integer
    expect(validatePHQ2Responses([1.5, 2]).valid).toBe(false);
    expect(validatePHQ2Responses([1.5, 2]).error).toContain('must be an integer between 0 and 3');
    
    // Valid responses
    expect(validatePHQ2Responses([0, 3]).valid).toBe(true);
  });

  it('should validate calculated score is within valid range (0-6)', () => {
    // Test all valid score combinations
    const validCombinations = [
      [0, 0], [0, 1], [0, 2], [0, 3],
      [1, 0], [1, 1], [1, 2], [1, 3],
      [2, 0], [2, 1], [2, 2], [2, 3],
      [3, 0], [3, 1], [3, 2], [3, 3],
    ];
    
    for (const responses of validCombinations) {
      const validation = validatePHQ2Responses(responses);
      const score = calculatePHQ2Score(responses);
      
      expect(validation.valid).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(6);
    }
  });

  it('should return specific validation errors', () => {
    // Array length error
    const lengthError = validatePHQ2Responses([1]);
    expect(lengthError.valid).toBe(false);
    expect(lengthError.error).toBe('PHQ-2 requires exactly 2 responses');
    
    // Response value error with position
    const valueError = validatePHQ2Responses([1, 5]);
    expect(valueError.valid).toBe(false);
    expect(valueError.error).toBe('Response 2 must be an integer between 0 and 3');
    
    // Score range error
    // Note: This is theoretically impossible with valid individual responses,
    // but the validation checks it anyway for robustness
  });
});

describe('PHQ-9 Validation Integration', () => {
  it('should validate response array length', () => {
    // Too few responses
    expect(validatePHQ9Responses([1, 2, 3]).valid).toBe(false);
    expect(validatePHQ9Responses([1, 2, 3]).error).toBe('PHQ-9 requires exactly 9 responses');
    
    // Too many responses
    expect(validatePHQ9Responses([1, 2, 3, 0, 1, 2, 3, 0, 1, 2]).valid).toBe(false);
    expect(validatePHQ9Responses([1, 2, 3, 0, 1, 2, 3, 0, 1, 2]).error).toBe('PHQ-9 requires exactly 9 responses');
    
    // Correct length
    expect(validatePHQ9Responses([0, 0, 0, 0, 0, 0, 0, 0, 0]).valid).toBe(true);
  });

  it('should validate each response is integer between 0-3', () => {
    // Negative value
    expect(validatePHQ9Responses([-1, 0, 0, 0, 0, 0, 0, 0, 0]).valid).toBe(false);
    expect(validatePHQ9Responses([-1, 0, 0, 0, 0, 0, 0, 0, 0]).error).toContain('must be an integer between 0 and 3');
    
    // Value > 3
    expect(validatePHQ9Responses([0, 0, 0, 0, 5, 0, 0, 0, 0]).valid).toBe(false);
    expect(validatePHQ9Responses([0, 0, 0, 0, 5, 0, 0, 0, 0]).error).toContain('must be an integer between 0 and 3');
    
    // Non-integer
    expect(validatePHQ9Responses([0, 0, 0, 0, 0, 0, 0, 0, 2.5]).valid).toBe(false);
    expect(validatePHQ9Responses([0, 0, 0, 0, 0, 0, 0, 0, 2.5]).error).toContain('must be an integer between 0 and 3');
    
    // Valid responses
    expect(validatePHQ9Responses([0, 1, 2, 3, 0, 1, 2, 3, 1]).valid).toBe(true);
  });

  it('should validate calculated score is within valid range (0-27)', () => {
    // Test boundary scores
    const minScore = validatePHQ9Responses([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(minScore.valid).toBe(true);
    expect(calculatePHQ9Score([0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    
    const maxScore = validatePHQ9Responses([3, 3, 3, 3, 3, 3, 3, 3, 3]);
    expect(maxScore.valid).toBe(true);
    expect(calculatePHQ9Score([3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(27);
    
    // Test mid-range score
    const midScore = validatePHQ9Responses([1, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(midScore.valid).toBe(true);
    expect(calculatePHQ9Score([1, 1, 1, 1, 1, 1, 1, 1, 1])).toBe(9);
  });

  it('should return specific validation errors', () => {
    // Array length error
    const lengthError = validatePHQ9Responses([1, 2]);
    expect(lengthError.valid).toBe(false);
    expect(lengthError.error).toBe('PHQ-9 requires exactly 9 responses');
    
    // Response value error with position
    const valueError = validatePHQ9Responses([0, 0, 0, 0, 0, 0, 0, 0, 10]);
    expect(valueError.valid).toBe(false);
    expect(valueError.error).toBe('Response 9 must be an integer between 0 and 3');
  });
});
