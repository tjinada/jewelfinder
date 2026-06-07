# =============================================================================
# The Clasp — Admin Analytics (standalone, read-only)
# =============================================================================
# Single dependency (mongodb). Native Node http server, no framework.
FROM node:20-alpine

WORKDIR /app

# Install production deps only. (No lockfile by design — single pinned dep.)
COPY package.json ./
RUN npm install --omit=dev

# App source
COPY server.mjs ./
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Drop root.
USER node

CMD ["node", "server.mjs"]
