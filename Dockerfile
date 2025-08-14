# Multi-stage build for Forge WMS

# 1) Build frontend
FROM node:18-alpine AS build-frontend
WORKDIR /app
# Copy only frontend first for better caching
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY frontend ./frontend
RUN cd frontend && npm run build

# 2) Build server runtime
FROM node:18-alpine AS server
WORKDIR /app
# Copy server dependencies
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps || npm install --only=production --legacy-peer-deps
# Copy server code
COPY server.js ./server.js
# Copy data file if exists (optional)
COPY data.json ./data.json
# Copy frontend build output into expected path
COPY --from=build-frontend /app/frontend/build ./frontend/build

ENV NODE_ENV=production
ENV PORT=4000
# Optionally restrict CORS in production by setting CORS_ORIGIN
# ENV CORS_ORIGIN=https://yourdomain.com

EXPOSE 4000
CMD ["node", "server.js"]
