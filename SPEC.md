# 📋 SPECIFICATION: Strest Orchestrator (strest-mcp)
**Projekt:** Strest Orchestrator (Modern Headless API Test & Chaining Engine)  
**Status:** In Entwicklung (Gang 1)  
**Standard:** Diamantenschmiede AYA-Protokoll v1.0  
**Standort:** `C:\Users\UserS2025\Desktop\Development\diamantenschmiede\strest_orchestrator`  
**Referenz:** [`eykrehbein/strest`](https://github.com/eykrehbein/strest) (1.720 ⭐, MIT)

---

## 1. Executive Summary
Strest Orchestrator ist eine headless, deklarative Multi-Step HTTP/REST-Workflow-Engine für autonome KI-Agenten und DevSecOps-Pipelines. Sie löst das Problem, dass KI-Agenten und Entwickler komplexe mehrstufige API-Interaktionen (z. B. Auth -> Bearer Token extrahieren -> Ressource anlegen -> ID in Folgerequest injecten -> Assertions prüfen) bisher mit fehleranfälligen Einzelschritten ausführen mussten.

Strest erlaubt es, vollständige Szenarien als YAML/JSON zu definieren und in einem einzigen deterministischen Aufruf auszuführen.

---

## 2. Kern-Architektur

```
+-------------------------------------------------------------------------+
|                           Strest Orchestrator                           |
|                                                                         |
|  +--------------------+    +--------------------+    +----------------+ |
|  | YAML / JSON Scenario|-->| Template Evaluator |-->| Native Fetch   | |
|  | Parser             |    | (Chaining / Env)   |    | Dispatcher     | |
|  +--------------------+    +--------------------+    +----------------+ |
|                                                              |          |
|                                                              v          |
|  +--------------------+    +--------------------+    +----------------+ |
|  | MCP Server         |<---| Security Guard v2  |<---| Assertion      | |
|  | (Stdio Agent API)  |    | (SSRF & Safe URL)  |    | Validator      | |
|  +--------------------+    +--------------------+    +----------------+ |
+-------------------------------------------------------------------------+
```

### Module:
1. `src/core/interpolator.mjs`: Data-Chaining Engine (`<$ steps.login.token $>`, `<$ env.API_KEY $>`, `<$ faker.uuid $>`).
2. `src/core/executor.mjs`: Headless Runner mit nativer Node `fetch`-Engine, Timeout-Schutz und Retry-Mechanik.
3. `src/core/assert.mjs`: Schema- & Status-Validierung (Statuscodes, Header, JSON-Pfad-Vergleiche).
4. `src/core/guard.mjs`: SSRF- & Input-Shield (Verhindert Exfiltration interner Metadaten-Endpunkte wie `169.254.169.254`).
5. `src/cli/index.mjs`: Standalone CLI (`run`, `validate`, `template`).
6. `src/mcp/server.mjs`: Stdio-MCP-Server mit Tools (`run_api_scenario`, `generate_api_template`).
