/**
 * Assessment utility functions for PHQ-2 and PHQ-9 questionnaires
 * Provides scoring, validation, and workflow logic
 */

/**
 * Calculate PHQ-2 total score by summing 2 responses
 * @param responses - Array of 2 integers (0-3 each)
 * @returns Total score (0-6)
 */
export function calculatePHQ2Score(responses: number[]): number {
  return responses.reduce((sum, response) => sum + response, 0);
}

/**
 * Calculate PHQ-9 total score by summing 9 responses
 * @param responses - Array of 9 integers (0-3 each)
 * @returns Total score (0-27)
 */
export function calculatePHQ9Score(responses: number[]): number {
  return responses.reduce((sum, response) => sum + response, 0);
}

/**
 * Validate PHQ-2 responses
 * @param responses - Array of responses to validate
 * @returns Validation result with error message if invalid
 */
export function validatePHQ2Responses(responses: number[]): {
  valid: boolean;
  error?: string;
} {
  // Check if exactly 2 responses
  if (responses.length !== 2) {
    return {
      valid: false,
      error: 'PHQ-2 requires exactly 2 responses',
    };
  }

  // Check if all responses are integers between 0 and 3
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!Number.isInteger(response) || response < 0 || response > 3) {
      return {
        valid: false,
        error: `Response ${i + 1} must be an integer between 0 and 3`,
      };
    }
  }

  // Validate calculated score is in valid range
  const score = calculatePHQ2Score(responses);
  if (score < 0 || score > 6) {
    return {
      valid: false,
      error: 'PHQ-2 total score must be between 0 and 6',
    };
  }

  return { valid: true };
}

/**
 * Validate PHQ-9 responses
 * @param responses - Array of responses to validate
 * @returns Validation result with error message if invalid
 */
export function validatePHQ9Responses(responses: number[]): {
  valid: boolean;
  error?: string;
} {
  // Check if exactly 9 responses
  if (responses.length !== 9) {
    return {
      valid: false,
      error: 'PHQ-9 requires exactly 9 responses',
    };
  }

  // Check if all responses are integers between 0 and 3
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!Number.isInteger(response) || response < 0 || response > 3) {
      return {
        valid: false,
        error: `Response ${i + 1} must be an integer between 0 and 3`,
      };
    }
  }

  // Validate calculated score is in valid range
  const score = calculatePHQ9Score(responses);
  if (score < 0 || score > 27) {
    return {
      valid: false,
      error: 'PHQ-9 total score must be between 0 and 27',
    };
  }

  return { valid: true };
}

/**
 * Determine if PHQ-9 assessment is required based on PHQ-2 score
 * @param phq2Score - PHQ-2 total score (0-6)
 * @returns true if score >= 3, false otherwise
 */
export function requiresPHQ9(phq2Score: number): boolean {
  return phq2Score >= 3;
}
