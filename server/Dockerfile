FROM node:20-slim

WORKDIR /app

# Download Fairy Stockfish Linux binary
RUN apt-get update && apt-get install -y wget && \
    wget -O fairy-stockfish https://github.com/fairy-stockfish/Fairy-Stockfish/releases/download/fairy_sf_14_0_1_xiangqi/fairy-stockfish-largeboard_x86-64 && \
    chmod +x fairy-stockfish && \
    apt-get remove -y wget && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Build
RUN npm run build

ENV PIKAFISH_PATH=/app/fairy-stockfish
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
