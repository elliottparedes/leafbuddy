# syntax=docker/dockerfile:1

# ==========================================
# Build stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci

# Copy the rest of the source
COPY . .

# Build the SvelteKit app with adapter-node
RUN npm run build

# ==========================================
# Production runtime stage
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy only what we need from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Expose the port the app runs on
EXPOSE 3000

# Healthcheck (optional but useful for orchestration)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the server
CMD ["node", "build"]
