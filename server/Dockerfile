# Stage 1: Build the React Client
FROM node:22-alpine as client-build
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
# Remove robotjs from client deps (not needed for web)
RUN npm pkg delete dependencies.robotjs
RUN npm install

# Copy client source
COPY client/ .
RUN npx vite build

# Stage 2: Final Server Image
FROM node:22-alpine
WORKDIR /app

# Copy server package files
COPY server/package*.json ./
RUN npm install --production

# Copy server source
COPY server/ .

# Copy built client assets from stage 1
# The server code expects ../client/dist relative to /app/server.js
# /app/../client/dist resolves to /client/dist
COPY --from=client-build /app/client/dist /client/dist

# Expose port 3000 (Cloud Run expects 8080 usually, but we can configure it)
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
