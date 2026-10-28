/**
 * Test Suite: Strest Security, SSRF & MCP Pen-Test (Gang 3)
 * Part of Diamantenschmiede (AYA Protocol / Fire Team Elite Certified)
 */

import assert from 'assert';
import {
  SecurityGuard,
  handleRequest,
  executeScenario,
  interpolate,
  interpolateDeep,
  assertResponse,
  validateAssertions,
  getByPath
} from '../src/index.mjs';

async function runTest() {
  console.log('🧪 [GANG 3 TEST] Starte SSRF-Defense & MCP Server Test Suite...');

  // 1. SSRF Cloud Metadata Defense
  const maliciousUrls = [
    'http://169.254.169.254/latest/meta-data/',
    'http://metadata.google.internal/computeMetadata/v1/',
    'http://100.100.100.200/latest/meta-data/',
    'ftp://example.com/test',
    'file:///etc/passwd'
  ];

  for (const url of maliciousUrls) {
    assert.throws(
      () => SecurityGuard.validateUrl(url),
      /Security Violation/,
      `Muss böswillige URL/Protokoll blockieren: ${url}`
    );
  }

  // 2. Path Traversal & Credential Leakage Defense
  const maliciousPaths = [
    '../../.env',
    'subdir/../id_rsa',
    'credentials.csv\0.json',
    '../../package.json',
    '../../../../Windows/win.ini'
  ];

  for (const p of maliciousPaths) {
    assert.throws(
      () => SecurityGuard.validateSafePath(p),
      /Security Violation/,
      `Muss Pfad-Angriff blockieren: ${p}`
    );
  }

  // 2b. Prototype Pollution & Re-Export Integrity
  assert.strictEqual(typeof executeScenario, 'function');
  assert.strictEqual(interpolate, interpolateDeep);
  assert.strictEqual(assertResponse, validateAssertions);
  assert.strictEqual(getByPath({ a: 1 }, '__proto__.polluted'), undefined);
  assert.strictEqual(getByPath({ a: 1 }, 'constructor.prototype'), undefined);

  // 3. MCP Handshake, Notification & Tool Listing
  const notifRes = await handleRequest({
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  });
  assert.strictEqual(notifRes, null);
  const initRes = await handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {}
  });
  assert.strictEqual(initRes.result.serverInfo.name, 'strest-mcp');

  const pingRes = await handleRequest({
    jsonrpc: '2.0',
    id: 11,
    method: 'ping',
    params: {}
  });
  assert.deepStrictEqual(pingRes.result, {});

  const toolsRes = await handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  });
  assert.strictEqual(toolsRes.result.tools.length, 2);

  // 4. MCP Template Generation
  const tplRes = await handleRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'strest_template',
      arguments: { baseUrl: 'http://127.0.0.1:8080' }
    }
  });
  assert.strictEqual(tplRes.result.content[0].text.includes('auth_step'), true);

  // 5. MCP Traversal Attack Defense
  const attackRes = await handleRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'strest_run_scenario',
      arguments: { scenarioPath: '../../.env' }
    }
  });
  assert.strictEqual(attackRes.error !== undefined, true);
  assert.strictEqual(attackRes.error.message.includes('Security Violation'), true);

  console.log('✅ [GANG 3 TEST BESTANDEN] SSRF-Schutz & MCP Server Interface zu 100% grün!');
}

runTest().catch((err) => {
  console.error('❌ [TEST FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
