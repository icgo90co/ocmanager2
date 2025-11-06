# Build stage - compile production assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

# Copy source code
COPY . .

# Build production assets
RUN npm run build

# Production stage - serve with static file server
FROM node:20-alpine AS production

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5173

# Serve production build on port 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
