FROM node:20-alpine

WORKDIR /app

# Install Docker CLI for running k6 containers
RUN apk add --no-cache docker-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build Next.js application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]

