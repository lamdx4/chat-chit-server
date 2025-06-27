# Use Node.js 18 Alpine as base image for smaller size
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Development stage
FROM node:22-alpine AS development
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install all dependencies (including dev dependencies)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 36363

# Start development server
CMD ["yarn", "dev"]

# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install all dependencies (including dev dependencies for building)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:22-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy production environment file
COPY .env.prod ./.env

# Create uploads directory and set permissions
RUN mkdir -p /app/dist/uploads && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (from your .env.prod file)
EXPOSE 36363

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 36363, path: '/api/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();" || exit 1

# Start the application
CMD ["yarn", "start"]
