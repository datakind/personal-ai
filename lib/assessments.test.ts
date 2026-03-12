import { describe, it, expect } from 'vitest';
import {
  calculatePHQ2Score,
  calculatePHQ9Score,
  validatePHQ2Responses,
  validatePHQ9Responses,
  requiresPHQ9,
} from './assessments';

describe('calculatePHQ2Score', () => {
  it('should sum 2 responses correctly', () => {
    expect(calculatePHQ2Score([0, 0])).toBe(0);
    expect(calculatePHQ2Score([1, 2])).toBe(3);
    expect(calculatePHQ2Score([3, 3])).toBe(6);
  });

  it('should handle minimum score', () => {
    expect(calculatePHQ2Score([0, 0])).toBe(0);
  });

  it('should handle maximum score', () => {
    expect(calculatePHQ2Score([3, 3])).toBe(6);
  });
});

describe('calculatePHQ9Score', () => {
  it('should sum 9 responses correctly', () => {
    expect(calculatePHQ9Score([0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    expect(calculatePHQ9Score([1, 1, 1, 1, 1, 1, 1, 1, 1])).toBe(9);
    expect(calculatePHQ9Score([3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(27);
  });

  it('should handle mixed responses', () => {
    expect(calculatePHQ9Score([0, 1, 2, 3, 0, 1, 2, 3, 1])).toBe(13);
  });
});

describe('validatePHQ2Responses', () => {
  it('should validate correct PHQ-2 responses', () => {
    expect(validatePHQ2Responses([0, 0])).toEqual({ valid: true });
    expect(validatePHQ2Responses([1, 2])).toEqual({ valid: true });
    expect(validatePHQ2Responses([3, 3])).toEqual({ valid: true });
  });

  it('should reject responses with wrong length', () => {
    const result = validatePHQ2Responses([1]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('PHQ-2 requires exactly 2 responses');
  });

  it('should reject responses with too many items', () => {
    const result = validatePHQ2Responses([1, 2, 3]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('PHQ-2 requires exactly 2 responses');
  });

  it('should reject responses outside 0-3 range', () => {
    const result = validatePHQ2Responses([1, 4]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be an integer between 0 and 3');
  });

  it('should reject negative responses', () => {
    const result = validatePHQ2Responses([-1, 2]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be an integer between 0 and 3');
  });

  it('should reject non-integer responses', () => {
    const result = validatePHQ2Responses([1.5, 2]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be an integer between 0 and 3');
  });
});

describe('validatePHQ9Responses', () => {
  it('should validate correct PHQ-9 responses', () => {
    expect(validatePHQ9Responses([0, 0, 0, 0, 0, 0, 0, 0, 0])).toEqual({
      valid: true,
    });
    expect(validatePHQ9Responses([1, 2, 3, 0, 1, 2, 3, 0, 1])).toEqual({
      valid: true,
    });
  });

  it('should reject responses with wrong length', () => {
    const result = validatePHQ9Responses([1, 2, 3]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('PHQ-9 requires exactly 9 responses');
  });

  it('should reject responses with too many items', () => {
    const result = validatePHQ9Responses([1, 2, 3, 0, 1, 2, 3, 0, 1, 2]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('PHQ-9 requires exactly 9 responses');
  });

  it('should reject responses outside 0-3 range', () => {
    const result = validatePHQ9Responses([1, 2, 3, 0, 1, 2, 3, 0, 5]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be an integer between 0 and 3');
  });

  it('should reject negative responses', () => {
    const result = validatePHQ9Responses([1, 2, 3, 0, 1, 2, 3, 0, -1]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be an integer between 0 and 3');
  });

  it('should reject non-integer responses', () => {
    const result = validatePHQ9Responses([1, 2, 3, 0, 1, 2, 3, 0, 2.5]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be an integer between 0 and 3');
  });
});

describe('requiresPHQ9', () => {
  it('should return false for scores below 3', () => {
    expect(requiresPHQ9(0)).toBe(false);
    expect(requiresPHQ9(1)).toBe(false);
    expect(requiresPHQ9(2)).toBe(false);
  });

  it('should return true for scores at or above 3', () => {
    expect(requiresPHQ9(3)).toBe(true);
    expect(requiresPHQ9(4)).toBe(true);
    expect(requiresPHQ9(5)).toBe(true);
    expect(requiresPHQ9(6)).toBe(true);
  });
});
