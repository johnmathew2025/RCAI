# RCA Platform - Universal Protocol Standard Compliant Dockerfile
FROM node:20-alpine AS base

# Install Python and build dependencies
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pyproject.toml ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Install Python dependencies
RUN pip3 install pandas numpy scipy scikit-learn matplotlib --break-system-packages

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Create uploads directory
RUN mkdir -p uploads

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["npm", "start"]