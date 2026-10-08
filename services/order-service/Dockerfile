# ==============================================================================
# Stage 1: Base Runtime with Corepack & PNPM
# ==============================================================================
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# ==============================================================================
# Stage 2: Dependencies & TypeScript Build
# ==============================================================================
FROM base AS builder

COPY package.json ./

RUN pnpm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN pnpm build

# ==============================================================================
# Stage 3: Lean Production Runner
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

# Install production dependencies only
COPY package.json ./
RUN corepack enable && pnpm install --prod

# Copy compiled JavaScript output
COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 4000

CMD ["node", "dist/server.js"]
