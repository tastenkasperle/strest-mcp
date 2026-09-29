/**
 * Test Suite: Multi-Step Chaining E2E Execution (Gang 2)
 * Part of Diamantenschmiede (AYA Protocol)
 */

import assert from 'assert';
import http from 'http';
import { executeScenario } from '../src/core/executor.mjs';

async function runTest() {
  console.log('🧪 [GANG 2 TEST] Starte Mock HTTP Server & E2E Multi-Step Chaining...');

  // Start local ephemeral mock API server
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      // Endpoint 1: /api/login
      if (req.method === 'POST' && req.url === '/api/login') {
        const parsed = JSON.parse(body);
        if (parsed.username === 'admin' && parsed.password === 'secret123') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ token: 'sess_jwt_998877', role: 'admin' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
        }
        return;
      }

      // Endpoint 2: /api/profile
      if (req.method === 'GET' && req.url === '/api/profile') {
        const auth = req.headers['authorization'];
        if (auth === 'Bearer sess_jwt_998877') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ userId: 'u_12345', email: 'admin@company.local' }));
        } else {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden' }));
        }
        return;
      }

      // Endpoint 3: /api/projects
      if (req.method === 'POST' && req.url === '/api/projects') {
        const auth = req.headers['authorization'];
        const parsed = JSON.parse(body);
        if (auth === 'Bearer sess_jwt_998877' && parsed.ownerId === 'u_12345') {
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ projectId: 'proj_999', name: parsed.name, status: 'created' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid project payload' }));
        }
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    });
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Define 3-step chaining scenario
    const scenario = {
      name: 'Auth -> Profile -> Create Project Chain',
      steps: [
        {
          name: 'login',
          url: `${baseUrl}/api/login`,
          method: 'POST',
          body: { username: 'admin', password: 'secret123' },
          assert: {
            status: 200,
            body: { token: 'defined', role: 'admin' }
          }
        },
        {
          name: 'get_profile',
          url: `${baseUrl}/api/profile`,
          method: 'GET',
          headers: {
            authorization: 'Bearer <$ steps.login.body.token $>'
          },
          assert: {
            status: 200,
            body: { userId: 'u_12345' }
          }
        },
        {
          name: 'create_project',
          url: `${baseUrl}/api/projects`,
          method: 'POST',
          headers: {
            authorization: 'Bearer <$ steps.login.body.token $>'
          },
          body: {
            name: 'Diamantenschmiede Alpha',
            ownerId: '<$ steps.get_profile.body.userId $>'
          },
          assert: {
            status: 201,
            body: { projectId: 'proj_999', status: 'created' }
          }
        }
      ]
    };

    const result = await executeScenario(scenario);

    assert.strictEqual(result.success, true, 'Szenario muss erfolgreich durchlaufen');
    assert.strictEqual(result.totalSteps, 3, 'Alle 3 Schritte deklariert');
    assert.strictEqual(result.executedSteps, 3, 'Alle 3 Schritte ausgeführt');

    // Step 1 token in Step 2 verified
    assert.strictEqual(result.steps[1].request.headers.authorization, 'Bearer sess_jwt_998877');
    // Step 2 userId in Step 3 verified
    assert.strictEqual(result.steps[2].request.body.ownerId, 'u_12345');

    console.log('✅ [GANG 2 TEST BESTANDEN] 3-stufige Auth->Profile->Project Kette erfolgreich determiniert ausgeführt!');
  } finally {
    server.close();
  }
}

runTest().catch((err) => {
  console.error('❌ [TEST FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
