/**
 * Master Test Runner (Strest Orchestrator – Gang 1, 2 & 3)
 */

import { execSync } from 'child_process';

const tests = [
  'tests/test_interpolation.mjs',
  'tests/test_e2e_chaining.mjs',
  'tests/test_security_mcp.mjs'
];

console.log('🚀 Starte Strest Orchestrator Master Test Runner...\n');

for (const t of tests) {
  console.log(`▶ Führe aus: ${t}`);
  execSync(`node ${t}`, { stdio: 'inherit' });
  console.log('');
}

console.log('🎉 ALLE STREST TEST-SUITEN ZU 100% BESTANDEN (GRÜN)!');
