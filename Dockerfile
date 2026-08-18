# =========================================================
# Stage 1: Build Stage (Node.js Alpine)
# =========================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code and configuration files
COPY . .

# Build production bundle with Vite & TypeScript
RUN npm run build

# =========================================================
# Stage 2: Production Lightweight Runtime (Nginx Alpine)
# Compressed Image footprint ~20MB
# =========================================================
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
