FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    imagemagick \
    libheif1 \
    libheif-examples \
    libde265-0 \
    build-essential

WORKDIR /app

COPY package.json ./
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install

COPY . .

EXPOSE 8080
CMD ["npm", "start"]
