#!/usr/bin/env node
/**
 * Strest Standalone CLI Interface
 * Part of Diamantenschmiede (AYA Protocol)
 */

import fs from 'fs';
import { executeScenario } from '../core/executor.mjs';
import { SecurityGuard } from '../core/guard.mjs';

function printHelp() {
  console.log(`
⚡ Strest Orchestrator CLI – Headless Multi-Step REST Engine

VERWENDUNG:
  strest <command> [options]

BEFEHLE:
  run <scenario.json>      Führt ein mehrstufiges API-Szenario aus
                           Optionen: --bail (Stop bei erstem Fehler, Standard: true)

  template                 Gibt ein Beispiel-Szenario auf stdout aus

  help                     Zeigt diese Hilfe an
`);
}

async function handleRun(args) {
  const filePath = args[0];
  if (!filePath) {
    console.error('❌ Fehler: Bitte Pfad zur scenario.json angeben.');
    process.exit(1);
  }

  const safePath = SecurityGuard.validateSafePath(filePath);
  if (!fs.existsSync(safePath)) {
    console.error(`❌ Fehler: Datei nicht gefunden: ${safePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(safePath, 'utf-8');
  const scenario = JSON.parse(raw);

  console.log(`🚀 Führe Szenario aus: '${scenario.name || safePath}'...`);
  const result = await executeScenario(scenario);

  console.log('\n--- ERGEBNIS ---');
  console.log(`Status:        ${result.success ? '✅ ERFOLGREICH' : '❌ FEHLGESCHLAGEN'}`);
  console.log(`Schritte:      ${result.executedSteps} / ${result.totalSteps}`);
  console.log(`Dauer:         ${result.durationMs}ms\n`);

  for (const step of result.steps) {
    const symbol = step.success ? '✔' : '✖';
    console.log(`${symbol} [${step.request.method}] ${step.stepName} (${step.response?.status || 'ERR'} in ${step.response?.durationMs || 0}ms)`);
    if (!step.success && step.errors) {
      for (const err of step.errors) {
        console.log(`   └─ 🚨 ${err}`);
      }
    }
  }

  if (!result.success) {
    process.exit(1);
  }
}

function handleTemplate() {
  const template = {
    name: "Sample Multi-Step Flow",
    steps: [
      {
        name: "login",
        url: "http://localhost:3000/api/login",
        method: "POST",
        body: { username: "admin", password: "password" },
        assert: { status: 200, body: { token: "defined" } }
      },
      {
        name: "get_user",
        url: "http://localhost:3000/api/users/me",
        method: "GET",
        headers: { authorization: "Bearer <$ steps.login.body.token $>" },
        assert: { status: 200 }
      }
    ]
  };
  console.log(JSON.stringify(template, null, 2));
}

async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const args = argv.slice(1);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  switch (command) {
    case 'run':
      await handleRun(args);
      break;
    case 'template':
      handleTemplate();
      break;
    default:
      console.error(`❌ Unbekannter Befehl: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Fehler:', err.message);
  process.exit(1);
});
