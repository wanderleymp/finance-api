# Use official Node.js LTS image
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++ gcc

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
