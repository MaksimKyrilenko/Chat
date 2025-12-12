# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/database/tsconfig.json ./packages/database/
COPY apps/services/messages/package.json ./apps/services/messages/

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/services/messages ./apps/services/messages

# Build
RUN pnpm --filter @ultrachat/shared build
RUN pnpm --filter @ultrachat/database build
RUN pnpm --filter @ultrachat/messages-service build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy package files for production install
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/services/messages/package.json ./apps/services/messages/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/database/package.json ./packages/database/

# Install pnpm and production dependencies
RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile

# Copy built files
COPY --from=builder /app/apps/services/messages/dist ./apps/services/messages/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist

WORKDIR /app/apps/services/messages

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

CMD ["node", "dist/main.js"]
