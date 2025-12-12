# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/database/tsconfig.json ./packages/database/
COPY apps/services/auth/package.json ./apps/services/auth/

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/services/auth ./apps/services/auth

# Build
RUN pnpm --filter @ultrachat/shared build
RUN pnpm --filter @ultrachat/database build
RUN pnpm --filter @ultrachat/auth-service build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/apps/services/auth/dist ./dist
COPY --from=builder /app/apps/services/auth/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

CMD ["node", "dist/main.js"]
