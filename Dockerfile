# Use Debian-based Node.js image instead of Alpine
FROM node:18-slim

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=development
ENV HUSKY=0
ENV CI=true

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm pkg delete scripts.prepare && \
    npm ci --omit=dev && \
    npm cache clean --force

# Copy the rest of the application code
COPY . .

# Set user to non-root
USER node

# Expose the port the app runs on
EXPOSE 3000

# Health check - aumentado o intervalo e timeout para reduzir sobrecarga
HEALTHCHECK --interval=60s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health/system || exit 1

# Command to run the application with proper garbage collection settings
CMD ["node", "--max-old-space-size=512", "--expose-gc", "--gc-global", "src/server.js"]
