FROM node:18-slim

# Install ImageMagick and libheif
RUN apt-get update && apt-get install -y \
  imagemagick \
  libheif-dev \
  && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy files
COPY package*.json ./
RUN npm install

COPY . .

# Start server
CMD ["node", "index.js"]
