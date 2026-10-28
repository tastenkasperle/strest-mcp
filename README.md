# ⚡ Strest MCP (Strest Orchestrator)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Glama Score](https://glama.ai/mcp/servers/tastenkasperle/strest-mcp/badges/score.svg)](https://glama.ai/mcp/servers/tastenkasperle/strest-mcp)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![Tests](https://img.shields.io/badge/Tests-3%2F3%20Passed-brightgreen.svg)](tests/)
[![Security Guard](https://img.shields.io/badge/Security-Raptor_Guard_Hardened-orange.svg)](src/core/guard.mjs)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-blue.svg)](package.json)

> **Headless Declarative Multi-Step REST API Test & Chaining Engine for Autonomous AI Agents and DevSecOps.**  
> *Execute complex, multi-stage API workflows (Auth ➔ Token Extraction ➔ Resource Creation ➔ Assertions) in a single deterministic MCP tool call.*

---

## 💡 The Problem

Autonomous AI agents (Claude Code, Cursor, Antigravity, AutoGen, CrewAI) and CI pipelines frequently need to interact with multi-step REST APIs.  
When executing chained requests step-by-step with individual `curl` commands:

1. **Context Window Waste & Token Bloat:** Passing whole JSON payloads back and forth across multiple LLM turns wastes hundreds of tokens.
2. **Fragile State Propagation:** Extracting tokens, session IDs, and foreign keys across separate prompts introduces hallucinations and state loss.
3. **SSRF & Security Hazards:** AI agents given raw network access can be coerced into probing internal cloud metadata endpoints (`169.254.169.254`).

**Strest MCP solves this:** You pass a declarative multi-step scenario definition to the engine. It executes all steps sequentially with in-memory variable chaining, enforces strict assertions, applies active SSRF defense, and returns a clean, structured execution report in a single round-trip.

---

## ⚡ Key Capabilities

* 🔗 **Declarative Multi-Step Chaining:** Chain outputs from previous steps into downstream headers, query params, or JSON bodies using `<$ steps.<step_name>.body.<property> $>`.
* 🛡️ **Built-in SSRF & Cloud Metadata Shield:** Proactively blocks attacks against AWS/GCP/Azure instance metadata endpoints (`169.254.169.254`, `metadata.google.internal`), local loopbacks, and dangerous protocols (`file://`, `ftp://`).
* 🪶 **Zero External Dependencies:** Built entirely with native Node.js 20+ `fetch`, keeping the package footprint lightweight and lightning-fast.
* 🤖 **Model Context Protocol (MCP) Native:** Integrates seamlessly via stdio JSON-RPC 2.0 with Claude Desktop, Cursor, Antigravity, and any MCP-compliant client.
* 🎯 **Rich Assertions:** Status code validation, regex header checks, deep JSON body assertions, and timing thresholds.

---

## 🤖 Model Context Protocol (MCP) Setup

### Add to Claude Desktop / Cursor / Antigravity

Add the following to your `claude_desktop_config.json` or MCP settings:

```json
{
  "mcpServers": {
    "strest-mcp": {
      "command": "npx",
      "args": ["-y", "strest-mcp"]
    }
  }
}
```

Or run directly from a local clone:

```json
{
  "mcpServers": {
    "strest-mcp": {
      "command": "node",
      "args": ["/path/to/strest_orchestrator/src/mcp/server.mjs"]
    }
  }
}
```

### Available MCP Tools

| Tool | Description | Input Parameters |
| :--- | :--- | :--- |
| `strest_run_scenario` | Executes a declarative multi-step REST API workflow scenario with automatic variable chaining and schema assertions. | `scenario` (object) OR `scenarioPath` (string) |
| `strest_template` | Generates a ready-to-use template for multi-step authentication and CRUD chaining. | `baseUrl` (optional string, e.g. `http://localhost:5000`) |

---

## 💻 CLI Usage

You can also run Strest Orchestrator as a standalone CLI tool:

```bash
# Display help and usage
npx strest help

# Run an API workflow scenario from a JSON file
npx strest run scenarios/auth_and_crud.json

# Generate a starter template
npx strest template > scenario.json
```

---

## 📋 Scenario Example (Chaining in Action)

```json
{
  "name": "Auth and User Project Creation",
  "steps": [
    {
      "name": "login",
      "url": "https://api.example.com/v1/auth/login",
      "method": "POST",
      "headers": { "Content-Type": "application/json" },
      "body": { "username": "admin", "password": "SuperSecretPassword" },
      "assert": {
        "status": 200,
        "body": { "token": "defined" }
      }
    },
    {
      "name": "create_project",
      "url": "https://api.example.com/v1/projects",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <$ steps.login.body.token $>"
      },
      "body": {
        "title": "Autonomous Agent Workspace",
        "requestId": "<$ faker.uuid $>"
      },
      "assert": {
        "status": 201,
        "body": { "id": "defined" }
      }
    }
  ]
}
```

---

## 🛡️ Security & Hardening (Raptor Guard v2.0)

* **SSRF Prevention:** Blocks requests to IPv4/IPv6 link-local addresses, link-local multicast, and known cloud metadata IP ranges (`169.254.169.254`, `100.100.100.200`).
* **Path Traversal Shield:** Resolves and validates scenario file paths against path traversal sequences (`../`, null bytes, system files).
* **Hermetic Execution:** 100% offline self-testing suite with embedded ephemeral mock servers.

---

## 📜 Origin & Credits

* Based on the concept of [`eykrehbein/strest`](https://github.com/eykrehbein/strest) (1.7k+ ⭐, MIT).
* Modernized, decoupled, SSRF-hardened, and transformed into an autonomous Model Context Protocol server by Christopher Hailfinger ([@tastenkasperle](https://github.com/tastenkasperle)) as part of the **Diamantenschmiede** initiative.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
