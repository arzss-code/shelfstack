# ==============================================================================
# Stage 1: Base Runtime with Corepack & PNPM
# ==============================================================================
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# ==============================================================================
# Stage 2: Workspace Dependencies Resolution
# ==============================================================================
FROM base AS dependencies

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/order-service/package.json ./services/order-service/

RUN pnpm install --frozen-lockfile

# ==============================================================================
# Stage 3: Nuxt Production Build
# ==============================================================================
FROM base AS builder

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/services/order-service/node_modules ./services/order-service/node_modules
COPY . .

# Build standalone standalone Nitro/Nuxt bundle
RUN pnpm build

# ==============================================================================
# Stage 4: Production Runner (Lean Image < 150MB, Non-Root User)
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy only the standalone self-contained Nitro output
COPY --from=builder --chown=node:node /app/.output ./.output

USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
