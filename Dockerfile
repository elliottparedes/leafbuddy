# syntax=docker/dockerfile:1

# Multi-stage build modeled after Inkstream (proven with Coolify)
FROM node:20-alpine AS builder
WORKDIR /app

# Copy lockfiles first for layer caching
COPY package.json package-lock.json ./

# Install all deps (including dev for build)
RUN npm ci

# Copy source
COPY . .

# Production build (PWA plugin etc. need this)
ENV NODE_ENV=production
RUN npm run build && npm prune --omit=dev

# ==========================================
# Runtime image (no second npm ci — use pruned node_modules from builder)
# ==========================================
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only what's needed
COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build"]
