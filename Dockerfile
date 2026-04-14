# Use a lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package manifests and install dependencies first for better caching
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Expose the port the app listens on
EXPOSE 5000

# Use the start script defined in package.json
CMD ["npm", "start"]
