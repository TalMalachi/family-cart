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

# ─── Stage 2: production image ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

# Copy deps
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy source (tsx runs TS directly — no build step needed)
COPY --chown=appuser:appgroup package.json ./
COPY --chown=appuser:appgroup packages/shared/ ./packages/shared/
COPY --chown=appuser:appgroup apps/api/ ./apps/api/

# Copy DB scripts for the init entrypoint
COPY --chown=appuser:appgroup scripts/ ./scripts/

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["./node_modules/.bin/tsx", "apps/api/src/index.ts"]