# ⚡ Strest Orchestrator (strest-mcp)

> **Headless Declarative Multi-Step REST Test & Chaining Engine.**  
> *Teil der Diamantenschmiede – Veredelt nach dem AYA-Protokoll v1.0.*

---

## 💡 Warum existiert dieses Tool?
KI-Agenten (wie das Wolfsrudel oder Fire Team Elite) müssen APIs testen und automatisieren.
Einzelne `curl`-Aufrufe scheitern regelmäßig an komplexen Ketten:
- Schritt 1: Login via POST `/api/v1/auth` -> Token im Response.
- Schritt 2: GET `/api/v1/users/me` mit `Authorization: Bearer <$ steps.login.token $>`.
- Schritt 3: POST `/api/v1/projects` mit der erhaltenen User-ID.

Strest Orchestrator führt solche mehrstufigen Ketten **vollständig deterministisch in einem Rutsch** aus, validiert alle Schemas und liefert strukturierte Ergebnisse zurück.

---

## 🚀 Schnelleinstieg
```bash
# Szenario ausführen
node src/cli/index.mjs run scenario.yml

# Als lokaler MCP-Server für Agenten starten
node src/mcp/server.mjs
```
