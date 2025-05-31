# Use Node.js 18 image, compatible with Mac M1
FROM node:18

# Set working directory
WORKDIR /app

# Install build tools for sqlite3 and bcrypt
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild native modules
RUN npm install && npm rebuild sqlite3 bcrypt --build-from-source

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
