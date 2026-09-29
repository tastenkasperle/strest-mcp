/**
 * Test Suite: Core Chaining & Interpolation (Gang 1)
 * Part of Diamantenschmiede (AYA Protocol)
 */

import assert from 'assert';
import { interpolateDeep, interpolateString, getByPath } from '../src/core/interpolator.mjs';
import { validateAssertions } from '../src/core/assert.mjs';

async function runTest() {
  console.log('🧪 [GANG 1 TEST] Starte Interpolator & Assertions Test Suite...');

  // 1. Path Resolution
  const sampleObj = {
    steps: {
      auth: {
        body: {
          token: 'jwt.sample.token.123',
          user: { id: 99, role: 'admin' }
        }
      }
    }
  };

  assert.strictEqual(getByPath(sampleObj, 'steps.auth.body.token'), 'jwt.sample.token.123');
  assert.strictEqual(getByPath(sampleObj, 'steps.auth.body.user.id'), 99);
  assert.strictEqual(getByPath(sampleObj, 'steps.nonexistent.val'), undefined);

  // 2. Interpolation
  const templateStr = 'Bearer <$ steps.auth.body.token $>';
  const interpolated = interpolateString(templateStr, sampleObj);
  assert.strictEqual(interpolated, 'Bearer jwt.sample.token.123');

  // Single exact match preserves non-string types
  const numberTpl = '<$ steps.auth.body.user.id $>';
  assert.strictEqual(interpolateString(numberTpl, sampleObj), 99);

  // 3. Deep Object Interpolation
  const rawPayload = {
    url: 'https://api.local/users/<$ steps.auth.body.user.id $>',
    headers: {
      authorization: 'Bearer <$ steps.auth.body.token $>'
    },
    body: {
      userId: '<$ steps.auth.body.user.id $>',
      generatedId: '<$ faker.uuid $>'
    }
  };

  const resolvedPayload = interpolateDeep(rawPayload, sampleObj);
  assert.strictEqual(resolvedPayload.url, 'https://api.local/users/99');
  assert.strictEqual(resolvedPayload.headers.authorization, 'Bearer jwt.sample.token.123');
  assert.strictEqual(resolvedPayload.body.userId, 99);
  assert.strictEqual(typeof resolvedPayload.body.generatedId, 'string');
  assert.strictEqual(resolvedPayload.body.generatedId.length, 36);

  // 4. Assertions Validation
  const sampleResponse = {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: {
      success: true,
      data: { id: 'usr-100', email: 'test@example.com' }
    }
  };

  const validAssertions = {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: {
      'success': true,
      'data.id': 'usr-100',
      'data.email': 'string'
    }
  };

  const passResult = validateAssertions(sampleResponse, validAssertions);
  assert.strictEqual(passResult.passed, true);
  assert.strictEqual(passResult.errors.length, 0);

  const failResult = validateAssertions(sampleResponse, { status: 201, body: { 'data.missing': 'defined' } });
  assert.strictEqual(failResult.passed, false);
  assert.strictEqual(failResult.errors.length, 2);

  console.log('✅ [GANG 1 TEST BESTANDEN] Data Chaining, Interpolation & Assertions funktionieren einwandfrei!');
}

runTest().catch((err) => {
  console.error('❌ [TEST FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
