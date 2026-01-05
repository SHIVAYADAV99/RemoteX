FROM node:18-alpine

WORKDIR /app

# Copy only the server script
COPY signaling-server.js ./

# Install ONLY the signaling server dependencies (relieving the need for robotjs or python)
RUN npm install express socket.io

# Expose the signaling port
EXPOSE 3001

# Set the PORT environment variable
ENV PORT=3001

# Run the server
CMD ["node", "signaling-server.js"]
