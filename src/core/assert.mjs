/**
 * Strest Assertion Validator
 * Part of Diamantenschmiede (AYA Protocol)
 */

import { getByPath } from './interpolator.mjs';

/**
 * Validates step response against assertions
 * @param {Object} response { status: number, headers: {}, body: any }
 * @param {Object} assertions
 * @returns {{ passed: boolean, errors: string[] }}
 */
export function validateAssertions(response, assertions = {}) {
  const errors = [];

  // 1. Status Code Check
  if (assertions.status !== undefined) {
    if (response.status !== assertions.status) {
      errors.push(`Expected HTTP status ${assertions.status} but got ${response.status}`);
    }
  }

  // 2. Status Range Check (e.g. statusRange: [200, 299])
  if (Array.isArray(assertions.statusRange) && assertions.statusRange.length === 2) {
    const [min, max] = assertions.statusRange;
    if (response.status < min || response.status > max) {
      errors.push(`Status ${response.status} outside expected range [${min}, ${max}]`);
    }
  }

  // 3. Header Checks
  if (assertions.headers && typeof assertions.headers === 'object') {
    for (const [key, expectedVal] of Object.entries(assertions.headers)) {
      const actualVal = response.headers[key.toLowerCase()];
      if (actualVal === undefined) {
        errors.push(`Expected header '${key}' is missing`);
      } else if (expectedVal !== '*' && !String(actualVal).includes(String(expectedVal))) {
        errors.push(`Header '${key}' value '${actualVal}' does not match '${expectedVal}'`);
      }
    }
  }

  // 4. Body Property Assertions (e.g. body: { "token": "string", "user.id": 42 })
  if (assertions.body && typeof assertions.body === 'object') {
    for (const [propPath, expectedVal] of Object.entries(assertions.body)) {
      const actualVal = getByPath(response.body, propPath);

      if (expectedVal === 'defined') {
        if (actualVal === undefined || actualVal === null) {
          errors.push(`Body property '${propPath}' must be defined`);
        }
      } else if (expectedVal === 'string') {
        if (typeof actualVal !== 'string') {
          errors.push(`Body property '${propPath}' must be a string, got ${typeof actualVal}`);
        }
      } else if (expectedVal === 'number') {
        if (typeof actualVal !== 'number') {
          errors.push(`Body property '${propPath}' must be a number, got ${typeof actualVal}`);
        }
      } else if (actualVal !== expectedVal) {
        errors.push(`Body property '${propPath}' expected '${expectedVal}' but got '${actualVal}'`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors
  };
}
