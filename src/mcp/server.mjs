#!/usr/bin/env node
/**
 * Strest MCP Server (Model Context Protocol)
 * Native Stdio JSON-RPC 2.0 Server for Local AI Agents
 * Part of Diamantenschmiede (AYA Protocol / Gang 3)
 */

import readline from 'readline';
import fs from 'fs';
import { executeScenario } from '../core/executor.mjs';
import { SecurityGuard } from '../core/guard.mjs';

const SERVER_NAME = 'strest-mcp';
const SERVER_VERSION = '1.0.0';

const TOOLS = [
  {
    name: 'strest_run_scenario',
    description: 'Executes a declarative multi-step REST API workflow scenario with automatic variable chaining and schema assertions.',
    inputSchema: {
      type: 'object',
      properties: {
        scenario: {
          type: 'object',
          description: 'The scenario definition object containing steps and assertions'
        },
        scenarioPath: {
          type: 'string',
          description: 'Path to a scenario JSON file on disk'
        }
      }
    }
  },
  {
    name: 'strest_template',
    description: 'Generates a ready-to-use template for multi-step authentication and CRUD chaining.',
    inputSchema: {
      type: 'object',
      properties: {
        baseUrl: { type: 'string', description: 'Base URL for the scenario (e.g. http://localhost:5000)' }
      }
    }
  }
];

export async function handleRequest(request) {
  const { id, method, params } = request;

  if (
    method === 'notifications/initialized' ||
    method === 'initialized' ||
    (typeof method === 'string' && method.startsWith('notifications/')) ||
    id === undefined
  ) {
    return null;
  }

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
      }
    };
  }

  if (method === 'ping') {
    return {
      jsonrpc: '2.0',
      id,
      result: {}
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params;

    try {
      if (name === 'strest_run_scenario') {
        let scenarioObj;
        if (args.scenario) {
          scenarioObj = args.scenario;
        } else if (args.scenarioPath) {
          const safePath = SecurityGuard.validateSafePath(args.scenarioPath);
          scenarioObj = JSON.parse(fs.readFileSync(safePath, 'utf-8'));
        } else {
          throw new Error('Either scenario object or scenarioPath must be provided');
        }

        const result = await executeScenario(scenarioObj);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          }
        };
      }

      if (name === 'strest_template') {
        const base = args.baseUrl || 'http://127.0.0.1:5000';
        const template = {
          name: "Generated Multi-Step Scenario",
          steps: [
            {
              name: "auth_step",
              url: `${base}/api/auth/login`,
              method: "POST",
              body: { username: "admin", password: "password123" },
              assert: { status: 200, body: { token: "defined" } }
            },
            {
              name: "query_step",
              url: `${base}/api/data`,
              method: "GET",
              headers: { authorization: "Bearer <$ steps.auth_step.body.token $>" },
              assert: { status: 200 }
            }
          ]
        };
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(template, null, 2)
            }]
          }
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

if (process.argv[1] && process.argv[1].endsWith('server.mjs')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
      const request = JSON.parse(line);
      const response = await handleRequest(request);
      if (response !== null && response !== undefined) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (err) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: ' + err.message }
      }) + '\n');
    }
  });
}
