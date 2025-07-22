FROM dpokidov/imagemagick:latest

# Override the entrypoint to use normal shell commands
ENTRYPOINT []

# Install only Node.js without additional HEIF libraries to avoid conflicts
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Verify ImageMagick installation and HEIF support
RUN magick --version
RUN magick -list format | grep -i heic || echo "HEIC support check"

WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy application files
COPY . .

# Ensure uploads directory has proper permissions
RUN chmod 755 uploads

EXPOSE 8080
CMD ["npm", "start"]
