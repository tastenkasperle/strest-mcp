/**
 * Strest Headless Execution Engine
 * Part of Diamantenschmiede (AYA Protocol)
 */

import { interpolateDeep } from './interpolator.mjs';
import { validateAssertions } from './assert.mjs';
import { SecurityGuard } from './guard.mjs';

/**
 * Executes a single HTTP step
 * @param {Object} stepDefinition 
 * @param {Object} context { steps: {}, env: {} }
 * @param {Object} options 
 * @returns {Promise<Object>} stepResult
 */
export async function executeStep(stepDefinition, context = {}, options = {}) {
  // 1. Interpolate request definition with accumulated context
  const step = interpolateDeep(stepDefinition, context);

  const url = step.url;
  const method = (step.method || 'GET').toUpperCase();
  const headers = step.headers || {};
  let body = step.body;

  // Validate URL with SSRF Guard
  SecurityGuard.validateUrl(url, { allowLocalhost: options.allowLocalhost ?? true });

  const fetchOptions = {
    method,
    headers: { ...headers }
  };

  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    if (typeof body === 'object') {
      fetchOptions.body = JSON.stringify(body);
      if (!fetchOptions.headers['content-type']) {
        fetchOptions.headers['content-type'] = 'application/json';
      }
    } else {
      fetchOptions.body = String(body);
    }
  }

  const startTime = Date.now();
  let response;
  let responseData;
  let parsedBody;

  try {
    response = await fetch(url, fetchOptions);
    const durationMs = Date.now() - startTime;

    const responseHeaders = {};
    for (const [k, v] of response.headers.entries()) {
      responseHeaders[k.toLowerCase()] = v;
    }

    const contentType = responseHeaders['content-type'] || '';
    if (contentType.includes('application/json')) {
      parsedBody = await response.json();
    } else {
      parsedBody = await response.text();
    }

    const responseObj = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: parsedBody,
      durationMs
    };

    // 2. Validate Assertions
    const assertionResult = validateAssertions(responseObj, step.assert || {});

    return {
      stepName: step.name || step.id || 'anonymous_step',
      success: assertionResult.passed,
      errors: assertionResult.errors,
      request: { method, url, headers: fetchOptions.headers, body },
      response: responseObj
    };
  } catch (err) {
    return {
      stepName: step.name || step.id || 'anonymous_step',
      success: false,
      errors: [err.message],
      request: { method, url, headers: fetchOptions.headers, body },
      response: null
    };
  }
}

/**
 * Executes a multi-step scenario
 * @param {Object} scenario { name: string, steps: Array<Object>, env: {} }
 * @param {Object} options 
 * @returns {Promise<Object>} scenarioResult
 */
export async function executeScenario(scenario, options = {}) {
  const steps = scenario.steps || [];
  const context = {
    steps: {},
    env: { ...(scenario.env || {}), ...(options.env || {}) }
  };

  const results = [];
  let scenarioSuccess = true;
  const startTime = Date.now();

  for (const stepDef of steps) {
    const stepResult = await executeStep(stepDef, context, options);
    results.push(stepResult);

    // Save step response into context for downstream steps
    const stepKey = stepDef.name || stepDef.id;
    if (stepKey) {
      context.steps[stepKey] = stepResult.response;
    }

    if (!stepResult.success) {
      scenarioSuccess = false;
      if (options.bail !== false) {
        // Stop execution on first failed step (bail mode)
        break;
      }
    }
  }

  return {
    scenarioName: scenario.name || 'Unnamed Scenario',
    success: scenarioSuccess,
    totalSteps: steps.length,
    executedSteps: results.length,
    durationMs: Date.now() - startTime,
    steps: results
  };
}
