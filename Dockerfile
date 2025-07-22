FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    imagemagick \
    libheif1 \
    libheif-examples \
    libde265-0 \
    libheif-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Verify ImageMagick installation and HEIF support
RUN convert --version
RUN heif-convert --version

WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads

# Install Node.js
COPY package.json ./
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install

# Copy application files
COPY . .

# Ensure uploads directory has proper permissions
RUN chmod 755 uploads

EXPOSE 8080
CMD ["npm", "start"]
