FROM node:20-slim

WORKDIR /app

# Install ca-certificates and curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev || true

COPY src/ ./src/

ENV NODE_ENV=production

EXPOSE 8080

ENTRYPOINT ["node", "src/mcp/server.mjs"]
