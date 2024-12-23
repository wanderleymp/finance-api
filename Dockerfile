# Use Debian-based Node.js image instead of Alpine
FROM node:18-slim

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set Node.js configurations
ENV NODE_OPTIONS="--max-old-space-size=512"
ENV NODE_ENV=development

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production && \
    npm cache clean --force

# Copy the rest of the application code
COPY . .

# Set user to non-root
USER node

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Command to run the application with proper garbage collection settings
CMD ["node", "--expose-gc", "--gc-global", "src/server.js"]
