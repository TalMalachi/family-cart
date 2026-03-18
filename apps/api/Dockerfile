# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy workspace manifests first (better layer caching)
COPY package.json yarn.lock* ./
COPY apps/api/package.json           ./apps/api/package.json
COPY packages/shared/package.json    ./packages/shared/package.json

# Install all workspace dependencies
RUN yarn config set nodeLinker node-modules \
  && yarn install --no-immutable

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare yarn@stable --activate

# Copy deps from previous stage
COPY --from=deps /app/node_modules         ./node_modules

# Copy source
COPY package.json yarn.lock* ./
COPY packages/shared/         ./packages/shared/
COPY apps/api/                ./apps/api/

# Build API directly using installed TypeScript to avoid lockfile-dependent Yarn workspace resolution.
WORKDIR /app
RUN ./node_modules/.bin/tsc -p apps/api/tsconfig.json

# ─── Stage 3: production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

# Copy only what's needed to run
COPY --from=builder --chown=appuser:appgroup /app/apps/api/dist         ./dist
COPY --from=builder --chown=appuser:appgroup /app/apps/api/package.json ./package.json
COPY --from=deps    --chown=appuser:appgroup /app/node_modules          ./node_modules

# Copy DB scripts for the init entrypoint
COPY --chown=appuser:appgroup scripts/ ./scripts/

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "dist/index.js"]
