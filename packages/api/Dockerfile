# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files
COPY packages/api/package.json ./packages/api/
COPY packages/model-briaai/package.json ./packages/model-briaai/
COPY packages/model-modnet/package.json ./packages/model-modnet/
COPY packages/model-u2netp/package.json ./packages/model-u2netp/
COPY packages/model-isnet-anime/package.json ./packages/model-isnet-anime/
COPY packages/model-silueta/package.json ./packages/model-silueta/
COPY packages/model-u2net-cloth/package.json ./packages/model-u2net-cloth/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/api ./packages/api
COPY packages/model-briaai ./packages/model-briaai
COPY packages/model-modnet ./packages/model-modnet
COPY packages/model-u2netp ./packages/model-u2netp
COPY packages/model-isnet-anime ./packages/model-isnet-anime
COPY packages/model-silueta ./packages/model-silueta
COPY packages/model-u2net-cloth ./packages/model-u2net-cloth

# Build the API package
RUN pnpm --filter @rmbg/api build

# Production stage
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install build dependencies for sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files
COPY packages/api/package.json ./packages/api/
COPY packages/model-briaai/package.json ./packages/model-briaai/
COPY packages/model-modnet/package.json ./packages/model-modnet/
COPY packages/model-u2netp/package.json ./packages/model-u2netp/
COPY packages/model-isnet-anime/package.json ./packages/model-isnet-anime/
COPY packages/model-silueta/package.json ./packages/model-silueta/
COPY packages/model-u2net-cloth/package.json ./packages/model-u2net-cloth/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/packages/api/lib ./packages/api/lib

# Copy model files
COPY packages/model-briaai ./packages/model-briaai
COPY packages/model-modnet ./packages/model-modnet
COPY packages/model-u2netp ./packages/model-u2netp
COPY packages/model-isnet-anime ./packages/model-isnet-anime
COPY packages/model-silueta ./packages/model-silueta
COPY packages/model-u2net-cloth ./packages/model-u2net-cloth

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "packages/api/lib/server.js"]