# Use Alpine for small image size
FROM node:alpine3.20

# Set working directory
WORKDIR /app

# Copy only package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all other files
COPY . .

# Build the project (only if using Next.js or similar)
RUN npm run build

# Expose the correct port (3000 is default for Next.js)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]
