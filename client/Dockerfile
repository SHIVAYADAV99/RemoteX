# Build stage
FROM node:22-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Remove robotjs from dependencies as it's only for the Electron host
# and requires native compilation which fails in this web-only container.
RUN npm pkg delete dependencies.robotjs

# Install dependencies (only web-compatible ones now)
RUN npm install

# Copy source code
COPY . .

# Build the web app (vite build)
RUN npx vite build

# Production stage
FROM nginx:stable-alpine

# Copy build output to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
