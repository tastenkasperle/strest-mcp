/**
 * Strest Data Interpolator & Chaining Engine
 * Part of Diamantenschmiede (AYA Protocol)
 */

import crypto from 'crypto';

/**
 * Resolves dot-notated path in an object (e.g. "steps.login.body.token")
 * @param {Object} obj 
 * @param {string} path 
 * @returns {any}
 */
export function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Generates synthetic helper data
 */
export const SYNTHETIC_HELPERS = {
  uuid: () => crypto.randomUUID(),
  timestamp: () => Date.now(),
  isoDate: () => new Date().toISOString(),
  randomInt: (min = 1, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min
};

/**
 * Interpolates string with `<$ expression $>` patterns
 * @param {string} template 
 * @param {Object} context { steps: {}, env: {} }
 * @returns {any}
 */
export function interpolateString(template, context = {}) {
  if (typeof template !== 'string') return template;

  // Single exact match replacement (preserving numbers/objects/booleans)
  const singleMatch = template.match(/^<\$\s*([a-zA-Z0-9_.]+)\s*\$>$/);
  if (singleMatch) {
    const expr = singleMatch[1];
    return resolveExpression(expr, context);
  }

  // Multi-match substring replacement
  return template.replace(/<\$\s*([a-zA-Z0-9_.]+)\s*\$>/g, (_, expr) => {
    const val = resolveExpression(expr, context);
    return val !== undefined ? String(val) : '';
  });
}

/**
 * Resolves expression against context or helpers
 * @param {string} expr 
 * @param {Object} context 
 * @returns {any}
 */
function resolveExpression(expr, context) {
  if (expr.startsWith('faker.') || expr.startsWith('helper.')) {
    const helperName = expr.split('.')[1];
    if (SYNTHETIC_HELPERS[helperName]) {
      return SYNTHETIC_HELPERS[helperName]();
    }
  }

  if (expr.startsWith('env.')) {
    const envKey = expr.slice(4);
    return process.env[envKey] || context.env?.[envKey];
  }

  return getByPath(context, expr);
}

/**
 * Recursively interpolates objects, arrays, and strings
 * @param {any} target 
 * @param {Object} context 
 * @returns {any}
 */
export function interpolateDeep(target, context = {}) {
  if (typeof target === 'string') {
    return interpolateString(target, context);
  }

  if (Array.isArray(target)) {
    return target.map(item => interpolateDeep(item, context));
  }

  if (target !== null && typeof target === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(target)) {
      result[key] = interpolateDeep(value, context);
    }
    return result;
  }

  return target;
}
